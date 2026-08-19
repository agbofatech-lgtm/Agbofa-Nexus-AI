package repositories

import (
	"context"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/services/foundation/internal/domain"
)

type RefreshTokenRepository struct {
	db DB
}

func NewRefreshTokenRepository(db DB) *RefreshTokenRepository {
	return &RefreshTokenRepository{db: db}
}

func (r *RefreshTokenRepository) Create(ctx context.Context, token domain.RefreshToken) (domain.RefreshToken, error) {
	if token.ID == "" {
		id, err := newID()
		if err != nil {
			return domain.RefreshToken{}, err
		}
		token.ID = id
	}
	row := r.db.QueryRow(ctx, `
INSERT INTO refresh_tokens (id, user_id, tenant_id, token_hash, expires_at, revoked)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING created_at`,
		token.ID, token.UserID, token.TenantID, token.TokenHash, token.ExpiresAt, token.Revoked)
	if err := row.Scan(&token.CreatedAt); err != nil {
		return domain.RefreshToken{}, mapDB(err)
	}
	return token, nil
}

func (r *RefreshTokenRepository) GetByHash(ctx context.Context, tokenHash string) (domain.RefreshToken, error) {
	return scanRefresh(r.db.QueryRow(ctx, `
SELECT id, user_id, COALESCE(tenant_id::text, ''), token_hash, expires_at, revoked, created_at
FROM refresh_tokens WHERE token_hash = $1`, tokenHash))
}

func (r *RefreshTokenRepository) ListByUser(ctx context.Context, userID string) ([]domain.RefreshToken, error) {
	rows, err := r.db.Query(ctx, `
SELECT id, user_id, COALESCE(tenant_id::text, ''), token_hash, expires_at, revoked, created_at
FROM refresh_tokens WHERE user_id = $1 ORDER BY created_at`, userID)
	if err != nil {
		return nil, mapDB(err)
	}
	defer rows.Close()
	var out []domain.RefreshToken
	for rows.Next() {
		token, err := scanRefresh(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, token)
	}
	return out, rows.Err()
}

func (r *RefreshTokenRepository) Revoke(ctx context.Context, id string) error {
	tag, err := r.db.Exec(ctx, `UPDATE refresh_tokens SET revoked = true WHERE id = $1`, id)
	if err != nil {
		return mapDB(err)
	}
	if tag.RowsAffected() == 0 {
		return database.ErrNotFound
	}
	return nil
}

func (r *RefreshTokenRepository) DeleteExpired(ctx context.Context, now time.Time) (int64, error) {
	tag, err := r.db.Exec(ctx, `DELETE FROM refresh_tokens WHERE expires_at <= $1`, now)
	if err != nil {
		return 0, mapDB(err)
	}
	return tag.RowsAffected(), nil
}

func scanRefresh(row interface{ Scan(dest ...any) error }) (domain.RefreshToken, error) {
	var token domain.RefreshToken
	if err := row.Scan(&token.ID, &token.UserID, &token.TenantID, &token.TokenHash, &token.ExpiresAt, &token.Revoked, &token.CreatedAt); err != nil {
		return domain.RefreshToken{}, mapDB(err)
	}
	return token, nil
}
