package postgres

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/domain/listings"
)

// ListingsRepo handles listing database operations.
type ListingsRepo struct {
	db *pgxpool.Pool
}

// NewListingsRepo creates a new ListingsRepo.
func NewListingsRepo(db *pgxpool.Pool) *ListingsRepo {
	return &ListingsRepo{db: db}
}

// FindAll returns paginated listings with optional filters.
func (r *ListingsRepo) FindAll(ctx context.Context, f listings.ListingFilter) (*listings.ListingListResult, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 || f.Limit > 50 {
		f.Limit = 12
	}

	where := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if f.ListingType != "" {
		where = append(where, fmt.Sprintf("l.listing_type = $%d", argIdx))
		args = append(args, string(f.ListingType))
		argIdx++
	}
	if f.CategoryID != "" {
		where = append(where, fmt.Sprintf("l.category_id = $%d", argIdx))
		args = append(args, f.CategoryID)
		argIdx++
	}
	if f.Query != "" {
		where = append(where, fmt.Sprintf("(l.title ILIKE $%d OR l.short_desc ILIKE $%d)", argIdx, argIdx))
		args = append(args, "%"+f.Query+"%")
		argIdx++
	}
	if f.IsFeatured != nil {
		where = append(where, fmt.Sprintf("l.is_featured = $%d", argIdx))
		args = append(args, *f.IsFeatured)
		argIdx++
	}
	if f.IsActive != nil {
		where = append(where, fmt.Sprintf("l.is_active = $%d", argIdx))
		args = append(args, *f.IsActive)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	orderBy := "l.sort_order ASC, l.created_at DESC"
	switch f.Sort {
	case "newest":
		orderBy = "l.created_at DESC"
	case "popular":
		orderBy = "l.total_orders DESC"
	case "price_asc":
		orderBy = "l.base_price ASC"
	case "price_desc":
		orderBy = "l.base_price DESC"
	}

	// Count
	countQ := fmt.Sprintf(`SELECT COUNT(*) FROM listings l WHERE %s`, whereClause)
	var total int
	if err := r.db.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, fmt.Errorf("count listings: %w", err)
	}

	offset := (f.Page - 1) * f.Limit
	args = append(args, f.Limit, offset)

	query := fmt.Sprintf(`
		SELECT l.id, l.title, l.slug, l.description, l.short_desc, l.cover_url,
			l.listing_type, l.category_id, l.base_price, l.meta_title, l.meta_desc,
			l.features, l.tech_stack, l.estimated_days, l.auto_delivery,
			l.is_featured, l.is_active, l.sort_order,
			l.total_orders, l.avg_rating, l.review_count,
			l.created_at, l.updated_at,
			COALESCE(c.name, '') AS cat_name, COALESCE(c.slug, '') AS cat_slug, COALESCE(c.icon, '') AS cat_icon
		FROM listings l
		LEFT JOIN listing_categories c ON c.id = l.category_id
		WHERE %s
		ORDER BY %s
		LIMIT $%d OFFSET $%d
	`, whereClause, orderBy, argIdx, argIdx+1)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query listings: %w", err)
	}
	defer rows.Close()

	items := []listings.Listing{}
	for rows.Next() {
		var li listings.Listing
		var catID *string
		var catName, catSlug, catIcon string
		if err := rows.Scan(
			&li.ID, &li.Title, &li.Slug, &li.Description, &li.ShortDesc, &li.CoverURL,
			&li.ListingType, &catID, &li.BasePrice, &li.MetaTitle, &li.MetaDesc,
			&li.Features, &li.TechStack, &li.EstimatedDays, &li.AutoDelivery,
			&li.IsFeatured, &li.IsActive, &li.SortOrder,
			&li.TotalOrders, &li.AvgRating, &li.ReviewCount,
			&li.CreatedAt, &li.UpdatedAt,
			&catName, &catSlug, &catIcon,
		); err != nil {
			return nil, fmt.Errorf("scan listing: %w", err)
		}
		li.CategoryID = catID
		if catName != "" {
			li.Category = &listings.ListingCategory{Name: catName, Slug: catSlug, Icon: catIcon}
			if catID != nil {
				li.Category.ID = *catID
			}
		}
		items = append(items, li)
	}

	return &listings.ListingListResult{
		Items:      items,
		Total:      total,
		Page:       f.Page,
		Limit:      f.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(f.Limit))),
	}, nil
}

