package repositories

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/config"
	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/services/foundation/internal/domain"
	"github.com/agbofa/nexus/services/foundation/migrations"
	"github.com/jackc/pgx/v5"
)

func testPool(t *testing.T) *database.Pool {
	t.Helper()
	url := os.Getenv("AGBOFA_TEST_DATABASE_URL")
	if url == "" {
		t.Fatalf("BLOCKED: AGBOFA_TEST_DATABASE_URL is required for PROD-01 PostgreSQL integration tests")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	t.Cleanup(cancel)
	pool, err := database.Open(ctx, config.DatabaseConfig{
		URL:          config.NewSecret("database/url", url),
		MaxConns:     4,
		MinConns:     0,
		QueryTimeout: 5 * time.Second,
	})
	if err != nil {
		t.Fatalf("open pool: %v", err)
	}
	t.Cleanup(pool.Close)
	if err := database.MigrateUp(ctx, pool, migrations.Files); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return pool
}

func sampleConfig() domain.TenantConfig {
	return domain.TenantConfig{DefaultRegion: "accra", MaxUsers: 10, AllowedAuthProviders: []string{"email"}}
}

func TestPostgresConnectionAndMigrations(t *testing.T) {
	ctx := context.Background()
	pool := testPool(t)
	if err := pool.Ping(ctx); err != nil {
		t.Fatalf("ping: %v", err)
	}
	version, err := database.CurrentVersion(ctx, pool)
	if err != nil {
		t.Fatalf("version: %v", err)
	}
	if version < 20260819140000 {
		t.Fatalf("expected prod-01 migration, got %d", version)
	}
}

func TestPostgresTenantUserRefreshCRUD(t *testing.T) {
	ctx := context.Background()
	pool := testPool(t)
	tenants := NewTenantRepository(pool)
	users := NewUserRepository(pool)
	tokens := NewRefreshTokenRepository(pool)

	tenant, err := tenants.CreateTenant(ctx, domain.Tenant{Name: "prod01-" + mustID(), Config: sampleConfig()})
	if err != nil {
		t.Fatalf("create tenant: %v", err)
	}
	got, err := tenants.GetTenant(ctx, tenant.ID)
	if err != nil || got.Name != tenant.Name {
		t.Fatalf("get tenant: %+v %v", got, err)
	}
	byName, err := tenants.FindTenantByName(ctx, tenant.Name)
	if err != nil || byName == nil {
		t.Fatalf("find tenant: %v", err)
	}
	tenant.Config.MaxUsers = 25
	if _, err := tenants.UpdateTenant(ctx, tenant); err != nil {
		t.Fatalf("update tenant: %v", err)
	}
	if _, err := tenants.CreateTenant(ctx, domain.Tenant{Name: tenant.Name, Config: sampleConfig()}); !errors.Is(err, database.ErrDuplicate) {
		t.Fatalf("expected duplicate, got %v", err)
	}
	if _, err := tenants.GetTenant(ctx, "00000000-0000-4000-8000-000000000099"); !errors.Is(err, database.ErrNotFound) {
		t.Fatalf("expected not found, got %v", err)
	}

	user, err := users.CreateUser(ctx, domain.User{
		TenantID: tenant.ID, PrincipalName: "owner@agbofa.test", CredentialHash: "argon2id$test",
		Status: domain.UserStatusActive, Roles: []string{"TENANT_OWNER"},
	})
	if err != nil {
		t.Fatalf("create user: %v", err)
	}
	found, err := users.FindUserByPrincipal(ctx, tenant.ID, "owner@agbofa.test")
	if err != nil || found == nil || found.ID != user.ID {
		t.Fatalf("find user: %v", err)
	}
	missing, err := users.FindUserByPrincipal(ctx, tenant.ID, "nobody@agbofa.test")
	if err != nil || missing != nil {
		t.Fatalf("expected nil user, got %+v %v", missing, err)
	}
	if err := users.RecordLogin(ctx, user.ID, time.Now().UTC()); err != nil {
		t.Fatalf("record login: %v", err)
	}

	other, err := tenants.CreateTenant(ctx, domain.Tenant{Name: "prod01-other-" + mustID(), Config: sampleConfig()})
	if err != nil {
		t.Fatalf("other tenant: %v", err)
	}
	cross, err := users.FindUserByPrincipal(ctx, other.ID, "owner@agbofa.test")
	if err != nil || cross != nil {
		t.Fatalf("tenant-aware query leaked user: %+v %v", cross, err)
	}

	token, err := tokens.Create(ctx, domain.RefreshToken{
		UserID: user.ID, TenantID: tenant.ID, TokenHash: "hash-" + mustID(), ExpiresAt: time.Now().UTC().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("create refresh: %v", err)
	}
	if _, err := tokens.GetByHash(ctx, token.TokenHash); err != nil {
		t.Fatalf("get refresh: %v", err)
	}
	if err := tokens.Revoke(ctx, token.ID); err != nil {
		t.Fatalf("revoke: %v", err)
	}
	if _, err := tokens.Create(ctx, domain.RefreshToken{
		UserID: "00000000-0000-4000-8000-000000000099", TenantID: tenant.ID, TokenHash: "hash-orphan", ExpiresAt: time.Now().UTC().Add(time.Hour),
	}); !errors.Is(err, database.ErrConstraint) {
		t.Fatalf("expected FK violation, got %v", err)
	}
}

func TestPostgresConfigurationPolicyAudit(t *testing.T) {
	ctx := context.Background()
	pool := testPool(t)
	tenants := NewTenantRepository(pool)
	users := NewUserRepository(pool)
	configs := NewConfigurationRepository(pool)
	policies := NewPolicyRepository(pool)
	audits := NewAuthorizationAuditRepository(pool)

	tenant, err := tenants.CreateTenant(ctx, domain.Tenant{Name: "cfg-" + mustID(), Config: sampleConfig()})
	if err != nil {
		t.Fatalf("tenant: %v", err)
	}
	user, err := users.CreateUser(ctx, domain.User{TenantID: tenant.ID, PrincipalName: "admin@agbofa.test", Roles: []string{"TENANT_ADMIN"}})
	if err != nil {
		t.Fatalf("user: %v", err)
	}
	bundle, changes, err := configs.SetBundle(ctx, "ns-"+mustID(), map[string]string{"theme": "dark"}, "test")
	if err != nil || bundle.Version < 1 || len(changes) == 0 {
		t.Fatalf("set config: %+v %v %v", bundle, changes, err)
	}
	got, err := configs.GetBundle(ctx, bundle.Namespace)
	if err != nil || got.Values["theme"] != "dark" {
		t.Fatalf("get config: %+v %v", got, err)
	}
	if _, err := configs.GetBundle(ctx, "missing-"+mustID()); !errors.Is(err, database.ErrNotFound) {
		t.Fatalf("expected missing bundle, got %v", err)
	}
	policy, err := policies.Create(ctx, domain.RolePolicy{
		TenantID: tenant.ID, Role: "TENANT_ADMIN", Permissions: []domain.Permission{{Resource: "tenant", Action: "*"}},
	})
	if err != nil {
		t.Fatalf("policy: %v", err)
	}
	matched, err := policies.FindPoliciesForRoles(ctx, tenant.ID, []string{"TENANT_ADMIN"})
	if err != nil || len(matched) != 1 {
		t.Fatalf("find policies: %v %d", err, len(matched))
	}
	if err := audits.RecordDecision(ctx, domain.AuthorizationRequest{
		TenantID: tenant.ID, SubjectID: user.ID, Roles: []string{"TENANT_ADMIN"}, Resource: "tenant", Action: "read",
	}, domain.AuthorizationDecision{Allowed: true, Reason: "matched role policy", PolicyID: policy.ID}); err != nil {
		t.Fatalf("audit: %v", err)
	}
	records, err := audits.ListByTenant(ctx, tenant.ID)
	if err != nil || len(records) == 0 {
		t.Fatalf("list audit: %v", err)
	}
}

func TestPostgresTransactionsAndCancellation(t *testing.T) {
	ctx := context.Background()
	pool := testPool(t)
	name := "tx-" + mustID()
	err := pool.InTx(ctx, func(tx pgx.Tx) error {
		repo := NewTenantRepository(tx)
		if _, err := repo.CreateTenant(ctx, domain.Tenant{Name: name, Config: sampleConfig()}); err != nil {
			return err
		}
		return errors.New("force rollback")
	})
	if err == nil {
		t.Fatal("expected rollback error")
	}
	found, err := NewTenantRepository(pool).FindTenantByName(ctx, name)
	if err != nil {
		t.Fatalf("find after rollback: %v", err)
	}
	if found != nil {
		t.Fatal("rolled back tenant is still visible")
	}

	committed := "txc-" + mustID()
	if err := pool.InTx(ctx, func(tx pgx.Tx) error {
		_, err := NewTenantRepository(tx).CreateTenant(ctx, domain.Tenant{Name: committed, Config: sampleConfig()})
		return err
	}); err != nil {
		t.Fatalf("commit: %v", err)
	}
	found, err = NewTenantRepository(pool).FindTenantByName(ctx, committed)
	if err != nil || found == nil {
		t.Fatalf("committed tenant missing: %v", err)
	}

	canceled, cancel := context.WithCancel(ctx)
	cancel()
	if _, err := NewTenantRepository(pool).CreateTenant(canceled, domain.Tenant{Name: "canceled-" + mustID(), Config: sampleConfig()}); !errors.Is(err, database.ErrCanceled) && !errors.Is(err, context.Canceled) {
		t.Fatalf("expected cancellation, got %v", err)
	}
}

func TestPostgresForeignKeysAndIndexes(t *testing.T) {
	pool := testPool(t)
	var fks, indexes int
	if err := pool.QueryRow(context.Background(), `
SELECT COUNT(*) FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND constraint_name IN (
    'authorization_audit_log_tenant_fk',
    'authorization_audit_log_subject_fk',
    'authorization_audit_log_policy_fk'
  )`).Scan(&fks); err != nil || fks != 3 {
		t.Fatalf("expected 3 audit FKs, got %d %v", fks, err)
	}
	if err := pool.QueryRow(context.Background(), `
SELECT COUNT(*) FROM pg_indexes
WHERE indexname IN ('refresh_tokens_user_id_idx', 'authorization_audit_tenant_created_idx')`).Scan(&indexes); err != nil || indexes != 2 {
		t.Fatalf("expected required indexes, got %d %v", indexes, err)
	}
}
