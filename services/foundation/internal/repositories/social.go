package repositories

import (
	"context"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/libs/go/pkg/social"
)

type OAuthStateRow struct {
	Hash, TenantID, UserID, Platform, Redirect, VerifierEnc string
	ExpiresAt                                               time.Time
	Consumed                                                bool
}

type SocialStore struct{ db DB }

func NewSocialStore(db DB) *SocialStore { return &SocialStore{db: db} }

func (s *SocialStore) SaveState(ctx context.Context, row OAuthStateRow) error {
	_, err := s.db.Exec(ctx, `
INSERT INTO oauth_states (state_hash, tenant_id, user_id, platform, redirect_uri, pkce_verifier_encrypted, expires_at)
VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		row.Hash, row.TenantID, row.UserID, row.Platform, row.Redirect, row.VerifierEnc, row.ExpiresAt)
	return mapDB(err)
}

func (s *SocialStore) ConsumeState(ctx context.Context, hash string) (OAuthStateRow, error) {
	var row OAuthStateRow
	var consumed *time.Time
	err := s.db.QueryRow(ctx, `
SELECT state_hash, tenant_id::text, user_id::text, platform, redirect_uri, pkce_verifier_encrypted, expires_at, consumed_at
FROM oauth_states WHERE state_hash = $1`, hash).Scan(
		&row.Hash, &row.TenantID, &row.UserID, &row.Platform, &row.Redirect, &row.VerifierEnc, &row.ExpiresAt, &consumed)
	if err != nil {
		return OAuthStateRow{}, mapDB(err)
	}
	if consumed != nil {
		return row, social.ErrReplayState
	}
	if _, err := s.db.Exec(ctx, `UPDATE oauth_states SET consumed_at = now() WHERE state_hash = $1 AND consumed_at IS NULL`, hash); err != nil {
		return OAuthStateRow{}, mapDB(err)
	}
	return row, nil
}

type Connection struct {
	ID, TenantID, UserID, Platform, ProviderAccountID, AccountName, Status string
	EncAccess, EncRefresh, Scopes                                          string
	ExpiresAt                                                              *time.Time
}

func (s *SocialStore) UpsertConnection(ctx context.Context, c Connection) (Connection, error) {
	if c.ID == "" {
		id, err := newID()
		if err != nil {
			return Connection{}, err
		}
		c.ID = id
	}
	err := s.db.QueryRow(ctx, `
INSERT INTO social_connections (
    id, tenant_id, user_id, platform, provider_account_id, account_name, status,
    encrypted_access_token, encrypted_refresh_token, token_expires_at, scopes
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
ON CONFLICT (tenant_id, platform, provider_account_id) DO UPDATE SET
    encrypted_access_token = EXCLUDED.encrypted_access_token,
    encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
    token_expires_at = EXCLUDED.token_expires_at,
    scopes = EXCLUDED.scopes,
    status = 'ACTIVE',
    updated_at = now(),
    revoked_at = NULL
RETURNING id`,
		c.ID, c.TenantID, c.UserID, c.Platform, c.ProviderAccountID, c.AccountName, first(c.Status, "ACTIVE"),
		c.EncAccess, c.EncRefresh, c.ExpiresAt, c.Scopes).Scan(&c.ID)
	return c, mapDB(err)
}

func (s *SocialStore) ListConnections(ctx context.Context, tenantID string) ([]Connection, error) {
	rows, err := s.db.Query(ctx, `
SELECT id, tenant_id::text, user_id::text, platform, provider_account_id, account_name, status, scopes
FROM social_connections WHERE tenant_id = $1 AND status <> 'DISCONNECTED' ORDER BY created_at`, tenantID)
	if err != nil {
		return nil, mapDB(err)
	}
	defer rows.Close()
	var out []Connection
	for rows.Next() {
		var c Connection
		if err := rows.Scan(&c.ID, &c.TenantID, &c.UserID, &c.Platform, &c.ProviderAccountID, &c.AccountName, &c.Status, &c.Scopes); err != nil {
			return nil, mapDB(err)
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *SocialStore) GetConnection(ctx context.Context, tenantID, id string) (Connection, error) {
	var c Connection
	err := s.db.QueryRow(ctx, `
SELECT id, tenant_id::text, user_id::text, platform, provider_account_id, account_name, status,
       encrypted_access_token, encrypted_refresh_token, token_expires_at, scopes
FROM social_connections WHERE tenant_id = $1 AND id = $2`, tenantID, id).Scan(
		&c.ID, &c.TenantID, &c.UserID, &c.Platform, &c.ProviderAccountID, &c.AccountName, &c.Status,
		&c.EncAccess, &c.EncRefresh, &c.ExpiresAt, &c.Scopes)
	if err != nil {
		return Connection{}, mapDB(err)
	}
	return c, nil
}

func (s *SocialStore) Disconnect(ctx context.Context, tenantID, id string) error {
	tag, err := s.db.Exec(ctx, `
UPDATE social_connections SET status = 'DISCONNECTED', revoked_at = now(),
    encrypted_access_token = '', encrypted_refresh_token = '', updated_at = now()
WHERE tenant_id = $1 AND id = $2`, tenantID, id)
	if err != nil {
		return mapDB(err)
	}
	if tag.RowsAffected() == 0 {
		return database.ErrNotFound
	}
	return nil
}

func first(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}
