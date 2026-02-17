package referral

import "time"

// ReferralEvent tracks a referral.
type ReferralEvent struct {
	ID         int64     `json:"id"`
	ReferrerID string    `json:"referrer_id"`
	ReferredID string    `json:"referred_id"`
	IPAddress  string    `json:"ip_address,omitempty"`
	Verified   bool      `json:"verified"`
	CreatedAt  time.Time `json:"created_at"`
}

// ReferralStats for admin.
type ReferralStats struct {
	TotalInvites      int            `json:"total_invites"`
	VerifiedReferrals int            `json:"verified_referrals"`
	TopReferrers      []TopReferrer  `json:"top_referrers"`
}

// TopReferrer user in ranking.
type TopReferrer struct {
	UserID       string `json:"user_id"`
	UserName     string `json:"user_name"`
	UserEmail    string `json:"user_email"`
	TotalReferred int   `json:"total_referred"`
	Verified      int   `json:"verified"`
}

// UserReferralInfo for user context.
type UserReferralInfo struct {
	ReferralCode  string `json:"referral_code"`
	ReferralLink  string `json:"referral_link"`
	TotalReferred int    `json:"total_referred"`
	Verified      int    `json:"verified"`
}