// FindBySlug returns a single listing by slug with packages and FAQ.
func (r *ListingsRepo) FindBySlug(ctx context.Context, slug string) (*listings.Listing, error) {
	var li listings.Listing
	var catID *string
	var catName, catSlug, catIcon string

	err := r.db.QueryRow(ctx, `
		SELECT l.id, l.title, l.slug, l.description, l.short_desc, l.cover_url,
			l.listing_type, l.category_id, l.base_price, l.meta_title, l.meta_desc,
			l.features, l.tech_stack, l.estimated_days, l.auto_delivery,
			l.delivery_file_url, l.delivery_file_name, l.delivery_file_size,
			l.delivery_expiry_days, l.delivery_max_downloads,
			l.is_featured, l.is_active, l.sort_order,
			l.total_orders, l.avg_rating, l.review_count,
			l.created_at, l.updated_at,
			COALESCE(c.name, ''), COALESCE(c.slug, ''), COALESCE(c.icon, '')
		FROM listings l
		LEFT JOIN listing_categories c ON c.id = l.category_id
		WHERE l.slug = $1
	`, slug).Scan(
		&li.ID, &li.Title, &li.Slug, &li.Description, &li.ShortDesc, &li.CoverURL,
		&li.ListingType, &catID, &li.BasePrice, &li.MetaTitle, &li.MetaDesc,
		&li.Features, &li.TechStack, &li.EstimatedDays, &li.AutoDelivery,
		&li.DeliveryFileURL, &li.DeliveryFileName, &li.DeliveryFileSize,
		&li.DeliveryExpiryDays, &li.DeliveryMaxDownloads,
		&li.IsFeatured, &li.IsActive, &li.SortOrder,
		&li.TotalOrders, &li.AvgRating, &li.ReviewCount,
		&li.CreatedAt, &li.UpdatedAt,
		&catName, &catSlug, &catIcon,
	)
	if err != nil {
		return nil, fmt.Errorf("find listing by slug: %w", err)
	}
	li.CategoryID = catID
	if catName != "" {
		li.Category = &listings.ListingCategory{Name: catName, Slug: catSlug, Icon: catIcon}
		if catID != nil {
			li.Category.ID = *catID
		}
	}

	// Load packages
	pkgRows, err := r.db.Query(ctx, `
		SELECT id, listing_id, name, description, price, features, estimated_days, max_revisions, sort_order, is_active
		FROM listing_packages WHERE listing_id = $1 AND is_active = true ORDER BY sort_order
	`, li.ID)
	if err == nil {
		defer pkgRows.Close()
		for pkgRows.Next() {
			var p listings.Package
			if err := pkgRows.Scan(&p.ID, &p.ListingID, &p.Name, &p.Description, &p.Price,
				&p.Features, &p.EstimatedDays, &p.MaxRevisions, &p.SortOrder, &p.IsActive); err == nil {
				li.Packages = append(li.Packages, p)
			}
		}
	}

	// Load FAQ
	faqRows, err := r.db.Query(ctx, `
		SELECT id, listing_id, question, answer, sort_order
		FROM listing_faq WHERE listing_id = $1 ORDER BY sort_order
	`, li.ID)
	if err == nil {
		defer faqRows.Close()
		for faqRows.Next() {
			var f listings.FAQ
			if err := faqRows.Scan(&f.ID, &f.ListingID, &f.Question, &f.Answer, &f.SortOrder); err == nil {
				li.FAQ = append(li.FAQ, f)
			}
		}
	}

	return &li, nil
}

// FindByID returns a listing by ID.
func (r *ListingsRepo) FindByID(ctx context.Context, id string) (*listings.Listing, error) {
	var li listings.Listing
	var catID *string

	err := r.db.QueryRow(ctx, `
		SELECT id, title, slug, description, short_desc, cover_url,
			listing_type, category_id, base_price, meta_title, meta_desc,
			features, tech_stack, estimated_days, auto_delivery,
			delivery_file_url, delivery_file_name, delivery_file_size,
			delivery_expiry_days, delivery_max_downloads,
			delivery_email_template, delivery_wa_template,
			is_featured, is_active, sort_order,
			total_orders, avg_rating, review_count,
			created_at, updated_at
		FROM listings WHERE id = $1
	`, id).Scan(
		&li.ID, &li.Title, &li.Slug, &li.Description, &li.ShortDesc, &li.CoverURL,
		&li.ListingType, &catID, &li.BasePrice, &li.MetaTitle, &li.MetaDesc,
		&li.Features, &li.TechStack, &li.EstimatedDays, &li.AutoDelivery,
		&li.DeliveryFileURL, &li.DeliveryFileName, &li.DeliveryFileSize,
		&li.DeliveryExpiryDays, &li.DeliveryMaxDownloads,
		&li.DeliveryEmailTpl, &li.DeliveryWATpl,
		&li.IsFeatured, &li.IsActive, &li.SortOrder,
		&li.TotalOrders, &li.AvgRating, &li.ReviewCount,
		&li.CreatedAt, &li.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("find listing by id: %w", err)
	}
	li.CategoryID = catID
	return &li, nil
}

