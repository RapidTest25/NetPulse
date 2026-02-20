package bootstrap

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// InitLogger configures zerolog based on environment.
func InitLogger(env string) {
	zerolog.TimeFieldFormat = time.RFC3339

	if env == "development" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: "15:04:05"})
	} else {
		// Production: structured JSON
		log.Logger = zerolog.New(os.Stdout).With().Timestamp().Caller().Logger()
	}

	zerolog.SetGlobalLevel(zerolog.InfoLevel)
	if env == "development" {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	}
}
