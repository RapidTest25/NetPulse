package posts

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/rapidtest/netpulse-api/internal/utils"
)

// Repository defines the data access interface for posts.
type Repository interface {
	FindAll(ctx context.Context, filter PostListFilter) (*PostListResult, error)
	FindBySlug(ctx context.Context, slug string) (*Post, error)
	FindByID(ctx context.Context, id string) (*Post, error)
	Create(ctx context.Context, post *Post) error
	Update(ctx context.Context, post *Post) error
	Delete(ctx context.Context, id string) error
	UpdateStatus(ctx context.Context, id string, status PostStatus) error
	Search(ctx context.Context, query string, page, limit int, sort string) (*PostListResult, error)
	Suggest(ctx context.Context, query string, limit int) ([]SuggestResult, error)
}

// CacheRepository defines a cache interface.
type CacheRepository interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value string, ttl time.Duration) error
	Delete(ctx context.Context, keys ...string) error
	DeleteByPrefix(ctx context.Context, prefix string) error
}

// Service contains business logic for posts.
type Service struct {
	repo  Repository
	cache CacheRepository
}

func NewService(repo Repository, cache CacheRepository) *Service {
	return &Service{repo: repo, cache: cache}
}

// List returns paginated posts.
func (s *Service) List(ctx context.Context, filter PostListFilter) (*PostListResult, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 50 {
		filter.Limit = 10
	}

	result, err := s.repo.FindAll(ctx, filter)
	if err != nil {
		return nil, err
	}

	result.TotalPages = int(math.Ceil(float64(result.Total) / float64(result.Limit)))
	return result, nil
}

// GetBySlug returns a single published post by slug.
func (s *Service) GetBySlug(ctx context.Context, slug string) (*Post, error) {
	return s.repo.FindBySlug(ctx, slug)
}

// GetByID returns a post by ID (admin use).
func (s *Service) GetByID(ctx context.Context, id string) (*Post, error) {
	return s.repo.FindByID(ctx, id)
}

// Create creates a new draft post.
func (s *Service) Create(ctx context.Context, input CreatePostInput, authorID string) (*Post, error) {
	post := &Post{
		ID:         utils.NewID(),
		Title:      input.Title,
		Slug:       utils.Slugify(input.Title),
		Excerpt:    input.Excerpt,
		Body:       input.Body,
		CoverURL:   input.CoverURL,
		Status:     StatusDraft,
		AuthorID:   authorID,
		MetaTitle:  input.MetaTitle,
		MetaDesc:   input.MetaDesc,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	if input.CategoryID != "" {
		post.CategoryID = &input.CategoryID
	}

	if err := s.repo.Create(ctx, post); err != nil {
		return nil, err
	}

	return post, nil
}

// Update modifies an existing post.
func (s *Service) Update(ctx context.Context, id string, input UpdatePostInput) (*Post, error) {
	post, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if input.Title != nil {
		post.Title = *input.Title
		post.Slug = utils.Slugify(*input.Title)
	}
	if input.Body != nil {
		post.Body = *input.Body
	}
	if input.Excerpt != nil {
		post.Excerpt = *input.Excerpt
	}
	if input.CoverURL != nil {
		post.CoverURL = *input.CoverURL
	}
	if input.CategoryID != nil {
		post.CategoryID = input.CategoryID
	}
	if input.MetaTitle != nil {
		post.MetaTitle = *input.MetaTitle
	}
	if input.MetaDesc != nil {
		post.MetaDesc = *input.MetaDesc
	}
	post.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, post); err != nil {
		return nil, err
	}

	// Invalidate cache
	_ = s.cache.DeleteByPrefix(ctx, "posts:")

	return post, nil
}

// Delete removes a post.
func (s *Service) Delete(ctx context.Context, id string) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	_ = s.cache.DeleteByPrefix(ctx, "posts:")
	return nil
}

// SubmitReview transitions a draft to IN_REVIEW.
func (s *Service) SubmitReview(ctx context.Context, id string) error {
	post, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if post.Status != StatusDraft && post.Status != StatusChangesRequested {
		return fmt.Errorf("post must be in DRAFT or CHANGES_REQUESTED to submit for review")
	}
	return s.repo.UpdateStatus(ctx, id, StatusInReview)
}

// Publish transitions a post to PUBLISHED.
func (s *Service) Publish(ctx context.Context, id string) error {
	post, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if post.Status != StatusInReview && post.Status != StatusScheduled && post.Status != StatusDraft {
		return fmt.Errorf("post cannot be published from status: %s", post.Status)
	}
	if err := s.repo.UpdateStatus(ctx, id, StatusPublished); err != nil {
		return err
	}
	_ = s.cache.DeleteByPrefix(ctx, "posts:")
	return nil
}

// Schedule sets a post to be published at a future time.
func (s *Service) Schedule(ctx context.Context, id string, scheduledAt time.Time) error {
	if scheduledAt.Before(time.Now()) {
		return fmt.Errorf("scheduled time must be in the future")
	}
	post, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if post.Status != StatusDraft && post.Status != StatusInReview {
		return fmt.Errorf("post cannot be scheduled from status: %s", post.Status)
	}
	post.ScheduledAt = &scheduledAt
	post.Status = StatusScheduled
	post.UpdatedAt = time.Now()
	return s.repo.Update(ctx, post)
}

// Search performs full-text search.
func (s *Service) Search(ctx context.Context, query string, page, limit int, sort string) (*PostListResult, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}
	return s.repo.Search(ctx, query, page, limit, sort)
}

// Suggest returns autocomplete suggestions.
func (s *Service) Suggest(ctx context.Context, query string, limit int) ([]SuggestResult, error) {
	if limit < 1 || limit > 10 {
		limit = 5
	}
	return s.repo.Suggest(ctx, query, limit)
}
