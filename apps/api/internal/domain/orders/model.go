package orders

import "time"

// OrderStatus represents the lifecycle of an order.
type OrderStatus string

const (
	StatusPendingPayment OrderStatus = "PENDING_PAYMENT"
	StatusPaid           OrderStatus = "PAID"
	StatusInProgress     OrderStatus = "IN_PROGRESS"
	StatusCompleted      OrderStatus = "COMPLETED"
	StatusExpired        OrderStatus = "EXPIRED"
	StatusCancelled      OrderStatus = "CANCELLED"
	StatusRefunded       OrderStatus = "REFUNDED"
)

// Order represents a guest marketplace order.
type Order struct {
	ID          string `json:"id"`
	OrderNumber string `json:"order_number"`

	// Buyer (guest — at least one contact required)
	BuyerName  string `json:"buyer_name"`
	BuyerEmail string `json:"buyer_email,omitempty"`
	BuyerPhone string `json:"buyer_phone,omitempty"`

	// Access
	AccessToken string `json:"-"`

	// Listing
	ListingID    string `json:"listing_id"`
	PackageID    string `json:"package_id,omitempty"`
	ListingTitle string `json:"listing_title"`
	PackageName  string `json:"package_name,omitempty"`
	ListingType  string `json:"listing_type"`

	// Pricing
	Amount   int64  `json:"amount"`
	Currency string `json:"currency"`

	// Status
	Status OrderStatus `json:"status"`

	// Payment
	PaidAt *time.Time `json:"paid_at,omitempty"`

	// Delivery
	DeliveryMethod    string     `json:"delivery_method,omitempty"`
	DeliverySentAt    *time.Time `json:"delivery_sent_at,omitempty"`
	DownloadURL       string     `json:"download_url,omitempty"`
	DownloadExpiresAt *time.Time `json:"download_expires_at,omitempty"`
	DownloadCount     int        `json:"download_count"`
	MaxDownloads      int        `json:"max_downloads"`

	// Deliverable (for services)
	DeliverableURL   string `json:"deliverable_url,omitempty"`
	DeliverableNotes string `json:"deliverable_notes,omitempty"`

	// Buyer input
	BuyerNotes string   `json:"buyer_notes,omitempty"`
	BuyerFiles []string `json:"buyer_files,omitempty"`

	// Admin
	AdminNotes string  `json:"admin_notes,omitempty"`
	AssignedTo *string `json:"assigned_to,omitempty"`

	// Timestamps
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	CancelledAt *time.Time `json:"cancelled_at,omitempty"`
	ExpiredAt   *time.Time `json:"expired_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// Joined
	AssignedName string              `json:"assigned_name,omitempty"`
	Payment      *PaymentTransaction `json:"payment,omitempty"`
}

// CreateOrderInput from the store checkout form.
type CreateOrderInput struct {
	ListingID     string `json:"listing_id"`
	PackageID     string `json:"package_id,omitempty"`
	BuyerName     string `json:"buyer_name"`
	BuyerEmail    string `json:"buyer_email,omitempty"`
	BuyerPhone    string `json:"buyer_phone,omitempty"`
	BuyerNotes    string `json:"buyer_notes,omitempty"`
	PaymentMethod string `json:"payment_method"`
}

// Validate checks CreateOrderInput requirements.
func (i *CreateOrderInput) Validate() string {
	if i.ListingID == "" {
		return "listing_id is required"
	}
	if len(i.BuyerName) < 2 {
		return "buyer_name must be at least 2 characters"
	}
	if i.BuyerEmail == "" && i.BuyerPhone == "" {
		return "email or phone number is required"
	}
	if i.PaymentMethod == "" {
		return "payment_method is required"
	}
	return ""
}

// UpdateOrderInput for admin updates.
type UpdateOrderInput struct {
	Status           *OrderStatus `json:"status,omitempty"`
	AdminNotes       *string      `json:"admin_notes,omitempty"`
	AssignedTo       *string      `json:"assigned_to,omitempty"`
	DeliverableURL   *string      `json:"deliverable_url,omitempty"`
	DeliverableNotes *string      `json:"deliverable_notes,omitempty"`
}

// TrackMethod for order lookup.
type TrackMethod string

const (
	TrackByTRX   TrackMethod = "trx"
	TrackByEmail TrackMethod = "email"
	TrackByPhone TrackMethod = "phone"
)

// TrackOrderInput for public order tracking.
type TrackOrderInput struct {
	Method TrackMethod `json:"method"`
	Value  string      `json:"value"`
}

// OrderFilter for admin listing.
type OrderFilter struct {
	Status    OrderStatus `json:"status,omitempty"`
	Search    string      `json:"search,omitempty"`
	ListingID string      `json:"listing_id,omitempty"`
	Page      int         `json:"page"`
	Limit     int         `json:"limit"`
}

// OrderListResult is paginated order results.
type OrderListResult struct {
	Items      []Order `json:"items"`
	Total      int     `json:"total"`
	Page       int     `json:"page"`
	Limit      int     `json:"limit"`
	TotalPages int     `json:"total_pages"`
}

// OrderSummary for public tracking list (limited info).
type OrderSummary struct {
	OrderNumber  string      `json:"order_number"`
	ListingTitle string      `json:"listing_title"`
	PackageName  string      `json:"package_name"`
	Amount       int64       `json:"total_amount"`
	Status       OrderStatus `json:"status"`
	CreatedAt    time.Time   `json:"created_at"`
}

// PaymentTransaction represents a payment via gateway.
type PaymentTransaction struct {
	ID           string                 `json:"id"`
	OrderID      string                 `json:"order_id"`
	Gateway      string                 `json:"gateway"`
	GatewayRef   string                 `json:"gateway_ref,omitempty"`
	GatewayURL   string                 `json:"gateway_url,omitempty"`
	Method       string                 `json:"method"`
	Amount       int64                  `json:"amount"`
	Fee          int64                  `json:"fee"`
	Total        int64                  `json:"total"`
	PayCode      string                 `json:"pay_code,omitempty"`
	QRURL        string                 `json:"qr_url,omitempty"`
	Status       string                 `json:"status"`
	ExpiredAt    *time.Time             `json:"expired_at,omitempty"`
	PaidAt       *time.Time             `json:"paid_at,omitempty"`
	CallbackData map[string]interface{} `json:"callback_data,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
}

// OrderResponse returned after creating an order.
type OrderResponse struct {
	OrderNumber string      `json:"order_number"`
	Status      OrderStatus `json:"status"`
	Amount      int64       `json:"amount"`
	Payment     PaymentInfo `json:"payment"`
	TrackingURL string      `json:"tracking_url"`
}

// PaymentInfo is the payment details returned to buyer.
type PaymentInfo struct {
	Method    string     `json:"method"`
	Gateway   string     `json:"gateway"`
	PayURL    string     `json:"pay_url,omitempty"`
	QRURL     string     `json:"qr_url,omitempty"`
	PayCode   string     `json:"pay_code,omitempty"`
	ExpiredAt *time.Time `json:"expired_at,omitempty"`
}
