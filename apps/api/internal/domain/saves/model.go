package saves

import "time"

// Save represents a user's bookmark of a post.
type Save struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	PostID    string    `json:"post_id"`
	CreatedAt time.Time `json:"created_at"`

	// Joined fields (from posts table)
	PostTitle   string `json:"post_title,omitempty"`
	PostSlug    string `json:"post_slug,omitempty"`
	PostExcerpt string `json:"post_excerpt,omitempty"`
	PostCover   string `json:"post_cover_url,omitempty"`
	PostStatus  string `json:"post_status,omitempty"`
	AuthorName  string `json:"author_name,omitempty"`
}

// SaveResponse returned on toggle.
type SaveResponse struct {
	Saved      bool  `json:"saved"`
	SavesCount int64 `json:"saves_count"`
}

// SaveFilter for listing user's saves.
type SaveFilter struct {
	UserID string
	Page   int
	Limit  int
}

// SaveListResult is paginated saves.
type SaveListResult struct {
	Items      []Save `json:"items"`
	Total      int    `json:"total"`
	Page       int    `json:"page"`
	Limit      int    `json:"limit"`
	TotalPages int    `json:"total_pages"`
}