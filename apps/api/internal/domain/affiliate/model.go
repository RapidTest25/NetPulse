package affiliate

import "time"

// ══════════════════════════════════════════════════════════
// Settings (singleton row id=1)
// ══════════════════════════════════════════════════════════

// AffiliateSettings holds program-wide config (singleton row).
type AffiliateSettings struct {
	ID               int       `json:"id"`
	Enabled          bool      `json:"enabled"`
	CommissionType   string    `json:"commission_type"` // FIXED_PER_VERIFIED_REFERRAL | PERCENTAGE | FIXED
	CommissionValue  float64   `json:"commission_value"`
	CookieDays       int       `json:"cookie_days"`
	ReferralHoldDays int       `json:"referral_hold_days"`
	PayoutMinimum    float64   `json:"payout_minimum"`
	PayoutSchedule   string    `json:"payout_schedule"` // MANUAL | WEEKLY | BIWEEKLY | MONTHLY
	HowItWorksMD     string    `json:"how_it_works_md"`
	TermsMD          string    `json:"terms_md"`
	PayoutRulesMD    string    `json:"payout_rules_md"`
	TermsText        string    `json:"terms_text"` // legacy
	UpdatedAt        time.Time `json:"updated_at"`
}

// UpdateSettingsInput is the DTO for updating affiliate settings.
type UpdateSettingsInput struct {
	Enabled          *bool    `json:"enabled,omitempty"`
	CommissionType   *string  `json:"commission_type,omitempty"`
	CommissionValue  *float64 `json:"commission_value,omitempty"`
	CookieDays       *int     `json:"cookie_days,omitempty"`
	ReferralHoldDays *int     `json:"referral_hold_days,omitempty"`
	PayoutMinimum    *float64 `json:"payout_minimum,omitempty"`
	PayoutSchedule   *string  `json:"payout_schedule,omitempty"`
	HowItWorksMD     *string  `json:"how_it_works_md,omitempty"`
	TermsMD          *string  `json:"terms_md,omitempty"`
	PayoutRulesMD    *string  `json:"payout_rules_md,omitempty"`
	TermsText        *string  `json:"terms_text,omitempty"`
}

// ══════════════════════════════════════════════════════════
// AffiliateProfile
// ══════════════════════════════════════════════════════════

