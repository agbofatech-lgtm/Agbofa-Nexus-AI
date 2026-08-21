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

func NewHTTP(identity handlers.IdentityHTTP, ai handlers.AIHTTP, social handlers.SocialHTTP, pub handlers.PublishingHTTP, verifier *auth.Verifier, pool *database.Pool) *HTTP {
	mux := http.NewServeMux()
	s := &HTTP{Mux: mux, Ready: func() bool { return pool.Ping(context.Background()) == nil }}
	public := map[string]struct{}{
		"/healthz": {},
		"/readyz": {},
		"/rpc/foundation.tenant_identity.v1.TenantIdentityService/AuthenticateUser": {},
		"/rpc/ai.v1.AIGateway/Health": {},
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
	mux.Handle("/rpc/social.v1.SocialService/Connect", authorize("content", "create")(http.HandlerFunc(social.Connect)))
	mux.Handle("/rpc/social.v1.SocialService/Callback", authorize("content", "create")(http.HandlerFunc(social.Callback)))
	mux.Handle("/rpc/social.v1.SocialService/Accounts", authorize("content", "read")(http.HandlerFunc(social.Accounts)))
	mux.Handle("/rpc/social.v1.SocialService/Disconnect", authorize("content", "create")(http.HandlerFunc(social.Disconnect)))
	mux.Handle("/rpc/social.v1.SocialService/CreateDistribution", authorize("content", "create")(http.HandlerFunc(social.CreateDistribution)))
	mux.Handle("/rpc/social.v1.SocialService/ListDistributions", authorize("content", "read")(http.HandlerFunc(social.ListDistributions)))
	mux.Handle("/rpc/social.v1.SocialService/CancelDistribution", authorize("content", "create")(http.HandlerFunc(social.Cancel)))
	mux.Handle("/rpc/publish.v1.PublishingService/Schedule", authorize("content", "create")(http.HandlerFunc(pub.Schedule)))
	mux.Handle("/rpc/publish.v1.PublishingService/Approve", authorize("content", "create")(http.HandlerFunc(pub.Approve)))
	mux.Handle("/rpc/publish.v1.PublishingService/Cancel", authorize("content", "create")(http.HandlerFunc(pub.Cancel)))
	mux.Handle("/rpc/publish.v1.PublishingService/Get", authorize("content", "read")(http.HandlerFunc(pub.Get)))
	mux.Handle("/rpc/publish.v1.PublishingService/Tick", authorize("content", "create")(http.HandlerFunc(pub.Tick)))

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