package postgres

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/domain/engagement"
)

type EngagementRepo struct {
	db *pgxpool.Pool
}

func NewEngagementRepo(db *pgxpool.Pool) *EngagementRepo {
	return &EngagementRepo{db: db}
}

// ── Post Stats ──────────────────────────────────────

// GetStats returns post stats, creating if not exists.
func (r *EngagementRepo) GetStats(ctx context.Context, postID string) (*engagement.PostStats, error) {
	var s engagement.PostStats
	err := r.db.QueryRow(ctx, `
		SELECT post_id, views_count, likes_count, comments_count
		FROM post_stats WHERE post_id = $1
	`, postID).Scan(&s.PostID, &s.ViewsCount, &s.LikesCount, &s.CommentsCount)
	if err != nil {
		// Create stats row if not exists
		_, _ = r.db.Exec(ctx, `
			INSERT INTO post_stats (post_id) VALUES ($1) ON CONFLICT DO NOTHING
		`, postID)
		return &engagement.PostStats{PostID: postID}, nil
	}
	return &s, nil
}

// IncrementViews atomically increments view count.
func (r *EngagementRepo) IncrementViews(ctx context.Context, postID string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO post_stats (post_id, views_count, updated_at) VALUES ($1, 1, NOW())
		ON CONFLICT (post_id) DO UPDATE SET views_count = post_stats.views_count + 1, updated_at = NOW()
	`, postID)
	return err
}

// IncrementLikes atomically increments like count.
func (r *EngagementRepo) IncrementLikes(ctx context.Context, postID string, delta int) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO post_stats (post_id, likes_count, updated_at) VALUES ($1, GREATEST(0, $2), NOW())
		ON CONFLICT (post_id) DO UPDATE SET likes_count = GREATEST(0, post_stats.likes_count + $2), updated_at = NOW()
	`, postID, delta)
	return err
}

// IncrementComments atomically increments comment count.
func (r *EngagementRepo) IncrementComments(ctx context.Context, postID string, delta int) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO post_stats (post_id, comments_count, updated_at) VALUES ($1, GREATEST(0, $2), NOW())
		ON CONFLICT (post_id) DO UPDATE SET comments_count = GREATEST(0, post_stats.comments_count + $2), updated_at = NOW()
	`, postID, delta)
	return err
}

// ── Likes ───────────────────────────────────────────

// AddLike creates a like (returns false if already exists).
func (r *EngagementRepo) AddLike(ctx context.Context, postID string, userID *string, guestKey string) (bool, error) {
	var query string
	var args []interface{}

	if userID != nil && *userID != "" {
		query = `INSERT INTO likes (id, post_id, user_id) VALUES (encode(gen_random_bytes(16),'hex'), $1, $2) ON CONFLICT DO NOTHING`
		args = []interface{}{postID, *userID}
	} else {
		query = `INSERT INTO likes (id, post_id, guest_key) VALUES (encode(gen_random_bytes(16),'hex'), $1, $2) ON CONFLICT DO NOTHING`
		args = []interface{}{postID, guestKey}
	}

	result, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

// RemoveLike removes a like.
func (r *EngagementRepo) RemoveLike(ctx context.Context, postID string, userID *string, guestKey string) (bool, error) {
	var query string
	var args []interface{}

	if userID != nil && *userID != "" {
		query = `DELETE FROM likes WHERE post_id = $1 AND user_id = $2`
		args = []interface{}{postID, *userID}
	} else {
		query = `DELETE FROM likes WHERE post_id = $1 AND guest_key = $2 AND user_id IS NULL`
		args = []interface{}{postID, guestKey}
	}

	result, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return false, err
	}
	return result.RowsAffected() > 0, nil
}

// HasLiked checks if a user/guest has liked a post.
func (r *EngagementRepo) HasLiked(ctx context.Context, postID string, userID *string, guestKey string) (bool, error) {
	var exists bool
	var query string
	var args []interface{}

	if userID != nil && *userID != "" {
		query = `SELECT EXISTS(SELECT 1 FROM likes WHERE post_id = $1 AND user_id = $2)`
		args = []interface{}{postID, *userID}
	} else {
		query = `SELECT EXISTS(SELECT 1 FROM likes WHERE post_id = $1 AND guest_key = $2 AND user_id IS NULL)`
		args = []interface{}{postID, guestKey}
	}

	err := r.db.QueryRow(ctx, query, args...).Scan(&exists)
	return exists, err
}

// GetLikesCount returns like count for a post.
func (r *EngagementRepo) GetLikesCount(ctx context.Context, postID string) (int64, error) {
	var count int64
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM likes WHERE post_id = $1`, postID).Scan(&count)
	return count, err
}

