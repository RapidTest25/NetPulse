package auth

import "time"

// RegisterInput for POST /auth/register.
type RegisterInput struct {
	Email       string `json:"email"`
	Name        string `json:"name"`
	Password    string `json:"password"`
	ReferralCode string `json:"referral_code,omitempty"`
}

// VerifyEmailInput for POST /auth/verify-email.
type VerifyEmailInput struct {
	Token string `json:"token"`
}

// ResendVerificationInput for POST /auth/resend-verification.
type ResendVerificationInput struct {
	Email string `json:"email"`
}

// RefreshInput for POST /auth/refresh.
type RefreshInput struct {
	RefreshToken string `json:"refresh_token"`
}

// AuthToken stored in DB for refresh token rotation.
type AuthToken struct {
	ID               int64     `json:"id"`
	UserID           string    `json:"user_id"`
	RefreshTokenHash string    `json:"-"`
	FamilyID         string    `json:"family_id"`
	ExpiresAt        time.Time `json:"expires_at"`
	RevokedAt        *time.Time `json:"revoked_at,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	IPAddress        string    `json:"ip_address"`
	UserAgent        string    `json:"user_agent"`
}

// EmailVerificationToken stored hash in DB.
type EmailVerificationToken struct {
	ID        int64      `json:"id"`
	UserID    string     `json:"user_id"`
	TokenHash string     `json:"-"`
	ExpiresAt time.Time  `json:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

// UserSession for session management.
type UserSession struct {
	ID          string     `json:"id"`
	UserID      string     `json:"user_id"`
	TokenFamily string     `json:"token_family"`
	IPAddress   string     `json:"ip_address"`
	UserAgent   string     `json:"user_agent"`
	LastUsed    time.Time  `json:"last_used"`
	CreatedAt   time.Time  `json:"created_at"`
	RevokedAt   *time.Time `json:"revoked_at,omitempty"`
}

// TokenPair returned on login/register/refresh.
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

// AuthResponse wraps token pair with user info.
type AuthResponse struct {
	User   UserInfo  `json:"user"`
	Tokens TokenPair `json:"tokens"`
}

// UserInfo subset for auth responses.
type UserInfo struct {
	ID              string     `json:"id"`
	Email           string     `json:"email"`
	Name            string     `json:"name"`
	Avatar          string     `json:"avatar,omitempty"`
	EmailVerifiedAt *time.Time `json:"email_verified_at,omitempty"`
	Role            string     `json:"role"`
	ReferralCode    string     `json:"referral_code"`
	AuthProvider    string     `json:"auth_provider"`
}
