package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/agbofa/nexus/libs/go/pkg/config"
	"github.com/agbofa/nexus/services/foundation/internal/app"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load(ctx, config.LoadOptions{})
	if err != nil {
		log.Fatalf("configuration: %v", err)
	}
	rt, err := app.Compose(ctx, cfg)
	if err != nil {
		log.Fatalf("compose: %v", err)
	}
	defer rt.Close()

	srv := &http.Server{Addr: cfg.HTTP.Addr, Handler: rt.HTTP.Handler, ReadHeaderTimeout: cfg.HTTP.ReadHeaderTimeout}
	go func() {
		log.Printf("foundation listening on %s", cfg.HTTP.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()
	<-ctx.Done()
	shutdown, cancel := context.WithTimeout(context.Background(), cfg.HTTP.ShutdownTimeout)
	defer cancel()
	_ = srv.Shutdown(shutdown)
}
