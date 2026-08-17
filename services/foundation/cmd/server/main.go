// cmd/server/main.go -- Foundation HTTP health + TenantIdentity protobuf transport
//
// Identity transport is custom HTTP/1.1 unary protobuf (gRPC-Web compatible
// framing). It is not official grpc-go.
//
// IMP-BFF-AUTH-001
package main

import (
"context"
"fmt"
"net/http"
"os"
"os/signal"
"syscall"
"time"

"github.com/agbofa/nexus/services/foundation/internal/application"
"github.com/agbofa/nexus/services/foundation/internal/authjwt"
"github.com/agbofa/nexus/services/foundation/internal/domain"
"github.com/agbofa/nexus/services/foundation/internal/infrastructure"
"github.com/agbofa/nexus/services/foundation/internal/transport/identitygrpc"
)

func main() {
serviceName := getEnv("SERVICE_NAME", "agbofa-foundation")
serviceVersion := getEnv("SERVICE_VERSION", "1.0.0")
httpPort := getEnv("HTTP_PORT", "9091")
grpcPort := getEnv("GRPC_PORT", "9090")

fmt.Printf("Starting %s v%s...\n", serviceName, serviceVersion)

ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
defer cancel()

mux := http.NewServeMux()
mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
_, _ = w.Write([]byte(`{"status":"SERVING","service":"` + serviceName + `"}`))
})
mux.HandleFunc("/readyz", func(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
_, _ = w.Write([]byte(`{"status":"READY","service":"` + serviceName + `"}`))
})

identityMux := http.NewServeMux()
if err := wireIdentity(identityMux); err != nil {
fmt.Fprintf(os.Stderr, "identity transport disabled: %v\n", err)
identitygrpc.RegisterUnavailable(identityMux, "identity transport unavailable")
}

healthServer := &http.Server{
Addr:         "0.0.0.0:" + httpPort,
Handler:      mux,
ReadTimeout:  10 * time.Second,
WriteTimeout: 10 * time.Second,
}
identityServer := &http.Server{
Addr:         "0.0.0.0:" + grpcPort,
Handler:      identityMux,
ReadTimeout:  10 * time.Second,
WriteTimeout: 10 * time.Second,
}

errChan := make(chan error, 2)
go func() {
if err := healthServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
errChan <- err
}
}()
go func() {
if err := identityServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
errChan <- err
}
}()

select {
case <-ctx.Done():
fmt.Println("Shutdown signal received, initiating graceful shutdown...")
case err := <-errChan:
fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
os.Exit(1)
}

shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
defer shutdownCancel()
_ = healthServer.Shutdown(shutdownCtx)
_ = identityServer.Shutdown(shutdownCtx)
fmt.Println("Service stopped cleanly.")
}

func wireIdentity(mux *http.ServeMux) error {
key := os.Getenv("FOUNDATION_JWT_HMAC_KEY")
if len(key) < authjwt.MinHMACKeyBytes {
if key == "" {
return fmt.Errorf("FOUNDATION_JWT_HMAC_KEY is not set")
}
return fmt.Errorf("FOUNDATION_JWT_HMAC_KEY is shorter than %d bytes", authjwt.MinHMACKeyBytes)
}
cfg := authjwt.Config{
HMACKey:    []byte(key),
Issuer:     getEnv("FOUNDATION_JWT_ISSUER", "agbofa-foundation"),
Audience:   getEnv("FOUNDATION_JWT_AUDIENCE", "agbofa-nexus"),
AccessTTL:  time.Hour,
RefreshTTL: 7 * 24 * time.Hour,
}
store := infrastructure.NewMemoryIdentityStore()
seedDevIdentity(store)
identity := application.NewTenantIdentityService(
store,
infrastructure.NewSHA256CredentialVerifier(),
infrastructure.NewHMACTokenIssuer(cfg, store),
infrastructure.NoopEvents{},
)
identitygrpc.NewServer(identity, application.JWTConfigVerifier{Config: cfg}, store).Register(mux)
return nil
}

func seedDevIdentity(store *infrastructure.MemoryIdentityStore) {
tenantName := os.Getenv("FOUNDATION_DEV_TENANT_NAME")
principal := os.Getenv("FOUNDATION_DEV_PRINCIPAL")
hash := os.Getenv("FOUNDATION_DEV_CREDENTIAL_HASH")
if tenantName == "" || principal == "" || hash == "" {
return
}
tenantID := getEnv("FOUNDATION_DEV_TENANT_ID", "tenant-default")
store.SeedTenantAndUser(domain.Tenant{
ID:     tenantID,
Name:   tenantName,
Status: domain.TenantStatusActive,
Config: domain.TenantConfig{MaxUsers: 100, AllowedAuthProviders: []string{"email"}},
}, domain.User{
TenantID:       tenantID,
PrincipalName:  principal,
CredentialHash: hash,
Status:         domain.UserStatusActive,
Roles:          []string{"EDITOR"},
})
}

func getEnv(key, defaultVal string) string {
if v, ok := os.LookupEnv(key); ok && v != "" {
return v
}
return defaultVal
}
