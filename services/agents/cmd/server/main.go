// cmd/server/main.go — Service Entry Point Template (IMP-017 & IMP-018 / Volume 22 Section 5.2)
package main

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/infrastructure"
	"github.com/agbofa/nexus/services/agents/internal/interfaces"
)

type ServiceConfig struct {
	ServiceName    string
	ServiceVersion string
	Environment    string
	GRPCPort       string
	HTTPPort       string
	MetricsPort    string
}

func defaultServiceConfig() ServiceConfig {
	return ServiceConfig{
		ServiceName:    getEnv("SERVICE_NAME", "agbofa-agents"),
		ServiceVersion: getEnv("SERVICE_VERSION", "1.0.0"),
		Environment:    getEnv("ENVIRONMENT", "development"),
		GRPCPort:       getEnv("GRPC_PORT", "9090"),
		HTTPPort:       getEnv("HTTP_PORT", "9091"),
		MetricsPort:    getEnv("METRICS_PORT", "9092"),
	}
}

func getEnv(key, defaultVal string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return defaultVal
}

func main() {
	cfg := defaultServiceConfig()
	fmt.Printf("Starting %s v%s (%s)\n", cfg.ServiceName, cfg.ServiceVersion, cfg.Environment)

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	// Initialize infrastructure dependencies
	rateLimiter := infrastructure.NewPlatformRateLimiter()
	apiClient := infrastructure.NewPlatformAPIClient(rateLimiter)
	eventBus := infrastructure.NewKafkaEventBus()
	aiGatewayClient := application.NewGRPCAIGatewayClient(getEnv("RUNTIME_GRPC_ENDPOINT", "localhost:9090"))
	neo4jClient := infrastructure.NewNeo4jGraphClient(getEnv("NEO4J_URI", "bolt://localhost:7687"))
	trendStore := infrastructure.NewTrendStoreAPIClient(getEnv("TREND_STORE_URI", "https://localhost:9095"))
	phase1Clients := infrastructure.NewPhase1GRPCClients(map[string]string{
		"factory":      "localhost:9090",
		"compliance":   "localhost:9090",
		"distribution": "localhost:9090",
		"analytics":    "localhost:9090",
		"operations":   "localhost:9090",
	})

	// Initialize application orchestrators
	monitorOrch := application.NewMonitorOrchestrator(apiClient, eventBus).WithAIGateway(aiGatewayClient)
	detectorOrch := application.NewDetectorOrchestrator(eventBus, aiGatewayClient)
	verificationOrch := application.NewVerificationOrchestrator(eventBus, aiGatewayClient)
	pipelineOrch := application.NewPipelineOrchestrator(eventBus, phase1Clients, neo4jClient)
	predictionOrch := application.NewPredictionOrchestrator(eventBus, phase1Clients, trendStore)
	personalizationOrch := application.NewPersonalizationOrchestrator(eventBus, phase1Clients)

	// Initialize gRPC and health endpoints
	grpcServer := interfaces.NewGRPCServer(monitorOrch, detectorOrch, verificationOrch, pipelineOrch, predictionOrch, cfg.GRPCPort).WithPersonalization(personalizationOrch)

	// Register all 5 engines with HealthChecker per REQ-019-012
	healthChecker := grpcServer.GetHealthChecker()
	for _, id := range []string{"PERS-001", "PERS-002", "PERS-003", "PERS-004", "PERS-005"} {
		if eng, err := personalizationOrch.GetEngine(id); err == nil && eng != nil {
			healthChecker.RegisterPersonalizationEngine(eng)
		}
	}

	errChan := make(chan error, 1)
	go func() {
		listener, err := net.Listen("tcp", fmt.Sprintf("0.0.0.0:%s", cfg.GRPCPort))
		if err != nil {
			errChan <- fmt.Errorf("failed to bind gRPC port %s: %w", cfg.GRPCPort, err)
			return
		}
		if err := grpcServer.Serve(listener); err != nil {
			errChan <- fmt.Errorf("gRPC server error: %w", err)
		}
	}()

	select {
	case <-ctx.Done():
		fmt.Println("Shutdown signal received, initiating graceful shutdown...")
	case err := <-errChan:
		fmt.Fprintf(os.Stderr, "Fatal server error: %v\n", err)
		os.Exit(1)
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := grpcServer.Stop(shutdownCtx); err != nil {
		fmt.Fprintf(os.Stderr, "failed to stop application gracefully: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("Service stopped cleanly.")
}
