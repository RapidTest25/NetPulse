package config

import (
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

// Load reads environment variables and returns a Config.
func Load() *Config {
	// Load .env file if exists (dev only)
	// Try current dir, then project root (../../.env when running from apps/api/)
	if err := godotenv.Load(); err != nil {
		if err2 := godotenv.Load("../../.env"); err2 != nil {
			log.Debug().Msg(".env file not found, using system env")
		}
	}

	return &Config{
		AppEnv:  getEnv("APP_ENV", "development"),
		AppName: getEnv("APP_NAME", "NetPulse"),

		PostgresHost:     getEnv("POSTGRES_HOST", "localhost"),
		PostgresPort:     getEnv("POSTGRES_PORT", "5432"),
		PostgresUser:     getEnv("POSTGRES_USER", "netpulse"),
		PostgresPassword: getEnv("POSTGRES_PASSWORD", "changeme_postgres"),
		PostgresDB:       getEnv("POSTGRES_DB", "netpulse"),

		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),

		APIPort:  getEnv("API_PORT", "8080"),
		BaseURL:  getEnv("API_BASE_URL", "http://localhost:8080"),

		JWTAccessSecret:  getEnv("JWT_ACCESS_SECRET", "dev-access-secret"),
		JWTRefreshSecret: getEnv("JWT_REFRESH_SECRET", "dev-refresh-secret"),
		JWTAccessExpiry:  getEnvDuration("JWT_ACCESS_EXPIRY", 15*time.Minute),
		JWTRefreshExpiry: getEnvDuration("JWT_REFRESH_EXPIRY", 720*time.Hour),

		EncryptionKey: getEnv("ENCRYPTION_KEY", ""),
		MediaStorage:  getEnv("MEDIA_STORAGE", "local"),

		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/auth/google/callback"),
	}
}
