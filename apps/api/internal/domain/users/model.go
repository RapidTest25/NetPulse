package users

import "time"

type User struct {
	ID               string     `json:"id"`
	Email            string     `json:"email"`
	Name             string     `json:"name"`
	PasswordHash     string     `json:"-"`
	Avatar           string     `json:"avatar,omitempty"`
	Bio              string     `json:"bio,omitempty"`
	IsActive         bool       `json:"is_active"`
	TwoFactorEnabled bool       `json:"two_factor_enabled"`
	EmailVerifiedAt  *time.Time `json:"email_verified_at,omitempty"`
	ReferralCode     string     `json:"referral_code,omitempty"`
	ReferredBy       *string    `json:"referred_by,omitempty"`
	DisabledAt       *time.Time `json:"disabled_at,omitempty"`
	AuthProvider     string     `json:"auth_provider"`
	GoogleSub        *string    `json:"google_sub,omitempty"`
	Website          string     `json:"website,omitempty"`
	Location         string     `json:"location,omitempty"`
	SocialTwitter    string     `json:"social_twitter,omitempty"`
	SocialGithub     string     `json:"social_github,omitempty"`
	SocialLinkedin   string     `json:"social_linkedin,omitempty"`
	SocialFacebook   string     `json:"social_facebook,omitempty"`
	SocialInstagram  string     `json:"social_instagram,omitempty"`
	SocialYoutube    string     `json:"social_youtube,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	Roles            []Role     `json:"roles,omitempty"`
	Permissions      []string   `json:"permissions,omitempty"`
}

// IsEmailVerified returns true if email has been verified.
func (u *User) IsEmailVerified() bool {
	return u.EmailVerifiedAt != nil
}

// PrimaryRole returns the highest-priority role name.
func (u *User) PrimaryRole() string {
	if len(u.Roles) == 0 {
		return "VIEWER"
	}
	// Priority: OWNER > ADMIN > EDITOR > AUTHOR > VIEWER
	priority := map[string]int{"OWNER": 5, "ADMIN": 4, "EDITOR": 3, "AUTHOR": 2, "VIEWER": 1}
	best := u.Roles[0]
	for _, r := range u.Roles[1:] {
		if priority[r.Name] > priority[best.Name] {
			best = r
		}
	}
	return best.Name
}

type Role struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Permissions []Permission `json:"permissions,omitempty"`
}

type Permission struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Module string `json:"module"`
}

type InviteUserInput struct {
	Email string `json:"email" validate:"required,email"`
	Name  string `json:"name" validate:"required,max=100"`
	Role  string `json:"role" validate:"required,oneof=ADMIN EDITOR AUTHOR"`
}

type LoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

type UserFilter struct {
	Page        int    `json:"page"`
	Limit       int    `json:"limit"`
	Search      string `json:"search,omitempty"`
	Role        string `json:"role,omitempty"`
	Verified    *bool  `json:"verified,omitempty"`
	Active      *bool  `json:"active,omitempty"`
}

type UserListResult struct {
	Items      []User `json:"items"`
	Total      int    `json:"total"`
	Page       int    `json:"page"`
	Limit      int    `json:"limit"`
	TotalPages int    `json:"total_pages"`
}
