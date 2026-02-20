package listings

import "time"

// ListingType represents the type of listing.
type ListingType string

const (
	TypeService        ListingType = "SERVICE"
	TypeDigitalProduct ListingType = "DIGITAL_PRODUCT"
	TypeAcademic       ListingType = "ACADEMIC"
)

// Listing is a marketplace item (jasa / produk digital / tugas akademik).
type Listing struct {
	ID          string      `json:"id"`
	Title       string      `json:"title"`
	Slug        string      `json:"slug"`
	Description string      `json:"description"`
	ShortDesc   string      `json:"short_desc"`
	CoverURL    string      `json:"cover_url,omitempty"`
	ListingType ListingType `json:"listing_type"`
	CategoryID  *string     `json:"category_id,omitempty"`

	// Pricing
	BasePrice int64 `json:"base_price"`

	// SEO
	MetaTitle string `json:"meta_title,omitempty"`
	MetaDesc  string `json:"meta_desc,omitempty"`

	// Features
	Features  []string `json:"features,omitempty"`
	TechStack []string `json:"tech_stack,omitempty"`

	// Delivery
	EstimatedDays        int    `json:"estimated_days"`
	AutoDelivery         bool   `json:"auto_delivery"`
	DeliveryFileURL      string `json:"delivery_file_url,omitempty"`
	DeliveryFileName     string `json:"delivery_file_name,omitempty"`
	DeliveryFileSize     int64  `json:"delivery_file_size,omitempty"`
	DeliveryExpiryDays   int    `json:"delivery_expiry_days"`
	DeliveryMaxDownloads int    `json:"delivery_max_downloads"`
	DeliveryEmailTpl     string `json:"delivery_email_template,omitempty"`
	DeliveryWATpl        string `json:"delivery_wa_template,omitempty"`

	// Status
	IsFeatured bool `json:"is_featured"`
	IsActive   bool `json:"is_active"`
	SortOrder  int  `json:"sort_order"`

	// Stats
	TotalOrders int     `json:"total_orders"`
	AvgRating   float64 `json:"avg_rating"`
	ReviewCount int     `json:"review_count"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Joined
	Category *ListingCategory `json:"category,omitempty"`
	Packages []Package        `json:"packages,omitempty"`
	FAQ      []FAQ            `json:"faq,omitempty"`
}

// ListingCategory organizes listings.
type ListingCategory struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Icon        string `json:"icon,omitempty"`
	Description string `json:"description,omitempty"`
	SortOrder   int    `json:"sort_order"`
	IsActive    bool   `json:"is_active"`
}

// Package is a pricing tier within a listing.
type Package struct {
	ID            string   `json:"id"`
	ListingID     string   `json:"listing_id"`
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	Price         int64    `json:"price"`
	Features      []string `json:"features,omitempty"`
	EstimatedDays int      `json:"estimated_days"`
	MaxRevisions  int      `json:"max_revisions"`
	SortOrder     int      `json:"sort_order"`
	IsActive      bool     `json:"is_active"`
}

// FAQ is a question-answer pair.
type FAQ struct {
	ID        string `json:"id"`
	ListingID string `json:"listing_id"`
	Question  string `json:"question"`
	Answer    string `json:"answer"`
	SortOrder int    `json:"sort_order"`
}

// CreateListingInput is the DTO for creating a listing.
type CreateListingInput struct {
	Title       string      `json:"title"`
	Description string      `json:"description"`
	ShortDesc   string      `json:"short_desc"`
	CoverURL    string      `json:"cover_url"`
	ListingType ListingType `json:"listing_type"`
	CategoryID  string      `json:"category_id"`
	BasePrice   int64       `json:"base_price"`
	MetaTitle   string      `json:"meta_title"`
	MetaDesc    string      `json:"meta_desc"`
	Features    []string    `json:"features"`
	TechStack   []string    `json:"tech_stack"`
	EstDays     int         `json:"estimated_days"`
	IsFeatured  bool        `json:"is_featured"`
}

// UpdateListingInput is the DTO for updating.
type UpdateListingInput struct {
	Title       *string      `json:"title,omitempty"`
	Description *string      `json:"description,omitempty"`
	ShortDesc   *string      `json:"short_desc,omitempty"`
	CoverURL    *string      `json:"cover_url,omitempty"`
	ListingType *ListingType `json:"listing_type,omitempty"`
	CategoryID  *string      `json:"category_id,omitempty"`
	BasePrice   *int64       `json:"base_price,omitempty"`
	MetaTitle   *string      `json:"meta_title,omitempty"`
	MetaDesc    *string      `json:"meta_desc,omitempty"`
	Features    []string     `json:"features,omitempty"`
	TechStack   []string     `json:"tech_stack,omitempty"`
	EstDays     *int         `json:"estimated_days,omitempty"`
	IsFeatured  *bool        `json:"is_featured,omitempty"`
	IsActive    *bool        `json:"is_active,omitempty"`
}

// DeliveryConfig for auto-delivery settings.
type DeliveryConfig struct {
	AutoDelivery  bool   `json:"auto_delivery"`
	FileURL       string `json:"delivery_file_url"`
	FileName      string `json:"delivery_file_name"`
	FileSize      int64  `json:"delivery_file_size"`
	ExpiryDays    int    `json:"delivery_expiry_days"`
	MaxDownloads  int    `json:"delivery_max_downloads"`
	EmailTemplate string `json:"delivery_email_template"`
	WATemplate    string `json:"delivery_wa_template"`
}

// ListingFilter for querying listings.
type ListingFilter struct {
	ListingType ListingType `json:"listing_type,omitempty"`
	CategoryID  string      `json:"category_id,omitempty"`
	Query       string      `json:"query,omitempty"`
	IsFeatured  *bool       `json:"is_featured,omitempty"`
	IsActive    *bool       `json:"is_active,omitempty"`
	Page        int         `json:"page"`
	Limit       int         `json:"limit"`
	Sort        string      `json:"sort"` // newest, popular, price_asc, price_desc
}

// ListingListResult is paginated listing results.
type ListingListResult struct {
	Items      []Listing `json:"items"`
	Total      int       `json:"total"`
	Page       int       `json:"page"`
	Limit      int       `json:"limit"`
	TotalPages int       `json:"total_pages"`
}
