package postgres

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/domain/portfolio"
)

// PortfolioRepo handles portfolio item database operations.
type PortfolioRepo struct {
	db *pgxpool.Pool
}

// NewPortfolioRepo creates a new PortfolioRepo.
func NewPortfolioRepo(db *pgxpool.Pool) *PortfolioRepo {
	return &PortfolioRepo{db: db}
}

// Create inserts a new portfolio item.
func (r *PortfolioRepo) Create(ctx context.Context, item *portfolio.Item) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO portfolio_items (id, listing_id, title, description,
			preview_type, preview_url, desktop_screenshot, mobile_screenshot,
			client_name, tech_stack, is_featured, sort_order, is_active)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
	`, item.ID, item.ListingID, item.Title, item.Description,
		item.PreviewType, item.PreviewURL, item.DesktopScreenshot, item.MobileScreenshot,
		item.ClientName, item.TechStack, item.IsFeatured, item.SortOrder, item.IsActive)
	return err
}

// FindAll returns paginated portfolio items.
func (r *PortfolioRepo) FindAll(ctx context.Context, f portfolio.Filter) (*portfolio.ListResult, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 || f.Limit > 50 {
		f.Limit = 12
	}

	where := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if f.IsActive != nil {
		where = append(where, fmt.Sprintf("p.is_active = $%d", argIdx))
		args = append(args, *f.IsActive)
		argIdx++
	}
	if f.IsFeatured != nil {
		where = append(where, fmt.Sprintf("p.is_featured = $%d", argIdx))
		args = append(args, *f.IsFeatured)
		argIdx++
	}
	if f.ListingID != "" {
		where = append(where, fmt.Sprintf("p.listing_id = $%d", argIdx))
		args = append(args, f.ListingID)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	if err := r.db.QueryRow(ctx, fmt.Sprintf(`SELECT COUNT(*) FROM portfolio_items p WHERE %s`, whereClause), args...).Scan(&total); err != nil {
		return nil, err
	}

	offset := (f.Page - 1) * f.Limit
	args = append(args, f.Limit, offset)

	query := fmt.Sprintf(`
		SELECT p.id, p.listing_id, p.title, p.description,
			p.preview_type, p.preview_url, p.desktop_screenshot, p.mobile_screenshot,
			p.client_name, p.tech_stack, p.is_featured, p.sort_order, p.is_active,
			p.created_at, p.updated_at,
			COALESCE(l.title, '') AS listing_title
		FROM portfolio_items p
		LEFT JOIN listings l ON l.id = p.listing_id
		WHERE %s
		ORDER BY p.sort_order ASC, p.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []portfolio.Item
	for rows.Next() {
		item, err := r.scanItem(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}

	return &portfolio.ListResult{
		Items:      items,
		Total:      total,
		Page:       f.Page,
		Limit:      f.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(f.Limit))),
	}, nil
}

// FindByID returns a portfolio item with images.
func (r *PortfolioRepo) FindByID(ctx context.Context, id string) (*portfolio.Item, error) {
	row := r.db.QueryRow(ctx, `
		SELECT p.id, p.listing_id, p.title, p.description,
			p.preview_type, p.preview_url, p.desktop_screenshot, p.mobile_screenshot,
			p.client_name, p.tech_stack, p.is_featured, p.sort_order, p.is_active,
			p.created_at, p.updated_at,
			COALESCE(l.title, '') AS listing_title
		FROM portfolio_items p
		LEFT JOIN listings l ON l.id = p.listing_id
		WHERE p.id = $1
	`, id)

	item, err := r.scanItem(row)
	if err != nil {
		return nil, err
	}

	// Load images
	images, err := r.FindImages(ctx, id)
	if err == nil {
		item.Images = images
	}

	return item, nil
}

// Update modifies a portfolio item.
func (r *PortfolioRepo) Update(ctx context.Context, item *portfolio.Item) error {
	_, err := r.db.Exec(ctx, `
		UPDATE portfolio_items SET
			listing_id = $2, title = $3, description = $4,
			preview_type = $5, preview_url = $6,
			desktop_screenshot = $7, mobile_screenshot = $8,
			client_name = $9, tech_stack = $10,
			is_featured = $11, sort_order = $12, is_active = $13,
			updated_at = NOW()
		WHERE id = $1
	`, item.ID, item.ListingID, item.Title, item.Description,
		item.PreviewType, item.PreviewURL,
		item.DesktopScreenshot, item.MobileScreenshot,
		item.ClientName, item.TechStack,
		item.IsFeatured, item.SortOrder, item.IsActive)
	return err
}

// Delete removes a portfolio item and its images.
func (r *PortfolioRepo) Delete(ctx context.Context, id string) error {
	_, _ = r.db.Exec(ctx, `DELETE FROM portfolio_images WHERE portfolio_id = $1`, id)
	_, err := r.db.Exec(ctx, `DELETE FROM portfolio_items WHERE id = $1`, id)
	return err
}

// ── Images ───────────────────────────────────────────

// AddImage inserts a portfolio image.
func (r *PortfolioRepo) AddImage(ctx context.Context, img *portfolio.Image) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO portfolio_images (id, portfolio_id, url, alt_text, sort_order)
		VALUES ($1,$2,$3,$4,$5)
	`, img.ID, img.PortfolioID, img.URL, img.AltText, img.SortOrder)
	return err
}

// FindImages returns all images for a portfolio item.
func (r *PortfolioRepo) FindImages(ctx context.Context, portfolioID string) ([]portfolio.Image, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, portfolio_id, url, alt_text, sort_order
		FROM portfolio_images WHERE portfolio_id = $1 ORDER BY sort_order ASC
	`, portfolioID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []portfolio.Image
	for rows.Next() {
		var img portfolio.Image
		if err := rows.Scan(&img.ID, &img.PortfolioID, &img.URL, &img.AltText, &img.SortOrder); err != nil {
			return nil, err
		}
		images = append(images, img)
	}
	return images, nil
}

// DeleteImage removes a portfolio image.
func (r *PortfolioRepo) DeleteImage(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM portfolio_images WHERE id = $1`, id)
	return err
}

// ── Helpers ──────────────────────────────────────────

type portfolioScannable interface {
	Scan(dest ...interface{}) error
}

func (r *PortfolioRepo) scanItem(row portfolioScannable) (*portfolio.Item, error) {
	var item portfolio.Item
	err := row.Scan(
		&item.ID, &item.ListingID, &item.Title, &item.Description,
		&item.PreviewType, &item.PreviewURL, &item.DesktopScreenshot, &item.MobileScreenshot,
		&item.ClientName, &item.TechStack, &item.IsFeatured, &item.SortOrder, &item.IsActive,
		&item.CreatedAt, &item.UpdatedAt,
		&item.ListingTitle,
	)
	if err != nil {
		return nil, err
	}
	return &item, nil
}
