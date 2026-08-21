package repositories

import (
	"context"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/libs/go/pkg/social"
	"github.com/jackc/pgx/v5"
)

type OAuthStateRow struct {
	Hash, TenantID, UserID, Platform, Redirect, VerifierEnc string
	ExpiresAt                                               time.Time
	Consumed                                                bool
}

type SocialStore struct{ db DB }

func NewSocialStore(db DB) *SocialStore { return &SocialStore{db: db} }

func (s *SocialStore) inTenant(ctx context.Context, tenantID string, fn func(DB) error) error {
	if tenantID == "" {
		return fn(s.db)
	}
	if p, ok := s.db.(*database.Pool); ok {
		return p.InTenantTx(ctx, tenantID, func(tx pgx.Tx) error { return fn(tx) })
	}
	return fn(s.db)
}

func (s *SocialStore) SaveState(ctx context.Context, row OAuthStateRow) error {
	return s.inTenant(ctx, row.TenantID, func(db DB) error {
		_, err := db.Exec(ctx, `
INSERT INTO oauth_states (state_hash, tenant_id, user_id, platform, redirect_uri, pkce_verifier_encrypted, expires_at)
VALUES ($1,$2,$3,$4,$5,$6,$7)`,
			row.Hash, row.TenantID, row.UserID, row.Platform, row.Redirect, row.VerifierEnc, row.ExpiresAt)
		return mapDB(err)
	})
}

func (s *SocialStore) GetState(ctx context.Context, hash, tenantID string) (OAuthStateRow, error) {
	var row OAuthStateRow
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		var consumed *time.Time
		qerr := db.QueryRow(ctx, `
SELECT state_hash, tenant_id::text, user_id::text, platform, redirect_uri, pkce_verifier_encrypted, expires_at, consumed_at
FROM oauth_states WHERE state_hash = $1 AND tenant_id::text = $2`, hash, tenantID).Scan(
			&row.Hash, &row.TenantID, &row.UserID, &row.Platform, &row.Redirect, &row.VerifierEnc, &row.ExpiresAt, &consumed)
		if qerr != nil {
			return mapDB(qerr)
		}
		row.Consumed = consumed != nil
		return nil
	})
	if err != nil {
		return OAuthStateRow{}, err
	}
	return row, nil
}

func (s *SocialStore) ConsumeState(ctx context.Context, hash, tenantID, userID string) (OAuthStateRow, error) {
	var row OAuthStateRow
	var consumedOK bool
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		var consumed *time.Time
		qerr := db.QueryRow(ctx, `
UPDATE oauth_states SET consumed_at = now()
WHERE state_hash = $1 AND tenant_id::text = $2 AND user_id::text = $3
  AND consumed_at IS NULL AND expires_at > now()
RETURNING state_hash, tenant_id::text, user_id::text, platform, redirect_uri, pkce_verifier_encrypted, expires_at, consumed_at`,
			hash, tenantID, userID).Scan(
			&row.Hash, &row.TenantID, &row.UserID, &row.Platform, &row.Redirect, &row.VerifierEnc, &row.ExpiresAt, &consumed)
		if qerr == nil {
			row.Consumed = true
			consumedOK = true
			return nil
		}
		return mapDB(qerr)
	})
	if consumedOK {
		return row, nil
	}
	existing, getErr := s.GetState(ctx, hash, tenantID)
	if getErr != nil {
		return OAuthStateRow{}, social.ErrInvalidState
	}
	if existing.Consumed {
		return existing, social.ErrReplayState
	}
	if existing.TenantID != tenantID {
		return existing, social.ErrStateTenant
	}
	if existing.UserID != userID {
		return existing, social.ErrStateUser
	}
	if !existing.ExpiresAt.After(time.Now().UTC()) {
		return existing, social.ErrExpiredState
	}
	if err != nil {
		return existing, err
	}
	return existing, social.ErrInvalidState
}

func (s *SocialStore) UpdateTokens(ctx context.Context, tenantID, id, encAccess, encRefresh string, exp *time.Time) error {
	var affected int64
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		tag, err := db.Exec(ctx, `
UPDATE social_connections SET
    encrypted_access_token = $3,
    encrypted_refresh_token = CASE WHEN $4 <> '' THEN $4 ELSE encrypted_refresh_token END,
    token_expires_at = $5,
    last_refresh_at = now(),
    updated_at = now()
WHERE tenant_id::text = $1 AND id = $2 AND status NOT IN ('DISCONNECTED','REVOKED')`, tenantID, id, encAccess, encRefresh, exp)
		if err != nil {
			return mapDB(err)
		}
		affected = tag.RowsAffected()
		return nil
	})
	if err != nil {
		return err
	}
	if affected == 0 {
		return database.ErrNotFound
	}
	return nil
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
	err := s.inTenant(ctx, c.TenantID, func(db DB) error {
		return db.QueryRow(ctx, `
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
	})
	return c, err
}

func (s *SocialStore) ListConnections(ctx context.Context, tenantID string) ([]Connection, error) {
	var out []Connection
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		rows, err := db.Query(ctx, `
SELECT id, tenant_id::text, user_id::text, platform, provider_account_id, account_name, status, scopes
FROM social_connections WHERE tenant_id::text = $1 AND status <> 'DISCONNECTED' ORDER BY created_at`, tenantID)
		if err != nil {
			return mapDB(err)
		}
		defer rows.Close()
		for rows.Next() {
			var c Connection
			if err := rows.Scan(&c.ID, &c.TenantID, &c.UserID, &c.Platform, &c.ProviderAccountID, &c.AccountName, &c.Status, &c.Scopes); err != nil {
				return mapDB(err)
			}
			out = append(out, c)
		}
		return rows.Err()
	})
	return out, err
}

func (s *SocialStore) GetConnection(ctx context.Context, tenantID, id string) (Connection, error) {
	var c Connection
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		return db.QueryRow(ctx, `
SELECT id, tenant_id::text, user_id::text, platform, provider_account_id, account_name, status,
       encrypted_access_token, encrypted_refresh_token, token_expires_at, scopes
FROM social_connections WHERE tenant_id::text = $1 AND id = $2`, tenantID, id).Scan(
			&c.ID, &c.TenantID, &c.UserID, &c.Platform, &c.ProviderAccountID, &c.AccountName, &c.Status,
			&c.EncAccess, &c.EncRefresh, &c.ExpiresAt, &c.Scopes)
	})
	if err != nil {
		return Connection{}, mapDB(err)
	}
	return c, nil
}

func (s *SocialStore) Disconnect(ctx context.Context, tenantID, id string) error {
	var affected int64
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		tag, err := db.Exec(ctx, `
UPDATE social_connections SET status = 'DISCONNECTED', revoked_at = now(),
    encrypted_access_token = '', encrypted_refresh_token = '', updated_at = now()
WHERE tenant_id::text = $1 AND id = $2`, tenantID, id)
		if err != nil {
			return mapDB(err)
		}
		affected = tag.RowsAffected()
		return nil
	})
	if err != nil {
		return err
	}
	if affected == 0 {
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
