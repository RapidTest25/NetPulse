package engagement

import "time"

// PostStats holds denormalized counters.
type PostStats struct {
	PostID        string `json:"post_id"`
	ViewsCount    int64  `json:"views_count"`
	LikesCount    int64  `json:"likes_count"`
	CommentsCount int64  `json:"comments_count"`
}

// Like represents a like on a post.
type Like struct {
	ID        string    `json:"id"`
	PostID    string    `json:"post_id"`
	UserID    *string   `json:"user_id,omitempty"`
	GuestKey  string    `json:"guest_key,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// LikeResponse returned on toggle.
type LikeResponse struct {
	Liked      bool  `json:"liked"`
	LikesCount int64 `json:"likes_count"`
}

// ViewRecordInput for view tracking.
type ViewRecordInput struct {
	PostID    string `json:"post_id"`
	IPHash    string `json:"-"`
	UserAgent string `json:"-"`
	Referrer  string `json:"-"`
}

// DashboardStats for admin dashboard.
type DashboardStats struct {
	TotalPosts         int `json:"total_posts"`
	PublishedPosts     int `json:"published_posts"`
	DraftPosts         int `json:"draft_posts"`
	ScheduledPosts     int `json:"scheduled_posts"`
	TotalUsers         int `json:"total_users"`
	VerifiedUsers      int `json:"verified_users"`
	TotalComments      int `json:"total_comments"`
	PendingComments    int `json:"pending_comments"`
	ApprovedComments   int `json:"approved_comments"`
	TotalViews         int64 `json:"total_views"`
	TotalLikes         int64 `json:"total_likes"`
	TotalReferrals     int `json:"total_referrals"`
	VerifiedReferrals  int `json:"verified_referrals"`
}

// TopPost for dashboard ranking.
type TopPost struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	Slug          string `json:"slug"`
	ViewsCount    int64  `json:"views_count"`
	LikesCount    int64  `json:"likes_count"`
	CommentsCount int64  `json:"comments_count"`
}

// PostDetailStats for admin post view.
type PostDetailStats struct {
	PostID        string       `json:"post_id"`
	ViewsCount    int64        `json:"views_count"`
	LikesCount    int64        `json:"likes_count"`
	CommentsCount int64        `json:"comments_count"`
	ViewsByDay    []DayStat    `json:"views_by_day,omitempty"`
}

// DayStat for daily breakdown.
type DayStat struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

// TrafficOverview for admin traffic monitoring.
type TrafficOverview struct {
	ViewsByDay    []DayStat `json:"views_by_day"`
	ViewsByHour   []DayStat `json:"views_by_hour"`
	TodayViews    int64     `json:"today_views"`
	YesterdayViews int64    `json:"yesterday_views"`
	WeekViews     int64     `json:"week_views"`
	MonthViews    int64     `json:"month_views"`
	TopReferrers  []RefStat `json:"top_referrers"`
	TopPages      []PageStat `json:"top_pages"`
}

// RefStat for referrer stats.
type RefStat struct {
	Source string `json:"source"`
	Count  int64  `json:"count"`
}

// PageStat for popular page stats.
type PageStat struct {
	PostID string `json:"post_id"`
	Title  string `json:"title"`
	Slug   string `json:"slug"`
	Count  int64  `json:"count"`
}
