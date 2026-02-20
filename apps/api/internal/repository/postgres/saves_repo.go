package postgres

import (
	"context"
	"math"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/domain/saves"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type SavesRepo struct {
	db *pgxpool.Pool
}

func NewSavesRepo(db *pgxpool.Pool) *SavesRepo {
	return &SavesRepo{db: db}
}

// Toggle saves/unsaves a post for a user. Returns (saved, savesCount, error).
func (r *SavesRepo) Toggle(ctx context.Context, userID, postID string) (bool, int64, error) {
	// Check if already saved
	var existingID string
	err := r.db.QueryRow(ctx, `SELECT id FROM saves WHERE user_id = $1 AND post_id = $2`, userID, postID).Scan(&existingID)

	if err == nil {
		// Already saved — remove
		_, err = r.db.Exec(ctx, `DELETE FROM saves WHERE id = $1`, existingID)
		if err != nil {
			return false, 0, err
		}
		// Update counter
		_, _ = r.db.Exec(ctx, `UPDATE post_stats SET saves_count = GREATEST(saves_count - 1, 0), updated_at = NOW() WHERE post_id = $1`, postID)
		var count int64
		_ = r.db.QueryRow(ctx, `SELECT saves_count FROM post_stats WHERE post_id = $1`, postID).Scan(&count)
		return false, count, nil
	}

	// Not saved — add
	id := utils.NewID()
	_, err = r.db.Exec(ctx, `INSERT INTO saves (id, user_id, post_id) VALUES ($1, $2, $3)`, id, userID, postID)
	if err != nil {
		return false, 0, err
	}
	_, _ = r.db.Exec(ctx, `UPDATE post_stats SET saves_count = saves_count + 1, updated_at = NOW() WHERE post_id = $1`, postID)
	var count int64
	_ = r.db.QueryRow(ctx, `SELECT saves_count FROM post_stats WHERE post_id = $1`, postID).Scan(&count)
	return true, count, nil
}

// IsSaved checks if a user has saved a post.
func (r *SavesRepo) IsSaved(ctx context.Context, userID, postID string) (bool, error) {
	var id string
	err := r.db.QueryRow(ctx, `SELECT id FROM saves WHERE user_id = $1 AND post_id = $2`, userID, postID).Scan(&id)
	if err != nil {
		return false, nil
	}
	return true, nil
}

// ListByUser returns paginated list of saved posts for a user.
func (r *SavesRepo) ListByUser(ctx context.Context, filter saves.SaveFilter) (*saves.SaveListResult, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 50 {
		filter.Limit = 10
	}
	offset := (filter.Page - 1) * filter.Limit

	var total int
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM saves WHERE user_id = $1`, filter.UserID).Scan(&total)
	if err != nil {
		return nil, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT s.id, s.user_id, s.post_id, s.created_at,
		       p.title, p.slug, p.excerpt, p.cover_url, p.status,
		       u.name AS author_name
		FROM saves s
		JOIN posts p ON p.id = s.post_id
		LEFT JOIN users u ON u.id = p.author_id
		WHERE s.user_id = $1
		ORDER BY s.created_at DESC
		LIMIT $2 OFFSET $3
	`, filter.UserID, filter.Limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []saves.Save
	for rows.Next() {
		var s saves.Save
		if err := rows.Scan(&s.ID, &s.UserID, &s.PostID, &s.CreatedAt,
			&s.PostTitle, &s.PostSlug, &s.PostExcerpt, &s.PostCover, &s.PostStatus,
			&s.AuthorName); err != nil {
			return nil, err
		}
		items = append(items, s)
	}

	if items == nil {
		items = []saves.Save{}
	}

	return &saves.SaveListResult{
		Items:      items,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(filter.Limit))),
	}, nil
}

// GetSaveCount returns the save count for a post.
func (r *SavesRepo) GetSaveCount(ctx context.Context, postID string) (int64, error) {
	var count int64
	err := r.db.QueryRow(ctx, `SELECT saves_count FROM post_stats WHERE post_id = $1`, postID).Scan(&count)
	if err != nil {
		return 0, nil
	}
	return count, nil
}

// Ensure post_stats row exists (helper, call before toggle if needed).
func (r *SavesRepo) EnsurePostStats(ctx context.Context, postID string) {
	_, _ = r.db.Exec(ctx, `
		INSERT INTO post_stats (post_id, views_count, likes_count, comments_count, saves_count)
		VALUES ($1, 0, 0, 0, 0)
		ON CONFLICT (post_id) DO NOTHING
	`, postID)
}

// ListLikedByUser returns paginated posts liked by user.
func (r *SavesRepo) ListLikedByUser(ctx context.Context, userID string, page, limit int) (*saves.SaveListResult, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}
	offset := (page - 1) * limit

	var total int
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM likes WHERE user_id = $1`, userID).Scan(&total)
	if err != nil {
		return nil, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT l.id, l.user_id, l.post_id, l.created_at,
		       p.title, p.slug, p.excerpt, p.cover_url, p.status,
		       u.name AS author_name
		FROM likes l
		JOIN posts p ON p.id = l.post_id
		LEFT JOIN users u ON u.id = p.author_id
		WHERE l.user_id = $1
		ORDER BY l.created_at DESC
		LIMIT $2 OFFSET $3
	`, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []saves.Save
	for rows.Next() {
		var s saves.Save
		var createdAt time.Time
		if err := rows.Scan(&s.ID, &s.UserID, &s.PostID, &createdAt,
			&s.PostTitle, &s.PostSlug, &s.PostExcerpt, &s.PostCover, &s.PostStatus,
			&s.AuthorName); err != nil {
			return nil, err
		}
		s.CreatedAt = createdAt
		items = append(items, s)
	}

	if items == nil {
		items = []saves.Save{}
	}

	return &saves.SaveListResult{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	}, nil
}

// ListCommentsByUser returns paginated comments by user with post info.
func (r *SavesRepo) ListCommentsByUser(ctx context.Context, userID string, page, limit int) ([]map[string]interface{}, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}
	offset := (page - 1) * limit

	var total int
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM comments WHERE user_id = $1 AND deleted_at IS NULL`, userID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT c.id, c.post_id, c.content, c.status, c.created_at,
		       p.title AS post_title, p.slug AS post_slug
		FROM comments c
		JOIN posts p ON p.id = c.post_id
		WHERE c.user_id = $1 AND c.deleted_at IS NULL
		ORDER BY c.created_at DESC
		LIMIT $2 OFFSET $3
	`, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []map[string]interface{}
	for rows.Next() {
		var id, postID, content, status, postTitle, postSlug string
		var createdAt time.Time
		if err := rows.Scan(&id, &postID, &content, &status, &createdAt, &postTitle, &postSlug); err != nil {
			return nil, 0, err
		}
		items = append(items, map[string]interface{}{
			"id":         id,
			"post_id":    postID,
			"content":    content,
			"status":     status,
			"created_at": createdAt,
			"post_title": postTitle,
			"post_slug":  postSlug,
		})
	}

	if items == nil {
		items = []map[string]interface{}{}
	}

	return items, total, nil
}
