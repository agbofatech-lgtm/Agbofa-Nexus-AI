package server

import (
	"context"
	"log"
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

func NewHTTP(identity handlers.IdentityHTTP, ai handlers.AIHTTP, social handlers.SocialHTTP, pub handlers.PublishingHTTP, auto handlers.AutonomyHTTP, verifier *auth.Verifier, pool *database.Pool) *HTTP {
	mux := http.NewServeMux()
	s := &HTTP{Mux: mux, Ready: func() bool { return pool.Ping(context.Background()) == nil }}
	public := map[string]struct{}{
		"/healthz": {},
		"/readyz": {},
		"/rpc/foundation.tenant_identity.v1.TenantIdentityService/AuthenticateUser": {},
		"/rpc/ai.v1.AIGateway/Health": {},
	}
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("X-Agbofa-Build", "rpc-diag-5e8ad11")
		w.WriteHeader(http.StatusOK)
	})
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
	mux.Handle("/rpc/social.v1.SocialService/Connect", rpcNamed("social.v1.SocialService/Connect", authorize("content", "create")(http.HandlerFunc(social.Connect))))
	mux.Handle("/rpc/social.v1.SocialService/Callback", rpcNamed("social.v1.SocialService/Callback", authorize("content", "create")(http.HandlerFunc(social.Callback))))
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
	mux.Handle("/rpc/autonomy.v1.AutonomyService/GetControl", authorize("autonomy", "read")(http.HandlerFunc(auto.GetControl)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/SetLevel", authorize("autonomy", "control")(http.HandlerFunc(auto.SetLevel)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/KillSwitch", authorize("autonomy", "control")(http.HandlerFunc(auto.KillSwitch)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/CreatePolicy", authorize("autonomy", "control")(http.HandlerFunc(auto.CreatePolicy)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/RequestApproval", authorize("content", "create")(http.HandlerFunc(auto.RequestApproval)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/DecideApproval", authorize("autonomy", "control")(http.HandlerFunc(auto.DecideApproval)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/SimulateRun", authorize("autonomy", "read")(http.HandlerFunc(auto.SimulateRun)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/ListRuns", authorize("autonomy", "read")(http.HandlerFunc(auto.ListRuns)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/CreateMemory", authorize("memory", "create")(http.HandlerFunc(auto.CreateMemory)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/ListMemories", authorize("memory", "read")(http.HandlerFunc(auto.ListMemories)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/ApplyMemoryAsPrivilege", authorize("memory", "create")(http.HandlerFunc(auto.ApplyMemoryAsPrivilege)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/CreateScenario", authorize("scenario", "create")(http.HandlerFunc(auto.CreateScenario)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/ListScenarios", authorize("scenario", "read")(http.HandlerFunc(auto.ListScenarios)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/Usage", authorize("cost", "read")(http.HandlerFunc(auto.Usage)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/Routing", authorize("cost", "read")(http.HandlerFunc(auto.Routing)))
	mux.Handle("/rpc/autonomy.v1.AutonomyService/Strategies", authorize("cost", "read")(http.HandlerFunc(auto.Strategies)))

	var h http.Handler = mux
	h = authenticate(verifier, public)(h)
	h = withCorrelation(h)
	h = recoverMW(h)
	s.Handler = h
	return s
}

func rpcNamed(name string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Agbofa-RPC", name)
		log.Printf("rpc reached name=%s method=%s path=%s", name, r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

func (s *HTTP) Shutdown(ctx context.Context, srv *http.Server) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	return srv.Shutdown(ctx)
}