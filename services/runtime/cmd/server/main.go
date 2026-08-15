// cmd/server/main.go - Runtime AI Gateway server
// Wires Gemini, OpenAI, and Anthropic providers into AIGatewayService.
//
// IMP-AI-GATEWAY-001 - Batch 4
package main

import (
"context"
"fmt"
"net/http"
"os"
"os/signal"
"syscall"
"time"

"github.com/agbofa/nexus/libs/go/pkg/llm"
"github.com/agbofa/nexus/libs/go/pkg/llm/anthropic"
"github.com/agbofa/nexus/libs/go/pkg/llm/gemini"
"github.com/agbofa/nexus/libs/go/pkg/llm/openai"
"github.com/agbofa/nexus/services/runtime/internal/application"
"github.com/agbofa/nexus/services/runtime/internal/domain"
)

func main() {
serviceName := getEnv("SERVICE_NAME", "agbofa-runtime")
serviceVersion := getEnv("SERVICE_VERSION", "1.0.0")
httpPort := getEnv("HTTP_PORT", "9091")

fmt.Printf("Starting %s v%s...\n", serviceName, serviceVersion)

providers := buildProviders()

// Use in-memory model registry and prompt repo for now
modelRegistry := domain.NewInMemoryModelRegistry()
promptRepo := domain.NewInMemoryPromptRepo()
quotaManager := application.NewUnlimitedQuotaManager()
auditLogger := application.NewNoopAuditLogger()

_ = application.NewAIGatewayService(
providers,
modelRegistry,
promptRepo,
quotaManager,
auditLogger,
)

mux := http.NewServeMux()
mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
_, _ = w.Write([]byte(`{"status":"SERVING","service":"` + serviceName + `","providers":` + fmt.Sprint(len(providers)) + `}`))
})
mux.HandleFunc("/readyz", func(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
_, _ = w.Write([]byte(`{"status":"READY","service":"` + serviceName + `"}`))
})

server := &http.Server{
Addr:         "0.0.0.0:" + httpPort,
Handler:      mux,
ReadTimeout:  15 * time.Second,
WriteTimeout: 15 * time.Second,
}

ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
defer cancel()

go func() {
<-ctx.Done()
fmt.Println("Shutdown signal received...")
shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
defer shutdownCancel()
_ = server.Shutdown(shutdownCtx)
}()

fmt.Printf("Providers: %d registered\n", len(providers))
fmt.Printf("Health: http://localhost:%s/healthz\n", httpPort)

if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
os.Exit(1)
}
fmt.Println("Runtime stopped cleanly.")
}

func buildProviders() []llm.Provider {
var providers []llm.Provider

if p, err := gemini.NewFromEnv(); err == nil {
providers = append(providers, p)
fmt.Printf("  Gemini: registered\n")
} else {
fmt.Printf("  Gemini: skipped (%v)\n", err)
}

if p, err := openai.NewFromEnv(); err == nil {
providers = append(providers, p)
fmt.Printf("  OpenAI: registered\n")
} else {
fmt.Printf("  OpenAI: skipped (%v)\n", err)
}

if p, err := anthropic.NewFromEnv(); err == nil {
providers = append(providers, p)
fmt.Printf("  Anthropic: registered\n")
} else {
fmt.Printf("  Anthropic: skipped (%v)\n", err)
}

if len(providers) == 0 {
fmt.Println("WARNING: No providers registered. Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY.")
}

return providers
}

func getEnv(key, defaultVal string) string {
if v, ok := os.LookupEnv(key); ok && v != "" {
return v
}
return defaultVal
}
