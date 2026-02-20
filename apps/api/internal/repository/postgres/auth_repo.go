package postgres

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/domain/auth"
)

// AuthRepo handles auth-related DB operations.
type AuthRepo struct {
	db *pgxpool.Pool
}

func NewAuthRepo(db *pgxpool.Pool) *AuthRepo {
	return &AuthRepo{db: db}
}

// hashToken creates a SHA-256 hash of a token for storage.
func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}

// ── Refresh Tokens ──────────────────────────────────

// StoreRefreshToken saves a hashed refresh token.
func (r *AuthRepo) StoreRefreshToken(ctx context.Context, userID, refreshToken, familyID, ip, ua string, expiresAt time.Time) error {
	hash := hashToken(refreshToken)
	_, err := r.db.Exec(ctx, `
		INSERT INTO auth_tokens (user_id, refresh_token_hash, family_id, expires_at, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, userID, hash, familyID, expiresAt, ip, ua)
	return err
}

// ValidateRefreshToken checks if a refresh token exists and is valid.
func (r *AuthRepo) ValidateRefreshToken(ctx context.Context, refreshToken string) (*auth.AuthToken, error) {
	hash := hashToken(refreshToken)
	var t auth.AuthToken
	err := r.db.QueryRow(ctx, `
		SELECT id, user_id, refresh_token_hash, family_id, expires_at, revoked_at, created_at
		FROM auth_tokens
		WHERE refresh_token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()
	`, hash).Scan(&t.ID, &t.UserID, &t.RefreshTokenHash, &t.FamilyID, &t.ExpiresAt, &t.RevokedAt, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// RevokeRefreshToken marks a refresh token as revoked.
func (r *AuthRepo) RevokeRefreshToken(ctx context.Context, tokenHash string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE auth_tokens SET revoked_at = NOW() WHERE refresh_token_hash = $1
	`, tokenHash)
	return err
}

// RevokeTokenFamily revokes all tokens in a family (reuse detection).
func (r *AuthRepo) RevokeTokenFamily(ctx context.Context, familyID string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE auth_tokens SET revoked_at = NOW() WHERE family_id = $1 AND revoked_at IS NULL
	`, familyID)
	return err
}

// RevokeAllUserTokens revokes all refresh tokens for a user.
func (r *AuthRepo) RevokeAllUserTokens(ctx context.Context, userID string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE auth_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL
	`, userID)
	return err
}

// CleanExpiredTokens removes expired tokens.
func (r *AuthRepo) CleanExpiredTokens(ctx context.Context) error {
	_, err := r.db.Exec(ctx, `DELETE FROM auth_tokens WHERE expires_at < NOW()`)
	return err
}

// ── Email Verification ──────────────────────────────

// StoreEmailVerificationToken saves a hashed verification token.
func (r *AuthRepo) StoreEmailVerificationToken(ctx context.Context, userID, token string, expiresAt time.Time) error {
	hash := hashToken(token)
	// Invalidate previous tokens for this user
	_, _ = r.db.Exec(ctx, `
		UPDATE email_verification_tokens SET used_at = NOW()
		WHERE user_id = $1 AND used_at IS NULL
	`, userID)
	_, err := r.db.Exec(ctx, `
		INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`, userID, hash, expiresAt)
	return err
}

// VerifyEmailToken validates and marks a verification token as used.
func (r *AuthRepo) VerifyEmailToken(ctx context.Context, token string) (string, error) {
	hash := hashToken(token)
	var userID string
	err := r.db.QueryRow(ctx, `
		UPDATE email_verification_tokens
		SET used_at = NOW()
		WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
		RETURNING user_id
	`, hash).Scan(&userID)
	if err != nil {
		return "", err
	}
	// Mark user email as verified
	_, err = r.db.Exec(ctx, `
		UPDATE users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = $1
	`, userID)
	return userID, err
}

// ── Sessions ────────────────────────────────────────

// ── Email Change ────────────────────────────────────

// StoreEmailChangeToken saves a token for email change request.
func (r *AuthRepo) StoreEmailChangeToken(ctx context.Context, userID, newEmail, token string, expiresAt time.Time) error {
	hash := hashToken(token)
	// Invalidate previous requests
	_, _ = r.db.Exec(ctx, `
		UPDATE email_change_requests SET confirmed_at = NOW()
		WHERE user_id = $1 AND confirmed_at IS NULL
	`, userID)
	_, err := r.db.Exec(ctx, `
		INSERT INTO email_change_requests (user_id, new_email, token_hash, expires_at)
		VALUES ($1, $2, $3, $4)
	`, userID, newEmail, hash, expiresAt)
	return err
}

// VerifyEmailChangeToken validates the token and returns userID + newEmail.
func (r *AuthRepo) VerifyEmailChangeToken(ctx context.Context, token string) (string, string, error) {
	hash := hashToken(token)
	var userID, newEmail string
	err := r.db.QueryRow(ctx, `
		UPDATE email_change_requests
		SET confirmed_at = NOW()
		WHERE token_hash = $1 AND confirmed_at IS NULL AND expires_at > NOW()
		RETURNING user_id, new_email
	`, hash).Scan(&userID, &newEmail)
	return userID, newEmail, err
}

// ── Sessions (continued) ────────────────────────────

// CreateSession creates a new session record.
func (r *AuthRepo) CreateSession(ctx context.Context, userID, familyID, ip, ua string) (string, error) {
	var id string
	err := r.db.QueryRow(ctx, `
		INSERT INTO user_sessions (user_id, token_family, ip_address, user_agent)
		VALUES ($1, $2, $3, $4) RETURNING id
	`, userID, familyID, ip, ua).Scan(&id)
	return id, err
}

// GetUserSessions returns active sessions for a user.
func (r *AuthRepo) GetUserSessions(ctx context.Context, userID string) ([]auth.UserSession, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, user_id, token_family, ip_address, user_agent, last_used, created_at, revoked_at
		FROM user_sessions
		WHERE user_id = $1 AND revoked_at IS NULL
		ORDER BY last_used DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []auth.UserSession
	for rows.Next() {
		var s auth.UserSession
		if err := rows.Scan(&s.ID, &s.UserID, &s.TokenFamily, &s.IPAddress, &s.UserAgent, &s.LastUsed, &s.CreatedAt, &s.RevokedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

// RevokeSession revokes a specific session.
func (r *AuthRepo) RevokeSession(ctx context.Context, sessionID, userID string) error {
	// Revoke session
	result, err := r.db.Exec(ctx, `
		UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1 AND user_id = $2
	`, sessionID, userID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return nil
	}
	// Also revoke the associated token family
	var familyID string
	err = r.db.QueryRow(ctx, `SELECT token_family FROM user_sessions WHERE id = $1`, sessionID).Scan(&familyID)
	if err == nil {
		r.RevokeTokenFamily(ctx, familyID)
	}
	return nil
}

// UpdateSessionActivity updates last_used timestamp.
func (r *AuthRepo) UpdateSessionActivity(ctx context.Context, familyID string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE user_sessions SET last_used = NOW() WHERE token_family = $1 AND revoked_at IS NULL
	`, familyID)
	return err
}
