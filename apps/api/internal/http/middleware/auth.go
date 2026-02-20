package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/rapidtest/netpulse-api/internal/security"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type contextKey string

const (
	CtxUserID   contextKey = "user_id"
	CtxUserRole contextKey = "user_role"
)

// AuthMiddleware validates JWT tokens.
type AuthMiddleware struct {
	tokenSvc *security.TokenService
}

func NewAuthMiddleware(tokenSvc *security.TokenService) *AuthMiddleware {
	return &AuthMiddleware{tokenSvc: tokenSvc}
}

// Authenticate checks the Authorization header for a valid access token.
func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			utils.JSONError(w, http.StatusUnauthorized, "missing authorization header")
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			utils.JSONError(w, http.StatusUnauthorized, "invalid authorization format")
			return
		}

		claims, err := m.tokenSvc.ValidateAccessToken(parts[1])
		if err != nil {
			utils.JSONError(w, http.StatusUnauthorized, "invalid or expired token")
			return
		}

		ctx := context.WithValue(r.Context(), CtxUserID, claims.UserID)
		ctx = context.WithValue(ctx, CtxUserRole, claims.Role)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole returns middleware that checks for a specific role.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, ok := r.Context().Value(CtxUserRole).(string)
			if !ok {
				utils.JSONError(w, http.StatusForbidden, "forbidden")
				return
			}

			for _, allowed := range roles {
				if strings.EqualFold(role, allowed) {
					next.ServeHTTP(w, r)
					return
				}
			}

			utils.JSONError(w, http.StatusForbidden, "insufficient permissions")
		})
	}
}
