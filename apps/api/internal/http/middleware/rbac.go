package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

const CtxPermissions contextKey = "user_permissions"

// PermissionLoader loads and caches user permissions in context.
type PermissionLoader struct {
	db *pgxpool.Pool
}

func NewPermissionLoader(db *pgxpool.Pool) *PermissionLoader {
	return &PermissionLoader{db: db}
}

// LoadPermissions middleware loads user permissions after authentication.
func (pl *PermissionLoader) LoadPermissions(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(CtxUserID).(string)
		if !ok || userID == "" {
			next.ServeHTTP(w, r)
			return
		}

		perms := pl.loadPerms(r.Context(), userID)
		ctx := context.WithValue(r.Context(), CtxPermissions, perms)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (pl *PermissionLoader) loadPerms(ctx context.Context, userID string) []string {
	rows, err := pl.db.Query(ctx, `
		SELECT DISTINCT p.name
		FROM permissions p
		JOIN role_permissions rp ON rp.permission_id = p.id
		JOIN user_roles ur ON ur.role_id = rp.role_id
		WHERE ur.user_id = $1
	`, userID)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var perms []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err == nil {
			perms = append(perms, name)
		}
	}
	return perms
}

// RBAC middleware checks if the authenticated user has the required permission.
func RBAC(permission string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check role first - OWNER always passes
			role, _ := r.Context().Value(CtxUserRole).(string)
			if strings.EqualFold(role, "OWNER") {
				next.ServeHTTP(w, r)
				return
			}

			// Check permissions from context
			perms, ok := r.Context().Value(CtxPermissions).([]string)
			if !ok || len(perms) == 0 {
				utils.JSONError(w, http.StatusForbidden, "insufficient permissions")
				return
			}

			for _, p := range perms {
				if strings.EqualFold(p, permission) {
					next.ServeHTTP(w, r)
					return
				}
			}

			utils.JSONError(w, http.StatusForbidden, "insufficient permissions: "+permission)
		})
	}
}

// RequireEmailVerified middleware ensures the user has verified their email.
func RequireEmailVerified(db *pgxpool.Pool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID, ok := r.Context().Value(CtxUserID).(string)
			if !ok {
				utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
				return
			}

			var verified bool
			err := db.QueryRow(r.Context(), `
				SELECT email_verified_at IS NOT NULL FROM users WHERE id = $1
			`, userID).Scan(&verified)
			if err != nil || !verified {
				utils.JSONError(w, http.StatusForbidden, "email verification required")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// GetUserID extracts user ID from context.
func GetUserID(r *http.Request) string {
	uid, _ := r.Context().Value(CtxUserID).(string)
	return uid
}

// GetUserRole extracts user role from context.
func GetUserRole(r *http.Request) string {
	role, _ := r.Context().Value(CtxUserRole).(string)
	return role
}

// HasPermission checks if the current user has a specific permission.
func HasPermission(r *http.Request, permission string) bool {
	role, _ := r.Context().Value(CtxUserRole).(string)
	if strings.EqualFold(role, "OWNER") {
		return true
	}
	perms, ok := r.Context().Value(CtxPermissions).([]string)
	if !ok {
		return false
	}
	for _, p := range perms {
		if strings.EqualFold(p, permission) {
			return true
		}
	}
	return false
}

// HasAnyPermission checks if the user has any of the given permissions.
func HasAnyPermission(r *http.Request, permissions ...string) bool {
	for _, p := range permissions {
		if HasPermission(r, p) {
			return true
		}
	}
	return false
}

// RBACOwnOrAny checks "resource.action_own" (if owner match) or "resource.action_any".
// Use this when an endpoint can operate on own resources or any resources.
// ownPermission = e.g. "posts.edit_own", anyPermission = e.g. "posts.edit_any"
func RBACOwnOrAny(ownPerm, anyPerm string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, _ := r.Context().Value(CtxUserRole).(string)
			if strings.EqualFold(role, "OWNER") {
				next.ServeHTTP(w, r)
				return
			}
			if HasPermission(r, anyPerm) || HasPermission(r, ownPerm) {
				next.ServeHTTP(w, r)
				return
			}
			utils.JSONError(w, http.StatusForbidden, "insufficient permissions")
		})
	}
}
