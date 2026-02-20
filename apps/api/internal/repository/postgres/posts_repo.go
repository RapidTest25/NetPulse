package postgres

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/domain/posts"
)

type PostsRepo struct {
	db *pgxpool.Pool
}

func NewPostsRepo(db *pgxpool.Pool) *PostsRepo {
	return &PostsRepo{db: db}
}

func (r *PostsRepo) FindAll(ctx context.Context, filter posts.PostListFilter) (*posts.PostListResult, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if filter.Status != "" {
		conditions = append(conditions, fmt.Sprintf("p.status = $%d", argIdx))
		args = append(args, string(filter.Status))
		argIdx++
	} else {
		conditions = append(conditions, fmt.Sprintf("p.status = $%d", argIdx))
		args = append(args, string(posts.StatusPublished))
		argIdx++
	}

	if filter.CategoryID != "" {
		conditions = append(conditions, fmt.Sprintf("c.slug = $%d", argIdx))
		args = append(args, filter.CategoryID)
		argIdx++
	}

	if filter.AuthorID != "" {
		conditions = append(conditions, fmt.Sprintf("p.author_id = $%d", argIdx))
		args = append(args, filter.AuthorID)
		argIdx++
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total
	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM posts p LEFT JOIN categories c ON p.category_id = c.id %s`, where)
	var total int
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, err
	}

	// Sort
	orderBy := "p.published_at DESC NULLS LAST"
	if filter.Sort == "oldest" {
		orderBy = "p.published_at ASC NULLS LAST"
	}

	// Fetch posts
	offset := (filter.Page - 1) * filter.Limit
	query := fmt.Sprintf(`
		SELECT p.id, p.title, p.slug, p.excerpt, p.body, p.cover_url, 
			   p.status, p.author_id, p.category_id, p.published_at,
			   p.meta_title, p.meta_description, p.created_at, p.updated_at,
			   COALESCE(c.name, '') as category_name, COALESCE(c.slug, '') as category_slug,
			   COALESCE(u.name, '') as author_name
		FROM posts p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN users u ON p.author_id = u.id
		%s
		ORDER BY %s
		LIMIT $%d OFFSET $%d
	`, where, orderBy, argIdx, argIdx+1)

	args = append(args, filter.Limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []posts.Post
	for rows.Next() {
		var p posts.Post
		var catName, catSlug, authorName string
		err := rows.Scan(
			&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.Body, &p.CoverURL,
			&p.Status, &p.AuthorID, &p.CategoryID, &p.PublishedAt,
			&p.MetaTitle, &p.MetaDesc, &p.CreatedAt, &p.UpdatedAt,
			&catName, &catSlug, &authorName,
		)
		if err != nil {
			return nil, err
		}
		if catName != "" {
			p.Category = &posts.Category{Name: catName, Slug: catSlug}
		}
		if authorName != "" {
			p.Author = &posts.Author{ID: p.AuthorID, Name: authorName}
		}
		items = append(items, p)
	}

	return &posts.PostListResult{
		Items:      items,
		Page:       filter.Page,
		Limit:      filter.Limit,
		Total:      total,
		TotalPages: int(math.Ceil(float64(total) / float64(filter.Limit))),
	}, nil
}

func (r *PostsRepo) FindBySlug(ctx context.Context, slug string) (*posts.Post, error) {
	query := `
		SELECT p.id, p.title, p.slug, p.excerpt, p.body, p.cover_url,
			   p.status, p.author_id, p.category_id, p.published_at,
			   p.meta_title, p.meta_description, p.created_at, p.updated_at,
			   COALESCE(c.name, '') as category_name, COALESCE(c.slug, '') as category_slug,
			   COALESCE(u.name, '') as author_name
		FROM posts p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN users u ON p.author_id = u.id
		WHERE p.slug = $1 AND p.status = 'PUBLISHED'
	`
	return r.scanSinglePost(ctx, query, slug)
}

func (r *PostsRepo) FindByID(ctx context.Context, id string) (*posts.Post, error) {
	query := `
		SELECT p.id, p.title, p.slug, p.excerpt, p.body, p.cover_url,
			   p.status, p.author_id, p.category_id, p.published_at,
			   p.meta_title, p.meta_description, p.created_at, p.updated_at,
			   COALESCE(c.name, '') as category_name, COALESCE(c.slug, '') as category_slug,
			   COALESCE(u.name, '') as author_name
		FROM posts p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN users u ON p.author_id = u.id
		WHERE p.id = $1
	`
	return r.scanSinglePost(ctx, query, id)
}

func (r *PostsRepo) scanSinglePost(ctx context.Context, query string, arg interface{}) (*posts.Post, error) {
	var p posts.Post
	var catName, catSlug, authorName string

	err := r.db.QueryRow(ctx, query, arg).Scan(
		&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.Body, &p.CoverURL,
		&p.Status, &p.AuthorID, &p.CategoryID, &p.PublishedAt,
		&p.MetaTitle, &p.MetaDesc, &p.CreatedAt, &p.UpdatedAt,
		&catName, &catSlug, &authorName,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("post not found")
	}
	if err != nil {
		return nil, err
	}

	if catName != "" {
		p.Category = &posts.Category{Name: catName, Slug: catSlug}
	}
	if authorName != "" {
		p.Author = &posts.Author{ID: p.AuthorID, Name: authorName}
	}

	// Load tags
	tagRows, err := r.db.Query(ctx, `
		SELECT t.id, t.name, t.slug
		FROM tags t
		JOIN post_tags pt ON pt.tag_id = t.id
		WHERE pt.post_id = $1
	`, p.ID)
	if err == nil {
		defer tagRows.Close()
		for tagRows.Next() {
			var t posts.Tag
			if err := tagRows.Scan(&t.ID, &t.Name, &t.Slug); err == nil {
				p.Tags = append(p.Tags, t)
			}
		}
	}

	return &p, nil
}

func (r *PostsRepo) Create(ctx context.Context, post *posts.Post) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO posts (id, title, slug, excerpt, body, cover_url, status, author_id, category_id,
						   meta_title, meta_description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`, post.ID, post.Title, post.Slug, post.Excerpt, post.Body, post.CoverURL,
		post.Status, post.AuthorID, post.CategoryID,
		post.MetaTitle, post.MetaDesc, post.CreatedAt, post.UpdatedAt)
	return err
}