// Create inserts a new listing.
func (r *ListingsRepo) Create(ctx context.Context, li *listings.Listing) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO listings (id, title, slug, description, short_desc, cover_url,
			listing_type, category_id, base_price, meta_title, meta_desc,
			features, tech_stack, estimated_days, is_featured, is_active, sort_order)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
	`, li.ID, li.Title, li.Slug, li.Description, li.ShortDesc, li.CoverURL,
		li.ListingType, li.CategoryID, li.BasePrice, li.MetaTitle, li.MetaDesc,
		li.Features, li.TechStack, li.EstimatedDays, li.IsFeatured, li.IsActive, li.SortOrder)
	return err
}

// Update modifies an existing listing.
func (r *ListingsRepo) Update(ctx context.Context, li *listings.Listing) error {
	_, err := r.db.Exec(ctx, `
		UPDATE listings SET title=$2, slug=$3, description=$4, short_desc=$5, cover_url=$6,
			listing_type=$7, category_id=$8, base_price=$9, meta_title=$10, meta_desc=$11,
			features=$12, tech_stack=$13, estimated_days=$14, is_featured=$15, is_active=$16,
			sort_order=$17, auto_delivery=$18, delivery_file_url=$19, delivery_file_name=$20,
			delivery_file_size=$21, delivery_expiry_days=$22, delivery_max_downloads=$23,
			delivery_email_template=$24, delivery_wa_template=$25, updated_at=NOW()
		WHERE id=$1
	`, li.ID, li.Title, li.Slug, li.Description, li.ShortDesc, li.CoverURL,
		li.ListingType, li.CategoryID, li.BasePrice, li.MetaTitle, li.MetaDesc,
		li.Features, li.TechStack, li.EstimatedDays, li.IsFeatured, li.IsActive,
		li.SortOrder, li.AutoDelivery, li.DeliveryFileURL, li.DeliveryFileName,
		li.DeliveryFileSize, li.DeliveryExpiryDays, li.DeliveryMaxDownloads,
		li.DeliveryEmailTpl, li.DeliveryWATpl)
	return err
}

// Delete removes a listing.
func (r *ListingsRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM listings WHERE id = $1`, id)
	return err
}

// ── Categories ─────────────────────────────────────────

// FindAllCategories returns all listing categories.
func (r *ListingsRepo) FindAllCategories(ctx context.Context) ([]listings.ListingCategory, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, slug, icon, description, sort_order, is_active
		FROM listing_categories ORDER BY sort_order
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cats []listings.ListingCategory
	for rows.Next() {
		var c listings.ListingCategory
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Icon, &c.Description, &c.SortOrder, &c.IsActive); err != nil {
			return nil, err
		}
		cats = append(cats, c)
	}
	return cats, nil
}

// ── Packages ───────────────────────────────────────────

// CreatePackage inserts a listing package.
func (r *ListingsRepo) CreatePackage(ctx context.Context, p *listings.Package) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO listing_packages (id, listing_id, name, description, price, features, estimated_days, max_revisions, sort_order, is_active)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
	`, p.ID, p.ListingID, p.Name, p.Description, p.Price, p.Features, p.EstimatedDays, p.MaxRevisions, p.SortOrder, p.IsActive)
	return err
}

// UpdatePackage modifies a listing package.
func (r *ListingsRepo) UpdatePackage(ctx context.Context, p *listings.Package) error {
	_, err := r.db.Exec(ctx, `
		UPDATE listing_packages SET name=$2, description=$3, price=$4, features=$5,
			estimated_days=$6, max_revisions=$7, sort_order=$8, is_active=$9
		WHERE id=$1
	`, p.ID, p.Name, p.Description, p.Price, p.Features, p.EstimatedDays, p.MaxRevisions, p.SortOrder, p.IsActive)
	return err
}

// DeletePackage removes a listing package.
func (r *ListingsRepo) DeletePackage(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM listing_packages WHERE id = $1`, id)
	return err
}

// ── FAQ ────────────────────────────────────────────────

// CreateFAQ inserts a listing FAQ.
func (r *ListingsRepo) CreateFAQ(ctx context.Context, f *listings.FAQ) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO listing_faq (id, listing_id, question, answer, sort_order) VALUES ($1,$2,$3,$4,$5)
	`, f.ID, f.ListingID, f.Question, f.Answer, f.SortOrder)
	return err
}

// DeleteFAQ removes a listing FAQ.
func (r *ListingsRepo) DeleteFAQ(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM listing_faq WHERE id = $1`, id)
	return err
}

// IncrementOrderCount increments the total_orders counter.
func (r *ListingsRepo) IncrementOrderCount(ctx context.Context, listingID string) error {
	_, err := r.db.Exec(ctx, `UPDATE listings SET total_orders = total_orders + 1 WHERE id = $1`, listingID)
	return err
}

// UpdateRating recalculates avg_rating and review_count from listing_reviews.
func (r *ListingsRepo) UpdateRating(ctx context.Context, listingID string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE listings SET
			avg_rating = COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM listing_reviews WHERE listing_id = $1 AND is_visible = true), 0),
			review_count = (SELECT COUNT(*) FROM listing_reviews WHERE listing_id = $1 AND is_visible = true)
		WHERE id = $1
	`, listingID)
	return err
}
