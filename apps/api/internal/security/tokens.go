package security

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/rapidtest/netpulse-api/internal/config"
)

// TokenClaims contains the JWT claims we care about.
type TokenClaims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}

// TokenService handles JWT operations.
type TokenService struct {
	accessSecret  []byte
	refreshSecret []byte
	accessExpiry  time.Duration
	refreshExpiry time.Duration
}

func NewTokenService(cfg *config.Config) *TokenService {
	return &TokenService{
		accessSecret:  []byte(cfg.JWTAccessSecret),
		refreshSecret: []byte(cfg.JWTRefreshSecret),
		accessExpiry:  cfg.JWTAccessExpiry,
		refreshExpiry: cfg.JWTRefreshExpiry,
	}
}

type customClaims struct {
	UserID string `json:"uid"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateAccessToken creates a short-lived access JWT.
func (s *TokenService) GenerateAccessToken(userID, role string) (string, error) {
	claims := customClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.accessExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "netpulse",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.accessSecret)
}

// GenerateRefreshToken creates a long-lived refresh JWT.
func (s *TokenService) GenerateRefreshToken(userID, role string) (string, error) {
	claims := customClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.refreshExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "netpulse",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.refreshSecret)
}

// ValidateAccessToken validates and parses an access JWT.
func (s *TokenService) ValidateAccessToken(tokenStr string) (*TokenClaims, error) {
	return s.validate(tokenStr, s.accessSecret)
}

// ValidateRefreshToken validates and parses a refresh JWT.
func (s *TokenService) ValidateRefreshToken(tokenStr string) (*TokenClaims, error) {
	return s.validate(tokenStr, s.refreshSecret)
}

func (s *TokenService) validate(tokenStr string, secret []byte) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &customClaims{}, func(t *jwt.Token) (interface{}, error) {
		return secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*customClaims)
	if !ok || !token.Valid {
		return nil, jwt.ErrTokenInvalidClaims
	}

	return &TokenClaims{
		UserID: claims.UserID,
		Role:   claims.Role,
	}, nil
}

// AccessExpiry returns the expiry duration for access tokens.
func (s *TokenService) AccessExpiry() time.Duration {
	return s.accessExpiry
}

// RefreshExpiry returns the expiry duration for refresh tokens.
func (s *TokenService) RefreshExpiry() time.Duration {
	return s.refreshExpiry
}