func (r *PostsRepo) Update(ctx context.Context, post *posts.Post) error {
	_, err := r.db.Exec(ctx, `
		UPDATE posts SET title=$2, slug=$3, excerpt=$4, body=$5, cover_url=$6,
			   status=$7, category_id=$8, published_at=$9, scheduled_at=$10,
			   meta_title=$11, meta_description=$12, updated_at=$13,
			   search_vector = to_tsvector('english', COALESCE($2,'') || ' ' || COALESCE($4,'') || ' ' || COALESCE($5,''))
		WHERE id=$1
	`, post.ID, post.Title, post.Slug, post.Excerpt, post.Body, post.CoverURL,
		post.Status, post.CategoryID, post.PublishedAt, post.ScheduledAt,
		post.MetaTitle, post.MetaDesc, post.UpdatedAt)
	return err
}

func (r *PostsRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM posts WHERE id = $1`, id)
	return err
}

func (r *PostsRepo) UpdateStatus(ctx context.Context, id string, status posts.PostStatus) error {
	query := `UPDATE posts SET status = $2, updated_at = NOW()`
	if status == posts.StatusPublished {
		query += `, published_at = NOW()`
	}
	query += ` WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id, string(status))
	return err
}

// Search performs Postgres full-text search.
func (r *PostsRepo) Search(ctx context.Context, query string, page, limit int, sort string) (*posts.PostListResult, error) {
	offset := (page - 1) * limit

	orderBy := "ts_rank_cd(p.search_vector, websearch_to_tsquery('english', $1)) DESC"
	if sort == "newest" {
		orderBy = "p.published_at DESC NULLS LAST"
	}

	// Count
	var total int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM posts p
		WHERE p.status = 'PUBLISHED'
		  AND p.search_vector @@ websearch_to_tsquery('english', $1)
	`, query).Scan(&total)
	if err != nil {
		return nil, err
	}

	rows, err := r.db.Query(ctx, fmt.Sprintf(`
		SELECT p.id, p.title, p.slug, p.excerpt, p.cover_url, p.published_at,
			   COALESCE(c.name, '') as category
		FROM posts p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE p.status = 'PUBLISHED'
		  AND p.search_vector @@ websearch_to_tsquery('english', $1)
		ORDER BY %s
		LIMIT $2 OFFSET $3
	`, orderBy), query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []posts.Post
	for rows.Next() {
		var p posts.Post
		var cat string
		if err := rows.Scan(&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.CoverURL, &p.PublishedAt, &cat); err != nil {
			return nil, err
		}
		if cat != "" {
			p.Category = &posts.Category{Name: cat}
		}
		items = append(items, p)
	}

	return &posts.PostListResult{
		Items:      items,
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	}, nil
}

// Suggest returns autocomplete suggestions using FTS prefix matching.
func (r *PostsRepo) Suggest(ctx context.Context, query string, limit int) ([]posts.SuggestResult, error) {
	rows, err := r.db.Query(ctx, `
		SELECT p.title, p.slug, COALESCE(c.name, '') as category
		FROM posts p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE p.status = 'PUBLISHED'
		  AND p.search_vector @@ to_tsquery('english', $1 || ':*')
		ORDER BY ts_rank_cd(p.search_vector, to_tsquery('english', $1 || ':*')) DESC
		LIMIT $2
	`, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []posts.SuggestResult
	for rows.Next() {
		var s posts.SuggestResult
		if err := rows.Scan(&s.Title, &s.Slug, &s.Category); err != nil {
			return nil, err
		}
		results = append(results, s)
	}

	return results, nil
}

// FindPublishedByAuthor returns paginated published posts by an author.
func (r *PostsRepo) FindPublishedByAuthor(ctx context.Context, authorID string, page, limit int) (*posts.PostListResult, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}

	var total int
	r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM posts WHERE author_id = $1 AND status = 'PUBLISHED' AND deleted_at IS NULL`,
		authorID).Scan(&total)

	offset := (page - 1) * limit
	rows, err := r.db.Query(ctx, `
		SELECT p.id, p.title, p.slug, p.excerpt, p.body, p.cover_url,
		       p.status, p.author_id, p.category_id, p.published_at,
		       p.meta_title, p.meta_description, p.created_at, p.updated_at,
		       COALESCE(c.name, '') as category_name, COALESCE(c.slug, '') as category_slug,
		       COALESCE(u.name, '') as author_name
		FROM posts p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN users u ON p.author_id = u.id
		WHERE p.author_id = $1 AND p.status = 'PUBLISHED' AND p.deleted_at IS NULL
		ORDER BY p.published_at DESC NULLS LAST
		LIMIT $2 OFFSET $3
	`, authorID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []posts.Post
	for rows.Next() {
		var p posts.Post
		var catName, catSlug, authorName string
		err := rows.Scan(
			&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.Body, &p.CoverURL,
			&p.Status, &p.AuthorID, &p.CategoryID, &p.PublishedAt,
			&p.MetaTitle, &p.MetaDesc, &p.CreatedAt, &p.UpdatedAt,
			&catName, &catSlug, &authorName,
		)
		if err != nil {
			return nil, err
		}
		if catName != "" {
			p.Category = &posts.Category{Name: catName, Slug: catSlug}
		}
		if authorName != "" {
			p.Author = &posts.Author{ID: p.AuthorID, Name: authorName}
		}
		items = append(items, p)
	}

	return &posts.PostListResult{
		Items:      items,
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	}, nil
}