// ── Views ───────────────────────────────────────────

// RecordView inserts a view record.
func (r *EngagementRepo) RecordView(ctx context.Context, postID, ipHash, ua, referrer string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO post_views (post_id, ip_hash, user_agent, referrer)
		VALUES ($1, $2, $3, $4)
	`, postID, ipHash, ua, referrer)
	return err
}

// ── Dashboard Stats ─────────────────────────────────

func (r *EngagementRepo) GetDashboardStats(ctx context.Context) (*engagement.DashboardStats, error) {
	s := &engagement.DashboardStats{}

	// Posts stats
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL`).Scan(&s.TotalPosts)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM posts WHERE status = 'PUBLISHED' AND deleted_at IS NULL`).Scan(&s.PublishedPosts)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM posts WHERE status = 'DRAFT' AND deleted_at IS NULL`).Scan(&s.DraftPosts)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM posts WHERE status = 'SCHEDULED' AND deleted_at IS NULL`).Scan(&s.ScheduledPosts)

	// User stats
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE disabled_at IS NULL`).Scan(&s.TotalUsers)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE email_verified_at IS NOT NULL AND disabled_at IS NULL`).Scan(&s.VerifiedUsers)

	// Comment stats
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM comments WHERE deleted_at IS NULL`).Scan(&s.TotalComments)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM comments WHERE status = 'PENDING' AND deleted_at IS NULL`).Scan(&s.PendingComments)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM comments WHERE status = 'APPROVED' AND deleted_at IS NULL`).Scan(&s.ApprovedComments)

	// Engagement totals
	r.db.QueryRow(ctx, `SELECT COALESCE(SUM(views_count), 0) FROM post_stats`).Scan(&s.TotalViews)
	r.db.QueryRow(ctx, `SELECT COALESCE(SUM(likes_count), 0) FROM post_stats`).Scan(&s.TotalLikes)

	// Referral stats
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM referral_events`).Scan(&s.TotalReferrals)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM referral_events WHERE verified = true`).Scan(&s.VerifiedReferrals)

	return s, nil
}

