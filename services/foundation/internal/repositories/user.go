package repositories

import (
	"context"
	"encoding/json"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/services/foundation/internal/domain"
)

type UserRepository struct {
	db DB
}

func NewUserRepository(db DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(ctx context.Context, user domain.User) (domain.User, error) {
	if user.ID == "" {
		id, err := newID()
		if err != nil {
			return domain.User{}, err
		}
		user.ID = id
	}
	if user.Status == "" {
		user.Status = domain.UserStatusPasswordResetRequired
	}
	if user.Roles == nil {
		user.Roles = []string{}
	}
	roles, err := json.Marshal(user.Roles)
	if err != nil {
		return domain.User{}, err
	}
	var hash any
	if user.CredentialHash != "" {
		hash = user.CredentialHash
	}
	row := r.db.QueryRow(ctx, `
INSERT INTO users (id, tenant_id, principal_name, credential_hash, status, roles)
VALUES ($1, $2, $3, $4, $5, $6::jsonb)
RETURNING created_at, last_login_at`,
		user.ID, user.TenantID, user.PrincipalName, hash, string(user.Status), roles)
	if err := row.Scan(&user.CreatedAt, &user.LastLoginAt); err != nil {
		return domain.User{}, mapDB(err)
	}
	return user, nil
}

func (r *UserRepository) FindUserByPrincipal(ctx context.Context, tenantID string, principalName string) (*domain.User, error) {
	user, err := scanUser(r.db.QueryRow(ctx, `
SELECT id, tenant_id, principal_name, COALESCE(credential_hash, ''), status, roles, created_at, last_login_at
FROM users WHERE tenant_id = $1 AND principal_name = $2`, tenantID, principalName))
	if err != nil {
		if err == database.ErrNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetUser(ctx context.Context, id string) (domain.User, error) {
	return scanUser(r.db.QueryRow(ctx, `
SELECT id, tenant_id, principal_name, COALESCE(credential_hash, ''), status, roles, created_at, last_login_at
FROM users WHERE id = $1`, id))
}

func (r *UserRepository) UpdateUser(ctx context.Context, user domain.User) (domain.User, error) {
	roles, err := json.Marshal(user.Roles)
	if err != nil {
		return domain.User{}, err
	}
	var hash any
	if user.CredentialHash != "" {
		hash = user.CredentialHash
	}
	row := r.db.QueryRow(ctx, `
UPDATE users
SET principal_name = $2, credential_hash = $3, status = $4, roles = $5::jsonb
WHERE id = $1
RETURNING created_at, last_login_at`,
		user.ID, user.PrincipalName, hash, string(user.Status), roles)
	if err := row.Scan(&user.CreatedAt, &user.LastLoginAt); err != nil {
		return domain.User{}, mapDB(err)
	}
	return user, nil
}

func (r *UserRepository) DeleteUser(ctx context.Context, id string) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return mapDB(err)
	}
	if tag.RowsAffected() == 0 {
		return database.ErrNotFound
	}
	return nil
}

func (r *UserRepository) RecordLogin(ctx context.Context, userID string, occurredAt time.Time) error {
	tag, err := r.db.Exec(ctx, `UPDATE users SET last_login_at = $2 WHERE id = $1`, userID, occurredAt)
	if err != nil {
		return mapDB(err)
	}
	if tag.RowsAffected() == 0 {
		return database.ErrNotFound
	}
	return nil
}

func scanUser(row interface{ Scan(dest ...any) error }) (domain.User, error) {
	var user domain.User
	var status string
	var raw []byte
	if err := row.Scan(&user.ID, &user.TenantID, &user.PrincipalName, &user.CredentialHash, &status, &raw, &user.CreatedAt, &user.LastLoginAt); err != nil {
		return domain.User{}, mapDB(err)
	}
	user.Status = domain.UserStatus(status)
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &user.Roles); err != nil {
			return domain.User{}, err
		}
	}
	return user, nil
}
