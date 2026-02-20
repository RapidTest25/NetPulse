package portfolio

import "time"

// PreviewType determines how a portfolio item is previewed.
type PreviewType string

const (
	PreviewIframe     PreviewType = "IFRAME"
	PreviewScreenshot PreviewType = "SCREENSHOT"
	PreviewVideo      PreviewType = "VIDEO"
)

// Item is a portfolio showcase entry.
type Item struct {
	ID                string      `json:"id"`
	ListingID         *string     `json:"listing_id,omitempty"`
	Title             string      `json:"title"`
	Description       string      `json:"description"`
	PreviewType       PreviewType `json:"preview_type"`
	PreviewURL        string      `json:"preview_url,omitempty"`
	DesktopScreenshot string      `json:"desktop_screenshot,omitempty"`
	MobileScreenshot  string      `json:"mobile_screenshot,omitempty"`
	ClientName        string      `json:"client_name,omitempty"`
	TechStack         []string    `json:"tech_stack,omitempty"`
	IsFeatured        bool        `json:"is_featured"`
	SortOrder         int         `json:"sort_order"`
	IsActive          bool        `json:"is_active"`
	CreatedAt         time.Time   `json:"created_at"`
	UpdatedAt         time.Time   `json:"updated_at"`

	// Joined
	Images       []Image `json:"images,omitempty"`
	ListingTitle string  `json:"listing_title,omitempty"`
}

// Image is a gallery image for a portfolio item.
type Image struct {
	ID          string `json:"id"`
	PortfolioID string `json:"portfolio_id"`
	URL         string `json:"url"`
	AltText     string `json:"alt_text,omitempty"`
	SortOrder   int    `json:"sort_order"`
}

// CreateInput is the DTO for creating a portfolio item.
type CreateInput struct {
	ListingID         string      `json:"listing_id,omitempty"`
	Title             string      `json:"title"`
	Description       string      `json:"description"`
	PreviewType       PreviewType `json:"preview_type"`
	PreviewURL        string      `json:"preview_url"`
	DesktopScreenshot string      `json:"desktop_screenshot"`
	MobileScreenshot  string      `json:"mobile_screenshot"`
	ClientName        string      `json:"client_name"`
	TechStack         []string    `json:"tech_stack"`
	IsFeatured        bool        `json:"is_featured"`
	IsActive          bool        `json:"is_active"`
}

// UpdateInput is the DTO for updating.
type UpdateInput struct {
	Title             *string      `json:"title,omitempty"`
	Description       *string      `json:"description,omitempty"`
	PreviewType       *PreviewType `json:"preview_type,omitempty"`
	PreviewURL        *string      `json:"preview_url,omitempty"`
	DesktopScreenshot *string      `json:"desktop_screenshot,omitempty"`
	MobileScreenshot  *string      `json:"mobile_screenshot,omitempty"`
	ClientName        *string      `json:"client_name,omitempty"`
	TechStack         []string     `json:"tech_stack,omitempty"`
	IsFeatured        *bool        `json:"is_featured,omitempty"`
	IsActive          *bool        `json:"is_active,omitempty"`
	SortOrder         *int         `json:"sort_order,omitempty"`
}

// Filter for listing portfolio items.
type Filter struct {
	IsFeatured *bool  `json:"is_featured,omitempty"`
	IsActive   *bool  `json:"is_active,omitempty"`
	ListingID  string `json:"listing_id,omitempty"`
	Page       int    `json:"page"`
	Limit      int    `json:"limit"`
}

// ListResult is paginated portfolio results.
type ListResult struct {
	Items      []Item `json:"items"`
	Total      int    `json:"total"`
	Page       int    `json:"page"`
	Limit      int    `json:"limit"`
	TotalPages int    `json:"total_pages"`
}
