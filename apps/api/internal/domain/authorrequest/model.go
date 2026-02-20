package authorrequest

import "time"

// AuthorRequest represents a user's request to become an author.
type AuthorRequest struct {
	ID         string     `json:"id"`
	UserID     string     `json:"user_id"`
	Status     string     `json:"status"` // PENDING, APPROVED, REJECTED
	Reason     string     `json:"reason"`
	AdminNote  string     `json:"admin_note,omitempty"`
	ReviewedBy *string    `json:"reviewed_by,omitempty"`
	ReviewedAt *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`

	// Joined fields
	UserName   string `json:"user_name,omitempty"`
	UserEmail  string `json:"user_email,omitempty"`
	UserAvatar string `json:"user_avatar,omitempty"`
}

// CreateAuthorRequestInput is the DTO for creating an author request.
type CreateAuthorRequestInput struct {
	Reason string `json:"reason" validate:"required,max=1000"`
}

// ReviewAuthorRequestInput is the DTO for admin review.
type ReviewAuthorRequestInput struct {
	Status    string `json:"status" validate:"required,oneof=APPROVED REJECTED"`
	AdminNote string `json:"admin_note"`
}

// AuthorRequestFilter for listing author requests.
type AuthorRequestFilter struct {
	Status string
	Page   int
	Limit  int
}

// AuthorRequestListResult is paginated author requests.
type AuthorRequestListResult struct {
	Items      []AuthorRequest `json:"items"`
	Total      int             `json:"total"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalPages int             `json:"total_pages"`
}