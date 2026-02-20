package postgres

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/domain/payment"
)

// PaymentRepo handles payment settings, methods, templates, and reviews.
type PaymentRepo struct {
	db *pgxpool.Pool
}

// NewPaymentRepo creates a new PaymentRepo.
func NewPaymentRepo(db *pgxpool.Pool) *PaymentRepo {
	return &PaymentRepo{db: db}
}

// ── Settings ──────────────────────────────────────────

// GetSettings returns payment settings by gateway name.
func (r *PaymentRepo) GetSettings(ctx context.Context, gateway string) (*payment.Settings, error) {
	var s payment.Settings
	err := r.db.QueryRow(ctx, `
		SELECT id, gateway, api_key, private_key, merchant_code,
			is_active, is_sandbox, created_at, updated_at
		FROM payment_settings WHERE gateway = $1
	`, gateway).Scan(&s.ID, &s.Gateway, &s.APIKey, &s.PrivateKey, &s.MerchantCode,
		&s.IsActive, &s.IsSandbox, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// GetAllSettings returns all payment settings.
func (r *PaymentRepo) GetAllSettings(ctx context.Context) ([]payment.Settings, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, gateway, api_key, private_key, merchant_code,
			is_active, is_sandbox, created_at, updated_at
		FROM payment_settings ORDER BY gateway ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var settings []payment.Settings
	for rows.Next() {
		var s payment.Settings
		if err := rows.Scan(&s.ID, &s.Gateway, &s.APIKey, &s.PrivateKey, &s.MerchantCode,
			&s.IsActive, &s.IsSandbox, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		settings = append(settings, s)
	}
	return settings, nil
}

// UpdateSettings updates payment settings.
func (r *PaymentRepo) UpdateSettings(ctx context.Context, id string, input *payment.UpdateSettingsInput) error {
	sets := []string{}
	args := []interface{}{id}
	argIdx := 2

	if input.APIKey != nil {
		sets = append(sets, fmt.Sprintf("api_key = $%d", argIdx))
		args = append(args, *input.APIKey)
		argIdx++
	}
	if input.PrivateKey != nil {
		sets = append(sets, fmt.Sprintf("private_key = $%d", argIdx))
		args = append(args, *input.PrivateKey)
		argIdx++
	}
	if input.MerchantCode != nil {
		sets = append(sets, fmt.Sprintf("merchant_code = $%d", argIdx))
		args = append(args, *input.MerchantCode)
		argIdx++
	}
	if input.IsActive != nil {
		sets = append(sets, fmt.Sprintf("is_active = $%d", argIdx))
		args = append(args, *input.IsActive)
		argIdx++
	}
	if input.IsSandbox != nil {
		sets = append(sets, fmt.Sprintf("is_sandbox = $%d", argIdx))
		args = append(args, *input.IsSandbox)
		argIdx++
	}

	if len(sets) == 0 {
		return nil
	}

	sets = append(sets, "updated_at = NOW()")
	query := fmt.Sprintf(`UPDATE payment_settings SET %s WHERE id = $1`, strings.Join(sets, ", "))
	_, err := r.db.Exec(ctx, query, args...)
	return err
}

// ── Payment Methods ──────────────────────────────────

// GetMethods returns all payment methods, optionally filtered by active.
func (r *PaymentRepo) GetMethods(ctx context.Context, activeOnly bool) ([]payment.Method, error) {
	query := `SELECT id, code, name, gateway,
		fee_flat, fee_percent, min_amount, max_amount, is_active, sort_order
		FROM payment_methods`
	if activeOnly {
		query += ` WHERE is_active = true`
	}
	query += ` ORDER BY sort_order ASC, name ASC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var methods []payment.Method
	for rows.Next() {
		var m payment.Method
		if err := rows.Scan(&m.ID, &m.Code, &m.Name, &m.Gateway,
			&m.FeeFlat, &m.FeePercent, &m.MinAmount, &m.MaxAmount, &m.IsActive, &m.SortOrder); err != nil {
			return nil, err
		}
		methods = append(methods, m)
	}
	return methods, nil
}

// GetMethodByCode returns a payment method by code.
func (r *PaymentRepo) GetMethodByCode(ctx context.Context, code string) (*payment.Method, error) {
	var m payment.Method
	err := r.db.QueryRow(ctx, `
		SELECT id, code, name, gateway,
			fee_flat, fee_percent, min_amount, max_amount, is_active, sort_order
		FROM payment_methods WHERE code = $1
	`, code).Scan(&m.ID, &m.Code, &m.Name, &m.Gateway,
		&m.FeeFlat, &m.FeePercent, &m.MinAmount, &m.MaxAmount, &m.IsActive, &m.SortOrder)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

// UpdateMethod updates a payment method.
func (r *PaymentRepo) UpdateMethod(ctx context.Context, id string, input *payment.UpdateMethodInput) error {
	sets := []string{}
	args := []interface{}{id}
	argIdx := 2

	if input.Name != nil {
		sets = append(sets, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *input.Name)
		argIdx++
	}
	if input.FeeFlat != nil {
		sets = append(sets, fmt.Sprintf("fee_flat = $%d", argIdx))
		args = append(args, *input.FeeFlat)
		argIdx++
	}
	if input.FeePercent != nil {
		sets = append(sets, fmt.Sprintf("fee_percent = $%d", argIdx))
		args = append(args, *input.FeePercent)
		argIdx++
	}
	if input.IsActive != nil {
		sets = append(sets, fmt.Sprintf("is_active = $%d", argIdx))
		args = append(args, *input.IsActive)
		argIdx++
	}
	if input.SortOrder != nil {
		sets = append(sets, fmt.Sprintf("sort_order = $%d", argIdx))
		args = append(args, *input.SortOrder)
		argIdx++
	}

	if len(sets) == 0 {
		return nil
	}

	sets = append(sets, "updated_at = NOW()")
	query := fmt.Sprintf(`UPDATE payment_methods SET %s WHERE id = $1`, strings.Join(sets, ", "))
	_, err := r.db.Exec(ctx, query, args...)
	return err
}

// ── Notification Templates ───────────────────────────

// GetTemplates returns all notification templates.
func (r *PaymentRepo) GetTemplates(ctx context.Context) ([]payment.NotificationTemplate, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, event, channel, subject, body, is_active, created_at, updated_at
		FROM notification_templates ORDER BY event ASC, channel ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []payment.NotificationTemplate
	for rows.Next() {
		var t payment.NotificationTemplate
		if err := rows.Scan(&t.ID, &t.Event, &t.Channel, &t.Subject, &t.Body, &t.IsActive,
			&t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		templates = append(templates, t)
	}
	return templates, nil
}

// GetTemplate returns a notification template by ID.
func (r *PaymentRepo) GetTemplate(ctx context.Context, id string) (*payment.NotificationTemplate, error) {
	var t payment.NotificationTemplate
	err := r.db.QueryRow(ctx, `
		SELECT id, event, channel, subject, body, is_active, created_at, updated_at
		FROM notification_templates WHERE id = $1
	`, id).Scan(&t.ID, &t.Event, &t.Channel, &t.Subject, &t.Body, &t.IsActive,
		&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// GetTemplateByEvent returns a notification template by event and channel.
func (r *PaymentRepo) GetTemplateByEvent(ctx context.Context, event, channel string) (*payment.NotificationTemplate, error) {
	var t payment.NotificationTemplate
	err := r.db.QueryRow(ctx, `
		SELECT id, event, channel, subject, body, is_active, created_at, updated_at
		FROM notification_templates WHERE event = $1 AND channel = $2 AND is_active = true
	`, event, channel).Scan(&t.ID, &t.Event, &t.Channel, &t.Subject, &t.Body, &t.IsActive,
		&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// UpdateTemplate updates a notification template.
func (r *PaymentRepo) UpdateTemplate(ctx context.Context, id, subject, body string, isActive bool) error {
	_, err := r.db.Exec(ctx, `
		UPDATE notification_templates SET subject = $2, body = $3, is_active = $4, updated_at = NOW()
		WHERE id = $1
	`, id, subject, body, isActive)
	return err
}

// ── Reviews ──────────────────────────────────────────

// CreateReview inserts a listing review.
func (r *PaymentRepo) CreateReview(ctx context.Context, rev *payment.Review) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO listing_reviews (id, listing_id, order_id, reviewer_name, rating, review)
		VALUES ($1,$2,$3,$4,$5,$6)
	`, rev.ID, rev.ListingID, rev.OrderID, rev.ReviewerName, rev.Rating, rev.Content)
	return err
}

// GetReviews returns reviews for a listing.
func (r *PaymentRepo) GetReviews(ctx context.Context, listingID string, page, limit int) ([]payment.Review, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}

	var total int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM listing_reviews WHERE listing_id = $1 AND is_visible = true`, listingID).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.db.Query(ctx, `
		SELECT id, listing_id, order_id, reviewer_name, rating, review, is_visible, created_at
		FROM listing_reviews
		WHERE listing_id = $1 AND is_visible = true
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, listingID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var reviews []payment.Review
	for rows.Next() {
		var rev payment.Review
		if err := rows.Scan(&rev.ID, &rev.ListingID, &rev.OrderID, &rev.ReviewerName,
			&rev.Rating, &rev.Content, &rev.IsVisible, &rev.CreatedAt); err != nil {
			return nil, 0, err
		}
		reviews = append(reviews, rev)
	}

	_ = math.Ceil(0) // ensure import
	return reviews, total, nil
}

// ToggleReviewVisibility sets a review's visibility.
func (r *PaymentRepo) ToggleReviewVisibility(ctx context.Context, id string, visible bool) error {
	_, err := r.db.Exec(ctx, `UPDATE listing_reviews SET is_visible = $2 WHERE id = $1`, id, visible)
	return err
}
