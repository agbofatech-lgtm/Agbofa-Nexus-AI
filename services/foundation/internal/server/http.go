package server

import (
	"context"
	"net/http"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/auth"
	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/services/foundation/internal/handlers"
)

type HTTP struct {
	Mux     *http.ServeMux
	Ready   func() bool
	Handler http.Handler
}

func NewHTTP(identity handlers.IdentityHTTP, ai handlers.AIHTTP, verifier *auth.Verifier, pool *database.Pool) *HTTP {
	mux := http.NewServeMux()
	s := &HTTP{Mux: mux, Ready: func() bool { return pool.Ping(context.Background()) == nil }}
	public := map[string]struct{}{
		"/healthz": true, "/readyz": true,
		"/rpc/foundation.tenant_identity.v1.TenantIdentityService/AuthenticateUser": true,
		"/rpc/ai.v1.AIGateway/Health": true,
	}
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })
	mux.HandleFunc("/readyz", func(w http.ResponseWriter, _ *http.Request) {
		if !s.Ready() {
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("/rpc/foundation.tenant_identity.v1.TenantIdentityService/AuthenticateUser", identity.AuthenticateUser)
	mux.Handle("/rpc/foundation.tenant_identity.v1.TenantIdentityService/GetTenant", authorize("tenant", "read")(http.HandlerFunc(identity.GetTenant)))
	mux.HandleFunc("/rpc/ai.v1.AIGateway/Health", ai.Health)
	mux.Handle("/rpc/ai.v1.AIGateway/Complete", authorize("content", "create")(http.HandlerFunc(ai.Complete)))

	var h http.Handler = mux
	h = authenticate(verifier, public)(h)
	h = withCorrelation(h)
	h = recoverMW(h)
	s.Handler = h
	return s
}

func (s *HTTP) Shutdown(ctx context.Context, srv *http.Server) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	return srv.Shutdown(ctx)
}
