package payment

import "time"

// Gateway represents a payment gateway provider.
type Gateway string

const (
	GatewayTripay    Gateway = "TRIPAY"
	GatewayPaydisini Gateway = "PAYDISINI"
)

// Settings holds a payment gateway configuration.
type Settings struct {
	ID           string    `json:"id"`
	Gateway      Gateway   `json:"gateway"`
	APIKey       string    `json:"api_key,omitempty"`
	MerchantCode string    `json:"merchant_code,omitempty"`
	PrivateKey   string    `json:"private_key,omitempty"`
	IsActive     bool      `json:"is_active"`
	IsSandbox    bool      `json:"is_sandbox"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Method is a specific payment method (QRIS, BCA VA, etc.).
type Method struct {
	ID         string  `json:"id"`
	Gateway    string  `json:"gateway"`
	Code       string  `json:"code"`
	Name       string  `json:"name"`
	IconURL    string  `json:"icon_url,omitempty"`
	FeeFlat    int64   `json:"fee_flat"`
	FeePercent float64 `json:"fee_percent"`
	MinAmount  int64   `json:"min_amount"`
	MaxAmount  int64   `json:"max_amount"`
	IsActive   bool    `json:"is_active"`
	SortOrder  int     `json:"sort_order"`
}

// CalcFee calculates the total fee for a given amount.
func (m *Method) CalcFee(amount int64) int64 {
	flat := m.FeeFlat
	pct := int64(float64(amount) * float64(m.FeePercent) / 100)
	return flat + pct
}

// CreateTransactionRequest is sent to the payment gateway.
type CreateTransactionRequest struct {
	Gateway       Gateway `json:"gateway"`
	Method        string  `json:"method"`
	MerchantRef   string  `json:"merchant_ref"` // order_number
	Amount        int64   `json:"amount"`
	CustomerName  string  `json:"customer_name"`
	CustomerEmail string  `json:"customer_email"`
	CustomerPhone string  `json:"customer_phone"`
	CallbackURL   string  `json:"callback_url"`
	ReturnURL     string  `json:"return_url"`
	ExpiredTime   int     `json:"expired_time"` // seconds
}

// CreateTransactionResponse from the payment gateway.
type CreateTransactionResponse struct {
	GatewayRef string    `json:"gateway_ref"`
	PayURL     string    `json:"pay_url"`
	PayCode    string    `json:"pay_code"` // VA number / QRIS string
	QRURL      string    `json:"qr_url"`
	Amount     int64     `json:"amount"`
	Fee        int64     `json:"fee"`
	Total      int64     `json:"total"`
	ExpiredAt  time.Time `json:"expired_at"`
}

// WebhookPayload is the normalized webhook data from gateways.
type WebhookPayload struct {
	Gateway     Gateway                `json:"gateway"`
	GatewayRef  string                 `json:"gateway_ref"`
	MerchantRef string                 `json:"merchant_ref"`
	Status      string                 `json:"status"` // PAID | EXPIRED | FAILED
	Amount      int64                  `json:"amount"`
	Fee         int64                  `json:"fee"`
	PaidAt      *time.Time             `json:"paid_at,omitempty"`
	RawData     map[string]interface{} `json:"raw_data,omitempty"`
}

// UpdateSettingsInput for admin updates.
type UpdateSettingsInput struct {
	APIKey       *string `json:"api_key,omitempty"`
	MerchantCode *string `json:"merchant_code,omitempty"`
	PrivateKey   *string `json:"private_key,omitempty"`
	IsActive     *bool   `json:"is_active,omitempty"`
	IsSandbox    *bool   `json:"is_sandbox,omitempty"`
}

// UpdateMethodInput for admin method management.
type UpdateMethodInput struct {
	Name       *string  `json:"name,omitempty"`
	IconURL    *string  `json:"icon_url,omitempty"`
	FeeFlat    *int64   `json:"fee_flat,omitempty"`
	FeePercent *float64 `json:"fee_percent,omitempty"`
	MinAmount  *int64   `json:"min_amount,omitempty"`
	MaxAmount  *int64   `json:"max_amount,omitempty"`
	IsActive   *bool    `json:"is_active,omitempty"`
	SortOrder  *int     `json:"sort_order,omitempty"`
}

// NotificationTemplate for email/WA notification customization.
type NotificationTemplate struct {
	ID        string    `json:"id"`
	Event     string    `json:"event"`
	Channel   string    `json:"channel"`
	Subject   string    `json:"subject,omitempty"`
	Body      string    `json:"body"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Review is a buyer review of a listing.
type Review struct {
	ID            string    `json:"id"`
	ListingID     string    `json:"listing_id"`
	OrderID       string    `json:"order_id"`
	ReviewerName  string    `json:"reviewer_name"`
	ReviewerEmail string    `json:"reviewer_email,omitempty"`
	Rating        int       `json:"rating"`
	Content       string    `json:"content"`
	IsVerified    bool      `json:"is_verified"`
	IsVisible     bool      `json:"is_visible"`
	CreatedAt     time.Time `json:"created_at"`
}

// CreateReviewInput for public review submission.
type CreateReviewInput struct {
	Rating  int    `json:"rating"`
	Content string `json:"content"`
}

func (i *CreateReviewInput) Validate() string {
	if i.Rating < 1 || i.Rating > 5 {
		return "rating must be between 1 and 5"
	}
	return ""
}