// GetTopPosts returns top posts by a metric.
func (r *EngagementRepo) GetTopPosts(ctx context.Context, orderBy string, limit int) ([]engagement.TopPost, error) {
	col := "views_count"
	switch orderBy {
	case "likes":
		col = "likes_count"
	case "comments":
		col = "comments_count"
	}

	rows, err := r.db.Query(ctx, `
		SELECT p.id, p.title, p.slug, COALESCE(s.views_count, 0), COALESCE(s.likes_count, 0), COALESCE(s.comments_count, 0)
		FROM posts p
		LEFT JOIN post_stats s ON p.id = s.post_id
		WHERE p.status = 'PUBLISHED' AND p.deleted_at IS NULL
		ORDER BY `+col+` DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []engagement.TopPost
	for rows.Next() {
		var p engagement.TopPost
		if err := rows.Scan(&p.ID, &p.Title, &p.Slug, &p.ViewsCount, &p.LikesCount, &p.CommentsCount); err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, nil
}

// GetTrafficOverview returns traffic stats for the admin dashboard.
func (r *EngagementRepo) GetTrafficOverview(ctx context.Context) (*engagement.TrafficOverview, error) {
	t := &engagement.TrafficOverview{}

	// Views counts: today, yesterday, week, month
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM post_views WHERE created_at >= CURRENT_DATE`).Scan(&t.TodayViews)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM post_views WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE`).Scan(&t.YesterdayViews)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM post_views WHERE created_at >= NOW() - INTERVAL '7 days'`).Scan(&t.WeekViews)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM post_views WHERE created_at >= NOW() - INTERVAL '30 days'`).Scan(&t.MonthViews)

	// Views by day (last 30 days)
	rows, err := r.db.Query(ctx, `
		SELECT DATE(created_at) AS day, COUNT(*) AS cnt
		FROM post_views
		WHERE created_at >= NOW() - INTERVAL '30 days'
		GROUP BY DATE(created_at)
		ORDER BY day
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d engagement.DayStat
			var dt time.Time
			if err := rows.Scan(&dt, &d.Count); err == nil {
				d.Date = dt.Format("2006-01-02")
				t.ViewsByDay = append(t.ViewsByDay, d)
			}
		}
	}

	// Views by hour (last 24 hours) for DDoS monitoring
	rows2, err := r.db.Query(ctx, `
		SELECT date_trunc('hour', created_at) AS hr, COUNT(*) AS cnt
		FROM post_views
		WHERE created_at >= NOW() - INTERVAL '24 hours'
		GROUP BY date_trunc('hour', created_at)
		ORDER BY hr
	`)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var d engagement.DayStat
			var dt time.Time
			if err := rows2.Scan(&dt, &d.Count); err == nil {
				d.Date = dt.Format("15:04")
				t.ViewsByHour = append(t.ViewsByHour, d)
			}
		}
	}

	// Top referrers (last 7 days)
	rows3, err := r.db.Query(ctx, `
		SELECT COALESCE(NULLIF(referrer, ''), 'Direct') AS src, COUNT(*) AS cnt
		FROM post_views
		WHERE created_at >= NOW() - INTERVAL '7 days'
		GROUP BY src
		ORDER BY cnt DESC
		LIMIT 10
	`)
	if err == nil {
		defer rows3.Close()
		for rows3.Next() {
			var s engagement.RefStat
			if err := rows3.Scan(&s.Source, &s.Count); err == nil {
				t.TopReferrers = append(t.TopReferrers, s)
			}
		}
	}

	// Top pages (last 7 days)
	rows4, err := r.db.Query(ctx, `
		SELECT v.post_id, p.title, p.slug, COUNT(*) AS cnt
		FROM post_views v
		JOIN posts p ON p.id = v.post_id
		WHERE v.created_at >= NOW() - INTERVAL '7 days'
		GROUP BY v.post_id, p.title, p.slug
		ORDER BY cnt DESC
		LIMIT 10
	`)
	if err == nil {
		defer rows4.Close()
		for rows4.Next() {
			var s engagement.PageStat
			if err := rows4.Scan(&s.PostID, &s.Title, &s.Slug, &s.Count); err == nil {
				t.TopPages = append(t.TopPages, s)
			}
		}
	}

	return t, nil
}

// GetPostDetailStats returns detailed stats for a single post.
func (r *EngagementRepo) GetPostDetailStats(ctx context.Context, postID string) (*engagement.PostDetailStats, error) {
	s := &engagement.PostDetailStats{PostID: postID}

	r.db.QueryRow(ctx, `
		SELECT COALESCE(views_count, 0), COALESCE(likes_count, 0), COALESCE(comments_count, 0)
		FROM post_stats WHERE post_id = $1
	`, postID).Scan(&s.ViewsCount, &s.LikesCount, &s.CommentsCount)

	// Views by day (last 30 days)
	rows, err := r.db.Query(ctx, `
		SELECT DATE(created_at) AS day, COUNT(*) AS cnt
		FROM post_views
		WHERE post_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
		GROUP BY DATE(created_at)
		ORDER BY day
	`, postID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d engagement.DayStat
			var dt time.Time
			if err := rows.Scan(&dt, &d.Count); err == nil {
				d.Date = dt.Format("2006-01-02")
				s.ViewsByDay = append(s.ViewsByDay, d)
			}
		}
	}

	return s, nil
}