// AffiliateProfile is a user's affiliate enrollment.
type AffiliateProfile struct {
	ID                    string     `json:"id"`
	UserID                string     `json:"user_id"`
	Status                string     `json:"status"` // PENDING | APPROVED | REJECTED | SUSPENDED
	PayoutMethod          string     `json:"payout_method"`
	ProviderName          string     `json:"provider_name"`
	PayoutNameEncrypted   string     `json:"-"`
	PayoutNumberEncrypted string     `json:"-"`
	PayoutName            string     `json:"payout_name,omitempty"`   // decrypted, transient
	PayoutNumber          string     `json:"payout_number,omitempty"` // decrypted, transient
	PayoutNameMasked      string     `json:"payout_name_masked,omitempty"`
	PayoutNumberMasked    string     `json:"payout_number_masked,omitempty"`
	TotalEarnings         float64    `json:"total_earnings"`
	TotalPaid             float64    `json:"total_paid"`
	PendingBalance        float64    `json:"pending_balance"`
	AvailableBalance      float64    `json:"available_balance"`
	LockedBalance         float64    `json:"locked_balance"`
	IsBlocked             bool       `json:"is_blocked"`
	IsSuspicious          bool       `json:"is_suspicious"`
	BlockedReason         string     `json:"blocked_reason,omitempty"`
	BlockedAt             *time.Time `json:"blocked_at,omitempty"`
	ApprovedAt            *time.Time `json:"approved_at,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
	// Joined fields
	UserName     string `json:"user_name,omitempty"`
	UserEmail    string `json:"user_email,omitempty"`
	ReferralCode string `json:"referral_code,omitempty"`
}

// MaskString returns masked string: "****XXXX" showing last 4 chars.
func MaskString(s string) string {
	if len(s) <= 4 {
		return "****"
	}
	return "****" + s[len(s)-4:]
}

// EnrollInput is the DTO for enrolling / updating payout profile.
type EnrollInput struct {
	PayoutMethod  string `json:"payout_method"` // BANK | EWALLET
	ProviderName  string `json:"provider_name"`
	AccountName   string `json:"account_name"`
	AccountNumber string `json:"account_number"`
}

// Validate validates the enroll input.
func (e *EnrollInput) Validate() string {
	if e.PayoutMethod == "" {
		return "payout_method is required"
	}
	if e.PayoutMethod != "BANK" && e.PayoutMethod != "EWALLET" {
		return "payout_method must be BANK or EWALLET"
	}
	if e.ProviderName == "" {
		return "provider_name is required"
	}
	if len(e.ProviderName) > 100 {
		return "provider_name too long"
	}
	if e.AccountName == "" {
		return "account_name is required"
	}
	if len(e.AccountName) > 100 {
		return "account_name too long"
	}
	if e.AccountNumber == "" {
		return "account_number is required"
	}
	if len(e.AccountNumber) > 50 {
		return "account_number too long"
	}
	return ""
}

// ══════════════════════════════════════════════════════════
// Commission / Affiliate Event
// ══════════════════════════════════════════════════════════

// Commission tracks each earnings event.
type Commission struct {
	ID              string     `json:"id"`
	AffiliateID     string     `json:"affiliate_id"`
	ReferralEventID *int64     `json:"referral_event_id,omitempty"`
	Amount          float64    `json:"amount"`
	Description     string     `json:"description"`
	Status          string     `json:"status"` // PENDING | APPROVED | PAID | REJECTED
	HoldUntil       *time.Time `json:"hold_until,omitempty"`
	ReleasedAt      *time.Time `json:"released_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

// ══════════════════════════════════════════════════════════
// Payout Request
// ══════════════════════════════════════════════════════════

// PayoutRequest represents a withdrawal request.
type PayoutRequest struct {
	ID               string     `json:"id"`
	UserID           string     `json:"user_id"`
	AffiliateID      string     `json:"affiliate_id"`
	Amount           float64    `json:"amount"`
	Status           string     `json:"status"` // PENDING | APPROVED | PROCESSING | PAID | REJECTED
	AdminNote        string     `json:"admin_note,omitempty"`
	Note             string     `json:"note,omitempty"`
	PaymentReference string     `json:"payment_reference,omitempty"`
	ProofURL         string     `json:"proof_url,omitempty"`
	RequestedAt      time.Time  `json:"requested_at"`
	ProcessedAt      *time.Time `json:"processed_at,omitempty"`
	ProcessedBy      *string    `json:"processed_by,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	// Joined fields
	UserName  string `json:"user_name,omitempty"`
	UserEmail string `json:"user_email,omitempty"`
}

// PayoutRequestInput is the DTO for creating a payout request.
type PayoutRequestInput struct {
	Amount float64 `json:"amount"`
	Note   string  `json:"note"`
}

// ══════════════════════════════════════════════════════════
// Stats
// ══════════════════════════════════════════════════════════

// AffiliateStats for the user dashboard.
type AffiliateStats struct {
	TotalReferrals    int     `json:"total_referrals"`
	VerifiedReferrals int     `json:"verified_referrals"`
	PendingBalance    float64 `json:"pending_balance"`
	AvailableBalance  float64 `json:"available_balance"`
	TotalPaid         float64 `json:"total_paid"`
	TotalEarnings     float64 `json:"total_earnings"`
	ThisMonth         float64 `json:"this_month_earnings"`
}

// AdminAffiliateStats for admin overview.
type AdminAffiliateStats struct {
	TotalAffiliates      int            `json:"total_affiliates"`
	ActiveAffiliates     int            `json:"active_affiliates"`
	PendingPayouts       int            `json:"pending_payouts"`
	PendingPayoutsAmount float64        `json:"pending_payouts_amount"`
	TotalPaidOut         float64        `json:"total_paid_out"`
	TotalCommissions     float64        `json:"total_commissions"`
	VerifiedLast30Days   int            `json:"verified_last_30_days"`
	TopAffiliates        []TopAffiliate `json:"top_affiliates"`
}

// TopAffiliate for leaderboard.
type TopAffiliate struct {
	UserID            string  `json:"user_id"`
	UserName          string  `json:"user_name"`
	UserEmail         string  `json:"user_email"`
	ReferralCode      string  `json:"referral_code"`
	VerifiedReferrals int     `json:"verified_referrals"`
	TotalEarnings     float64 `json:"total_earnings"`
}

// ══════════════════════════════════════════════════════════
// Balance Adjustment
// ══════════════════════════════════════════════════════════

// BalanceAdjustment records an admin balance adjustment.
type BalanceAdjustment struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	AdminID     string    `json:"admin_id"`
	Amount      float64   `json:"amount"`
	BalanceType string    `json:"balance_type"` // pending | available | paid
	Reason      string    `json:"reason"`
	CreatedAt   time.Time `json:"created_at"`
}

// AdjustBalanceInput is the DTO for admin balance adjustments.
type AdjustBalanceInput struct {
	Amount      float64 `json:"amount"`
	BalanceType string  `json:"balance_type"`
	Reason      string  `json:"reason"`
}

// Validate validates adjust balance input.
func (a *AdjustBalanceInput) Validate() string {
	if a.Amount == 0 {
		return "amount is required"
	}
	if a.BalanceType != "pending" && a.BalanceType != "available" && a.BalanceType != "paid" {
		return "balance_type must be pending, available, or paid"
	}
	if a.Reason == "" {
		return "reason is required"
	}
	return ""
}

// ══════════════════════════════════════════════════════════
// Filters
// ══════════════════════════════════════════════════════════

// PayoutListFilter for pagination.
type PayoutListFilter struct {
	Status string
	Page   int
	Limit  int
}

// AffiliateListFilter for admin listing.
type AffiliateListFilter struct {
	Status string
	Search string
	Page   int
	Limit  int
}

// EventListFilter for listing affiliate events.
type EventListFilter struct {
	UserID string
	Page   int
	Limit  int
}
