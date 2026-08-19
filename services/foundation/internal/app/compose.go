package app

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/auth"
	"github.com/agbofa/nexus/libs/go/pkg/config"
	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/services/foundation/internal/application"
	"github.com/agbofa/nexus/services/foundation/internal/authn"
	"github.com/agbofa/nexus/services/foundation/internal/domain"
	"github.com/agbofa/nexus/services/foundation/internal/handlers"
	"github.com/agbofa/nexus/services/foundation/internal/repositories"
	"github.com/agbofa/nexus/services/foundation/internal/server"
	"github.com/agbofa/nexus/services/foundation/migrations"
)

type Runtime struct {
	Config   config.RuntimeConfig
	Pool     *database.Pool
	HTTP     *server.HTTP
	Verifier *auth.Verifier
}

func Compose(ctx context.Context, cfg config.RuntimeConfig) (*Runtime, error) {
	pool, err := database.Open(ctx, cfg.Database)
	if err != nil {
		return nil, fmt.Errorf("database: %w", err)
	}
	if err := database.MigrateUp(ctx, pool, migrations.Files); err != nil {
		pool.Close()
		return nil, fmt.Errorf("migrate: %w", err)
	}
	tenants := repositories.NewTenantRepository(pool)
	tokens := authn.NewTokenService(cfg.JWT, repositories.NewRefreshTokenRepository(pool))
	svc := application.NewTenantIdentityService(tenants, authn.PasswordVerifier{}, tokens, noopEvents{})
	verifier, err := auth.NewVerifier(cfg.JWT, time.Now())
	if err != nil {
		pool.Close()
		return nil, err
	}
	httpSrv := server.NewHTTP(handlers.IdentityHTTP{Svc: svc, Tenants: tenants}, verifier, pool)
	return &Runtime{Config: cfg, Pool: pool, HTTP: httpSrv, Verifier: verifier}, nil
}

func (r *Runtime) Close() {
	if r != nil && r.Pool != nil {
		r.Pool.Close()
	}
}

type noopEvents struct{}

func (noopEvents) PublishTenantProvisioned(context.Context, domain.Tenant) error { return nil }
func (noopEvents) PublishUserCreated(context.Context, domain.User) error         { return nil }
func (noopEvents) PublishUserAuthenticated(context.Context, domain.User, time.Time) error {
	return nil
}
