package posts

import (
	"time"
)

// PostStatus represents the editorial workflow state.
type PostStatus string

const (
	StatusDraft            PostStatus = "DRAFT"
	StatusInReview         PostStatus = "IN_REVIEW"
	StatusChangesRequested PostStatus = "CHANGES_REQUESTED"
	StatusScheduled        PostStatus = "SCHEDULED"
	StatusPublished        PostStatus = "PUBLISHED"
	StatusArchived         PostStatus = "ARCHIVED"
)

// Post is the core content entity.
type Post struct {
	ID            string     `json:"id"`
	Title         string     `json:"title"`
	Slug          string     `json:"slug"`
	Excerpt       string     `json:"excerpt"`
	Body          string     `json:"body"`
	CoverURL      string     `json:"cover_url,omitempty"`
	Status        PostStatus `json:"status"`
	AuthorID      string     `json:"author_id"`
	CategoryID    *string    `json:"category_id,omitempty"`
	PublishedAt   *time.Time `json:"published_at,omitempty"`
	ScheduledAt   *time.Time `json:"scheduled_at,omitempty"`
	MetaTitle     string     `json:"meta_title,omitempty"`
	MetaDesc      string     `json:"meta_description,omitempty"`
	Canonical     string     `json:"canonical,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	Tags          []Tag      `json:"tags,omitempty"`
	Category      *Category  `json:"category,omitempty"`
	Author        *Author    `json:"author,omitempty"`
}

// Category organizes posts.
type Category struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description,omitempty"`
}

// Tag is a label for posts.
type Tag struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// Author is a minimal user representation for public display.
type Author struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Avatar   string `json:"avatar,omitempty"`
}

// CreatePostInput is the DTO for creating a post.
type CreatePostInput struct {
	Title      string   `json:"title" validate:"required,max=200"`
	Body       string   `json:"body" validate:"required"`
	Excerpt    string   `json:"excerpt" validate:"max=500"`
	CoverURL   string   `json:"cover_url"`
	CategoryID string   `json:"category_id"`
	TagIDs     []string `json:"tag_ids"`
	MetaTitle  string   `json:"meta_title" validate:"max=70"`
	MetaDesc   string   `json:"meta_description" validate:"max=160"`
}

// UpdatePostInput is the DTO for updating a post.
type UpdatePostInput struct {
	Title      *string  `json:"title,omitempty"`
	Body       *string  `json:"body,omitempty"`
	Excerpt    *string  `json:"excerpt,omitempty"`
	CoverURL   *string  `json:"cover_url,omitempty"`
	CategoryID *string  `json:"category_id,omitempty"`
	TagIDs     []string `json:"tag_ids,omitempty"`
	MetaTitle  *string  `json:"meta_title,omitempty"`
	MetaDesc   *string  `json:"meta_description,omitempty"`
}

// PostListFilter holds query parameters for listing posts.
type PostListFilter struct {
	Status     PostStatus
	CategoryID string
	TagID      string
	AuthorID   string
	Query      string
	Page       int
	Limit      int
	Sort       string // "newest", "oldest", "relevance"
}

// PostListResult contains paginated post results.
type PostListResult struct {
	Items      []Post `json:"items"`
	Page       int    `json:"page"`
	Limit      int    `json:"limit"`
	Total      int    `json:"total"`
	TotalPages int    `json:"total_pages"`
}

// SearchResult is a trimmed post result for search.
type SearchResult struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Slug        string     `json:"slug"`
	Excerpt     string     `json:"excerpt"`
	PublishedAt *time.Time `json:"published_at"`
	CoverURL    string     `json:"cover_url,omitempty"`
	Category    string     `json:"category,omitempty"`
	Tags        []string   `json:"tags,omitempty"`
}

// SuggestResult is a minimal result for autocomplete.
type SuggestResult struct {
	Title    string `json:"title"`
	Slug     string `json:"slug"`
	Category string `json:"category,omitempty"`
}
