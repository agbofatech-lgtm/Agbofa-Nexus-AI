package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/infrastructure"
)

func main() {
	log.Println("Starting AGB-NGE-MON-001 Social Media Monitor Agent Entry Point (IMP-017-A Batch 1)...")

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	// 1. Initialize platform registry
	registry := infrastructure.NewPlatformRegistry()

	// 2. Instantiate Social Media Monitor orchestrator (AGB-NGE-MON-001)
	socialMonitor := application.NewSocialMediaMonitor(nil, nil, nil, nil)

	// 3. Register source connector in registry
	if err := registry.RegisterSource(socialMonitor); err != nil {
		log.Fatalf("Fatal error registering AGB-NGE-MON-001 in registry: %v", err)
	}

	tenantID := os.Getenv("DEFAULT_TENANT_ID")
	if tenantID == "" {
		tenantID = "tenant-default"
	}

	// 4. Initialize all registered monitors for tenant
	if err := registry.InitializeAll(ctx, tenantID); err != nil {
		log.Fatalf("Fatal error initializing monitors for tenant %s: %v", tenantID, err)
	}

	// 5. Perform initial health check
	health, err := registry.HealthCheckAll(ctx)
	if err != nil {
		log.Printf("WARN: HealthCheckAll reported errors: %v", err)
	} else {
		for id, h := range health {
			log.Printf("Monitor status [%s]: %s (Latency: %dms)", id, h.Status, h.LatencyMs)
		}
	}

	log.Println("AGB-NGE-MON-001 Social Media Monitor running. Press Ctrl+C to stop.")

	<-ctx.Done()

	log.Println("Shutdown signal received. Shutting down platform registry...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := registry.ShutdownAll(shutdownCtx); err != nil {
		log.Printf("ERROR: ShutdownAll failed: %v", err)
	}
	fmt.Println("AGB-NGE-MON-001 stopped cleanly.")
}
