package app

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/auth"
	"github.com/agbofa/nexus/libs/go/pkg/config"
	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/libs/go/pkg/publish"
	"github.com/agbofa/nexus/libs/go/pkg/social"
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
	autoStore := repositories.NewAutonomyStore(pool)
	aiSettings := llm.LoadSettings(ctx, nil)
	gateway := llm.NewGateway(
		llm.DefaultRegistry(),
		aiSettings.Providers(),
		llm.WithTimeout(aiSettings.Timeout),
		llm.WithRetries(aiSettings.Retries),
		llm.WithUsageSink(&ledgerSink{mem: llm.NewMemoryUsage(), store: autoStore}),
	)
	tokenKey := os.Getenv("AGBOFA_SECRET_SOCIAL_TOKEN_KEY")
	box, err := social.NewTokenBox(tokenKey)
	if err != nil {
		pool.Close()
		return nil, fmt.Errorf("social token box (AGBOFA_SECRET_SOCIAL_TOKEN_KEY chars=%d): %w", len(strings.TrimSpace(tokenKey)), err)
	}
	jobs := repositories.NewDistStore(pool)
	socialStore := repositories.NewSocialStore(pool)
	adapters := social.NewDefaultRouter(http.DefaultClient)
	socialHTTP := handlers.SocialHTTP{Store: socialStore, Jobs: jobs, Box: box, Adapters: adapters}
	worker := &publish.Worker{
		Store: jobs, Adapter: adapters, WorkerID: "foundation-1", MaxTries: 5,
		Tokens: loadConnectionTokens(socialStore, box, adapters),
	}
	pubHTTP := handlers.PublishingHTTP{Jobs: jobs, Social: socialStore, Worker: worker, Autonomy: autoStore}
	autoHTTP := handlers.AutonomyHTTP{Store: autoStore, Registry: llm.DefaultRegistry()}
	httpSrv := server.NewHTTP(
		handlers.IdentityHTTP{Svc: svc, Tenants: tenants},
		handlers.AIHTTP{Gateway: gateway},
		socialHTTP,
		pubHTTP,
		autoHTTP,
		verifier,
		pool,
	)
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

type ledgerSink struct {
	mem   *llm.MemoryUsage
	store *repositories.AutonomyStore
}

func (s *ledgerSink) Record(ctx context.Context, req llm.Request, res llm.Response, err error) {
	if s.mem != nil {
		s.mem.Record(ctx, req, res, err)
	}
	if s.store == nil || req.TenantID == "" {
		return
	}
	_ = s.store.RecordUsage(ctx, req.TenantID, req.SubjectID, res.Provider, req.Model, "complete", req.CorrelationID, res.Usage.PromptTokens, res.Usage.CompletionTokens, res.Cost.EstimatedMicros, "ESTIMATED")
}

func loadConnectionTokens(store *repositories.SocialStore, box *social.TokenBox, adapters *social.Router) func(context.Context, publish.Job) (social.TokenSet, error) {
	return func(ctx context.Context, job publish.Job) (social.TokenSet, error) {
		if box == nil || store == nil {
			return social.TokenSet{}, social.ErrReauthRequired
		}
		conn, err := store.GetConnection(ctx, job.TenantID, job.AccountID)
		if err != nil {
			return social.TokenSet{}, social.ErrReauthRequired
		}
		status := strings.ToUpper(conn.Status)
		if status == "DISCONNECTED" || status == "REVOKED" {
			return social.TokenSet{}, social.ErrReauthRequired
		}
		access, err := box.Open(conn.EncAccess)
		if err != nil || access == "" {
			return social.TokenSet{}, social.ErrReauthRequired
		}
		refresh := ""
		if conn.EncRefresh != "" {
			refresh, _ = box.Open(conn.EncRefresh)
		}
		tokens := social.TokenSet{
			AccessToken: access, RefreshToken: refresh,
			AccountID: conn.ProviderAccountID, AccountName: conn.AccountName,
			Scopes: strings.Fields(conn.Scopes),
		}
		if conn.ExpiresAt != nil {
			tokens.ExpiresAt = *conn.ExpiresAt
		}
		expired := conn.ExpiresAt != nil && !time.Now().UTC().Before(conn.ExpiresAt.Add(-60*time.Second))
		if !expired {
			return tokens, nil
		}
		if refresh == "" || adapters == nil {
			return social.TokenSet{}, social.ErrReauthRequired
		}
		adapter, ok := adapters.For(social.Platform(job.Platform))
		if !ok {
			return social.TokenSet{}, social.ErrReauthRequired
		}
		refreshed, err := adapter.Refresh(ctx, refresh)
		if err != nil || refreshed.AccessToken == "" {
			return social.TokenSet{}, social.ErrReauthRequired
		}
		encAccess, err := box.Seal(refreshed.AccessToken)
		if err != nil {
			return social.TokenSet{}, social.ErrReauthRequired
		}
		encRefresh := ""
		if refreshed.RefreshToken != "" {
			encRefresh, err = box.Seal(refreshed.RefreshToken)
			if err != nil {
				return social.TokenSet{}, social.ErrReauthRequired
			}
		}
		var exp *time.Time
		if !refreshed.ExpiresAt.IsZero() {
			e := refreshed.ExpiresAt
			exp = &e
		}
		if err := store.UpdateTokens(ctx, job.TenantID, conn.ID, encAccess, encRefresh, exp); err != nil {
			return social.TokenSet{}, social.ErrReauthRequired
		}
		return refreshed, nil
	}
}
