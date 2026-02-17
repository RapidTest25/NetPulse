package postgres

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/domain/comments"
)

type CommentsRepo struct {
	db *pgxpool.Pool
}

func NewCommentsRepo(db *pgxpool.Pool) *CommentsRepo {
	return &CommentsRepo{db: db}
}

// Create inserts a new comment.
func (r *CommentsRepo) Create(ctx context.Context, c *comments.Comment) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO comments (id, post_id, user_id, parent_id, guest_name, guest_email, content, status, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, c.ID, c.PostID, c.UserID, c.ParentID, c.GuestName, c.GuestEmail, c.Content, c.Status, c.IPAddress, c.UserAgent)
	return err
}

// FindByID returns a single comment.
func (r *CommentsRepo) FindByID(ctx context.Context, id string) (*comments.Comment, error) {
	var c comments.Comment
	err := r.db.QueryRow(ctx, `
		SELECT c.id, c.post_id, c.user_id, c.parent_id, c.guest_name, c.guest_email,
		       c.content, c.status, c.ip_address, c.created_at, c.updated_at,
		       COALESCE(u.name, c.guest_name) AS author_name,
		       COALESCE(u.avatar, '') AS author_avatar
		FROM comments c
		LEFT JOIN users u ON c.user_id = u.id
		WHERE c.id = $1 AND c.deleted_at IS NULL
	`, id).Scan(&c.ID, &c.PostID, &c.UserID, &c.ParentID, &c.GuestName, &c.GuestEmail,
		&c.Content, &c.Status, &c.IPAddress, &c.CreatedAt, &c.UpdatedAt,
		&c.AuthorName, &c.AuthorAvatar)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// FindByPost returns approved comments for a post (public).
func (r *CommentsRepo) FindByPost(ctx context.Context, postID string, page, limit int) (*comments.CommentListResult, error) {
	var total int
	r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM comments WHERE post_id = $1 AND status = 'APPROVED' AND deleted_at IS NULL AND parent_id IS NULL
	`, postID).Scan(&total)

	offset := (page - 1) * limit
	rows, err := r.db.Query(ctx, `
		SELECT c.id, c.post_id, c.user_id, c.parent_id, c.guest_name, c.guest_email,
		       c.content, c.status, c.created_at, c.updated_at,
		       COALESCE(u.name, c.guest_name) AS author_name,
		       COALESCE(u.avatar, '') AS author_avatar,
		       (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id AND r.status = 'APPROVED' AND r.deleted_at IS NULL) AS reply_count
		FROM comments c
		LEFT JOIN users u ON c.user_id = u.id
		WHERE c.post_id = $1 AND c.status = 'APPROVED' AND c.deleted_at IS NULL AND c.parent_id IS NULL
		ORDER BY c.created_at DESC
		LIMIT $2 OFFSET $3
	`, postID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []comments.Comment
	for rows.Next() {
		var c comments.Comment
		if err := rows.Scan(&c.ID, &c.PostID, &c.UserID, &c.ParentID, &c.GuestName, &c.GuestEmail,
			&c.Content, &c.Status, &c.CreatedAt, &c.UpdatedAt,
			&c.AuthorName, &c.AuthorAvatar, &c.ReplyCount); err != nil {
			return nil, err
		}
		items = append(items, c)
	}

	return &comments.CommentListResult{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	}, nil
}

// FindReplies returns replies for a parent comment.
func (r *CommentsRepo) FindReplies(ctx context.Context, parentID string, limit int) ([]comments.Comment, error) {
	rows, err := r.db.Query(ctx, `
		SELECT c.id, c.post_id, c.user_id, c.parent_id, c.guest_name, c.guest_email,
		       c.content, c.status, c.created_at, c.updated_at,
		       COALESCE(u.name, c.guest_name) AS author_name,
		       COALESCE(u.avatar, '') AS author_avatar
		FROM comments c
		LEFT JOIN users u ON c.user_id = u.id
		WHERE c.parent_id = $1 AND c.status = 'APPROVED' AND c.deleted_at IS NULL
		ORDER BY c.created_at ASC
		LIMIT $2
	`, parentID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []comments.Comment
	for rows.Next() {
		var c comments.Comment
		if err := rows.Scan(&c.ID, &c.PostID, &c.UserID, &c.ParentID, &c.GuestName, &c.GuestEmail,
			&c.Content, &c.Status, &c.CreatedAt, &c.UpdatedAt,
			&c.AuthorName, &c.AuthorAvatar); err != nil {
			return nil, err
		}
		items = append(items, c)
	}
	return items, nil
}

// FindAll returns all comments with filters (admin).
func (r *CommentsRepo) FindAll(ctx context.Context, f comments.CommentFilter) (*comments.CommentListResult, error) {
	where := []string{"c.deleted_at IS NULL"}
	args := []interface{}{}
	argIdx := 1

	if f.PostID != "" {
		where = append(where, fmt.Sprintf("c.post_id = $%d", argIdx))
		args = append(args, f.PostID)
		argIdx++
	}
	if f.Status != "" {
		where = append(where, fmt.Sprintf("c.status = $%d", argIdx))
		args = append(args, string(f.Status))
		argIdx++
	}
	if f.UserID != "" {
		where = append(where, fmt.Sprintf("c.user_id = $%d", argIdx))
		args = append(args, f.UserID)
		argIdx++
	}
	if f.Search != "" {
		where = append(where, fmt.Sprintf("c.content ILIKE $%d", argIdx))
		args = append(args, "%"+f.Search+"%")
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	countQ := fmt.Sprintf("SELECT COUNT(*) FROM comments c WHERE %s", whereClause)
	r.db.QueryRow(ctx, countQ, args...).Scan(&total)

	offset := (f.Page - 1) * f.Limit
	args = append(args, f.Limit, offset)

	query := fmt.Sprintf(`
		SELECT c.id, c.post_id, c.user_id, c.parent_id, c.guest_name, c.guest_email,
		       c.content, c.status, c.ip_address, c.created_at, c.updated_at,
		       COALESCE(u.name, c.guest_name) AS author_name,
		       COALESCE(u.avatar, '') AS author_avatar,
		       COALESCE(p.title, '') AS post_title
		FROM comments c
		LEFT JOIN users u ON c.user_id = u.id
		LEFT JOIN posts p ON c.post_id = p.id
		WHERE %s
		ORDER BY c.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []comments.Comment
	for rows.Next() {
		var c comments.Comment
		var postTitle string
		if err := rows.Scan(&c.ID, &c.PostID, &c.UserID, &c.ParentID, &c.GuestName, &c.GuestEmail,
			&c.Content, &c.Status, &c.IPAddress, &c.CreatedAt, &c.UpdatedAt,
			&c.AuthorName, &c.AuthorAvatar, &postTitle); err != nil {
			return nil, err
		}
		items = append(items, c)
	}

	return &comments.CommentListResult{
		Items:      items,
		Total:      total,
		Page:       f.Page,
		Limit:      f.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(f.Limit))),
	}, nil
}

// UpdateStatus changes comment status (moderation).
func (r *CommentsRepo) UpdateStatus(ctx context.Context, id string, status comments.CommentStatus) error {
	_, err := r.db.Exec(ctx, `
		UPDATE comments SET status = $1, updated_at = NOW() WHERE id = $2
	`, string(status), id)
	return err
}

// BulkUpdateStatus changes multiple comments' status.
func (r *CommentsRepo) BulkUpdateStatus(ctx context.Context, ids []string, status comments.CommentStatus) error {
	_, err := r.db.Exec(ctx, `
		UPDATE comments SET status = $1, updated_at = NOW() WHERE id = ANY($2)
	`, string(status), ids)
	return err
}

// SoftDelete marks a comment as deleted.
func (r *CommentsRepo) SoftDelete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE comments SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1
	`, id)
	return err
}

// CountByPost returns approved comment count for a post.
func (r *CommentsRepo) CountByPost(ctx context.Context, postID string) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM comments WHERE post_id = $1 AND status = 'APPROVED' AND deleted_at IS NULL
	`, postID).Scan(&count)
	return count, err
}
