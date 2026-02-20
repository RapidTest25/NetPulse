package postgres

import (
	"context"
	"math"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/domain/authorrequest"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type AuthorRequestRepo struct {
	db *pgxpool.Pool
}

func NewAuthorRequestRepo(db *pgxpool.Pool) *AuthorRequestRepo {
	return &AuthorRequestRepo{db: db}
}

// Create creates a new author request.
func (r *AuthorRequestRepo) Create(ctx context.Context, userID, reason string) (*authorrequest.AuthorRequest, error) {
	id := utils.NewID()
	now := time.Now()

	_, err := r.db.Exec(ctx, `
		INSERT INTO author_requests (id, user_id, reason, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $4)
	`, id, userID, reason, now)
	if err != nil {
		return nil, err
	}

	return &authorrequest.AuthorRequest{
		ID:        id,
		UserID:    userID,
		Status:    "PENDING",
		Reason:    reason,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// GetByUserID returns the latest author request for a user.
func (r *AuthorRequestRepo) GetByUserID(ctx context.Context, userID string) (*authorrequest.AuthorRequest, error) {
	var ar authorrequest.AuthorRequest
	err := r.db.QueryRow(ctx, `
		SELECT id, user_id, status, reason, admin_note, reviewed_by, reviewed_at, created_at, updated_at
		FROM author_requests
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`, userID).Scan(&ar.ID, &ar.UserID, &ar.Status, &ar.Reason, &ar.AdminNote,
		&ar.ReviewedBy, &ar.ReviewedAt, &ar.CreatedAt, &ar.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &ar, nil
}

// HasPending checks if user has a pending author request.
func (r *AuthorRequestRepo) HasPending(ctx context.Context, userID string) (bool, error) {
	var count int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM author_requests WHERE user_id = $1 AND status = 'PENDING'
	`, userID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// List returns paginated author requests (for admin).
func (r *AuthorRequestRepo) List(ctx context.Context, filter authorrequest.AuthorRequestFilter) (*authorrequest.AuthorRequestListResult, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 50 {
		filter.Limit = 10
	}
	offset := (filter.Page - 1) * filter.Limit

	// Count
	countQuery := `SELECT COUNT(*) FROM author_requests ar`
	args := []interface{}{}
	where := ""
	if filter.Status != "" {
		where = ` WHERE ar.status = $1`
		args = append(args, filter.Status)
	}

	var total int
	err := r.db.QueryRow(ctx, countQuery+where, args...).Scan(&total)
	if err != nil {
		return nil, err
	}

	// Items
	query := `
		SELECT ar.id, ar.user_id, ar.status, ar.reason, ar.admin_note,
		       ar.reviewed_by, ar.reviewed_at, ar.created_at, ar.updated_at,
		       u.name AS user_name, u.email AS user_email, u.avatar AS user_avatar
		FROM author_requests ar
		JOIN users u ON u.id = ar.user_id
	`

	selectArgs := []interface{}{}
	if filter.Status != "" {
		query += ` WHERE ar.status = $1`
		selectArgs = append(selectArgs, filter.Status)
		query += ` ORDER BY ar.created_at DESC LIMIT $2 OFFSET $3`
		selectArgs = append(selectArgs, filter.Limit, offset)
	} else {
		query += ` ORDER BY ar.created_at DESC LIMIT $1 OFFSET $2`
		selectArgs = append(selectArgs, filter.Limit, offset)
	}

	rows, err := r.db.Query(ctx, query, selectArgs...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []authorrequest.AuthorRequest
	for rows.Next() {
		var ar authorrequest.AuthorRequest
		if err := rows.Scan(&ar.ID, &ar.UserID, &ar.Status, &ar.Reason, &ar.AdminNote,
			&ar.ReviewedBy, &ar.ReviewedAt, &ar.CreatedAt, &ar.UpdatedAt,
			&ar.UserName, &ar.UserEmail, &ar.UserAvatar); err != nil {
			return nil, err
		}
		items = append(items, ar)
	}

	if items == nil {
		items = []authorrequest.AuthorRequest{}
	}

	return &authorrequest.AuthorRequestListResult{
		Items:      items,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(filter.Limit))),
	}, nil
}

// Review updates an author request status (approve/reject) and optionally grants AUTHOR role.
func (r *AuthorRequestRepo) Review(ctx context.Context, requestID, adminID, status, adminNote string) error {
	now := time.Now()

	// Update the request
	_, err := r.db.Exec(ctx, `
		UPDATE author_requests
		SET status = $1, admin_note = $2, reviewed_by = $3, reviewed_at = $4, updated_at = $4
		WHERE id = $5
	`, status, adminNote, adminID, now, requestID)
	if err != nil {
		return err
	}

	// If approved, grant AUTHOR role to the user
	if status == "APPROVED" {
		var userID string
		err := r.db.QueryRow(ctx, `SELECT user_id FROM author_requests WHERE id = $1`, requestID).Scan(&userID)
		if err != nil {
			return err
		}

		// Add AUTHOR role if not already assigned
		_, err = r.db.Exec(ctx, `
			INSERT INTO user_roles (user_id, role_id)
			VALUES ($1, 'role_author')
			ON CONFLICT DO NOTHING
		`, userID)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetByID returns an author request by ID.
func (r *AuthorRequestRepo) GetByID(ctx context.Context, id string) (*authorrequest.AuthorRequest, error) {
	var ar authorrequest.AuthorRequest
	err := r.db.QueryRow(ctx, `
		SELECT ar.id, ar.user_id, ar.status, ar.reason, ar.admin_note,
		       ar.reviewed_by, ar.reviewed_at, ar.created_at, ar.updated_at,
		       u.name AS user_name, u.email AS user_email
		FROM author_requests ar
		JOIN users u ON u.id = ar.user_id
		WHERE ar.id = $1
	`, id).Scan(&ar.ID, &ar.UserID, &ar.Status, &ar.Reason, &ar.AdminNote,
		&ar.ReviewedBy, &ar.ReviewedAt, &ar.CreatedAt, &ar.UpdatedAt,
		&ar.UserName, &ar.UserEmail)
	if err != nil {
		return nil, err
	}
	return &ar, nil
}
