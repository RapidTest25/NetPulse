package comments

import "time"

// CommentStatus represents the status of a comment.
type CommentStatus string

const (
	StatusPending  CommentStatus = "PENDING"
	StatusApproved CommentStatus = "APPROVED"
	StatusSpam     CommentStatus = "SPAM"
	StatusRejected CommentStatus = "REJECTED"
)

// Comment represents a single comment on a post.
type Comment struct {
	ID         string        `json:"id"`
	PostID     string        `json:"post_id"`
	UserID     *string       `json:"user_id,omitempty"`
	ParentID   *string       `json:"parent_id,omitempty"`
	GuestName  string        `json:"guest_name,omitempty"`
	GuestEmail string        `json:"guest_email,omitempty"`
	Content    string        `json:"content"`
	Status     CommentStatus `json:"status"`
	IPAddress  string        `json:"-"`
	UserAgent  string        `json:"-"`
	CreatedAt  time.Time     `json:"created_at"`
	UpdatedAt  time.Time     `json:"updated_at"`
	DeletedAt  *time.Time    `json:"deleted_at,omitempty"`

	// Joined fields
	AuthorName   string     `json:"author_name,omitempty"`
	AuthorAvatar string     `json:"author_avatar,omitempty"`
	Replies      []Comment  `json:"replies,omitempty"`
	ReplyCount   int        `json:"reply_count,omitempty"`
}

// CreateCommentInput from public API.
type CreateCommentInput struct {
	Content    string  `json:"content"`
	ParentID   *string `json:"parent_id,omitempty"`
	GuestName  string  `json:"guest_name,omitempty"`
	GuestEmail string  `json:"guest_email,omitempty"`
}

// ModerateCommentInput from admin API.
type ModerateCommentInput struct {
	Status CommentStatus `json:"status"`
}

// BulkModerateInput for bulk admin actions.
type BulkModerateInput struct {
	IDs    []string      `json:"ids"`
	Status CommentStatus `json:"status"`
}

// CommentFilter for listing/searching comments.
type CommentFilter struct {
	PostID   string        `json:"post_id,omitempty"`
	Status   CommentStatus `json:"status,omitempty"`
	UserID   string        `json:"user_id,omitempty"`
	Search   string        `json:"search,omitempty"`
	Page     int           `json:"page"`
	Limit    int           `json:"limit"`
}

// CommentListResult paginated.
type CommentListResult struct {
	Items      []Comment `json:"items"`
	Total      int       `json:"total"`
	Page       int       `json:"page"`
	Limit      int       `json:"limit"`
	TotalPages int       `json:"total_pages"`
}
