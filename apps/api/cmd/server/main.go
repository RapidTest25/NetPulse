package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rapidtest/netpulse-api/internal/bootstrap"
	"github.com/rapidtest/netpulse-api/internal/config"
	"github.com/rs/zerolog/log"
)

func main() {
	// Load config
	cfg := config.Load()

	// Bootstrap logger
	bootstrap.InitLogger(cfg.AppEnv)

	// Bootstrap database
	db, err := bootstrap.NewDB(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to database")
	}
	defer db.Close()

	// Bootstrap Redis
	rdb := bootstrap.NewRedis(cfg)
	defer rdb.Close()

	// Bootstrap HTTP server
	router := bootstrap.NewHTTP(cfg, db, rdb)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.APIPort),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		log.Info().Str("port", cfg.APIPort).Msg("API server starting")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server error")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("forced shutdown")
	}
	log.Info().Msg("server stopped")
}
