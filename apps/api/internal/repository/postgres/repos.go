package postgres

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/domain/posts"
	"github.com/rapidtest/netpulse-api/internal/domain/users"
)

// ── Categories ──────────────────────────────────────

type CategoriesRepo struct {
	db *pgxpool.Pool
}

func NewCategoriesRepo(db *pgxpool.Pool) *CategoriesRepo {
	return &CategoriesRepo{db: db}
}

func (r *CategoriesRepo) FindAll(ctx context.Context) ([]posts.Category, error) {
	rows, err := r.db.Query(ctx, `SELECT id, name, slug, COALESCE(description, '') FROM categories ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cats []posts.Category
	for rows.Next() {
		var c posts.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Description); err != nil {
			return nil, err
		}
		cats = append(cats, c)
	}
	return cats, nil
}

// ── Tags ────────────────────────────────────────────

type TagsRepo struct {
	db *pgxpool.Pool
}

func NewTagsRepo(db *pgxpool.Pool) *TagsRepo {
	return &TagsRepo{db: db}
}

func (r *TagsRepo) FindAll(ctx context.Context) ([]posts.Tag, error) {
	rows, err := r.db.Query(ctx, `SELECT id, name, slug FROM tags ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []posts.Tag
	for rows.Next() {
		var t posts.Tag
		if err := rows.Scan(&t.ID, &t.Name, &t.Slug); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, nil
}

// ── Users ───────────────────────────────────────────

type UsersRepo struct {
	db *pgxpool.Pool
}

func NewUsersRepo(db *pgxpool.Pool) *UsersRepo {
	return &UsersRepo{db: db}
}

func (r *UsersRepo) FindByEmail(ctx context.Context, email string) (*users.User, error) {
	var u users.User
	err := r.db.QueryRow(ctx, `
		SELECT id, email, name, COALESCE(password_hash,''), COALESCE(avatar,''), COALESCE(bio,''),
		       is_active, email_verified_at, COALESCE(referral_code,''), referred_by,
		       disabled_at, COALESCE(auth_provider,'local'), google_sub,
		       COALESCE(website,''), COALESCE(location,''),
		       COALESCE(social_twitter,''), COALESCE(social_github,''),
		       COALESCE(social_linkedin,''), COALESCE(social_facebook,''),
		       COALESCE(social_instagram,''), COALESCE(social_youtube,''),
		       created_at, updated_at
		FROM users WHERE email = $1
	`, email).Scan(&u.ID, &u.Email, &u.Name, &u.PasswordHash, &u.Avatar, &u.Bio,
		&u.IsActive, &u.EmailVerifiedAt, &u.ReferralCode, &u.ReferredBy,
		&u.DisabledAt, &u.AuthProvider, &u.GoogleSub,
		&u.Website, &u.Location,
		&u.SocialTwitter, &u.SocialGithub,
		&u.SocialLinkedin, &u.SocialFacebook,
		&u.SocialInstagram, &u.SocialYoutube,
		&u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Load roles
	rows, err := r.db.Query(ctx, `
		SELECT r.id, r.name FROM roles r
		JOIN user_roles ur ON ur.role_id = r.id
		WHERE ur.user_id = $1
	`, u.ID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var role users.Role
			if err := rows.Scan(&role.ID, &role.Name); err == nil {
				u.Roles = append(u.Roles, role)
			}
		}
	}

	// Load permissions
	u.Permissions = r.loadUserPermissions(ctx, u.ID)

	return &u, nil
}

func (r *UsersRepo) FindByID(ctx context.Context, id string) (*users.User, error) {
	var u users.User
	err := r.db.QueryRow(ctx, `
		SELECT id, email, name, COALESCE(avatar,''), COALESCE(bio,''),
		       is_active, email_verified_at, COALESCE(referral_code,''), referred_by,
		       disabled_at, COALESCE(auth_provider,'local'), google_sub,
		       COALESCE(website,''), COALESCE(location,''),
		       COALESCE(social_twitter,''), COALESCE(social_github,''),
		       COALESCE(social_linkedin,''), COALESCE(social_facebook,''),
		       COALESCE(social_instagram,''), COALESCE(social_youtube,''),
		       created_at, updated_at
		FROM users WHERE id = $1
	`, id).Scan(&u.ID, &u.Email, &u.Name, &u.Avatar, &u.Bio,
		&u.IsActive, &u.EmailVerifiedAt, &u.ReferralCode, &u.ReferredBy,
		&u.DisabledAt, &u.AuthProvider, &u.GoogleSub,
		&u.Website, &u.Location,
		&u.SocialTwitter, &u.SocialGithub,
		&u.SocialLinkedin, &u.SocialFacebook,
		&u.SocialInstagram, &u.SocialYoutube,
		&u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Load roles
	rows, err := r.db.Query(ctx, `
		SELECT r.id, r.name FROM roles r
		JOIN user_roles ur ON ur.role_id = r.id
		WHERE ur.user_id = $1
	`, u.ID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var role users.Role
			if err := rows.Scan(&role.ID, &role.Name); err == nil {
				u.Roles = append(u.Roles, role)
			}
		}
	}

	u.Permissions = r.loadUserPermissions(ctx, u.ID)
	return &u, nil
}

func (r *UsersRepo) FindAll(ctx context.Context, page, limit int) ([]users.User, int, error) {
	var total int
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&total)

	offset := (page - 1) * limit
	rows, err := r.db.Query(ctx, `
		SELECT id, email, name, COALESCE(avatar,''), is_active, email_verified_at,
		       COALESCE(referral_code,''), disabled_at, created_at, updated_at
		FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var result []users.User
	for rows.Next() {
		var u users.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Avatar, &u.IsActive,
			&u.EmailVerifiedAt, &u.ReferralCode, &u.DisabledAt,
			&u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, 0, err
		}
		// Load roles for each user
		roleRows, err := r.db.Query(ctx, `
			SELECT r.id, r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = $1
		`, u.ID)
		if err == nil {
			for roleRows.Next() {
				var role users.Role
				if err := roleRows.Scan(&role.ID, &role.Name); err == nil {
					u.Roles = append(u.Roles, role)
				}
			}
			roleRows.Close()
		}
		result = append(result, u)
	}
	return result, total, nil
}

func (r *UsersRepo) FindAllFiltered(ctx context.Context, f users.UserFilter) (*users.UserListResult, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if f.Search != "" {
		where = append(where, fmt.Sprintf("(u.name ILIKE $%d OR u.email ILIKE $%d)", argIdx, argIdx))
		args = append(args, "%"+f.Search+"%")
		argIdx++
	}
	if f.Role != "" {
		where = append(where, fmt.Sprintf("EXISTS(SELECT 1 FROM user_roles ur JOIN roles rl ON ur.role_id = rl.id WHERE ur.user_id = u.id AND rl.name = $%d)", argIdx))
		args = append(args, f.Role)
		argIdx++
	}
	if f.Verified != nil {
		if *f.Verified {
			where = append(where, "u.email_verified_at IS NOT NULL")
		} else {
			where = append(where, "u.email_verified_at IS NULL")
		}
	}
	if f.Active != nil {
		if *f.Active {
			where = append(where, "u.disabled_at IS NULL AND u.is_active = true")
		} else {
			where = append(where, "(u.disabled_at IS NOT NULL OR u.is_active = false)")
		}
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	r.db.QueryRow(ctx, fmt.Sprintf("SELECT COUNT(*) FROM users u WHERE %s", whereClause), args...).Scan(&total)

	offset := (f.Page - 1) * f.Limit
	args = append(args, f.Limit, offset)

	rows, err := r.db.Query(ctx, fmt.Sprintf(`
		SELECT u.id, u.email, u.name, COALESCE(u.avatar,''), u.is_active,
		       u.email_verified_at, COALESCE(u.referral_code,''), u.disabled_at,
		       u.created_at, u.updated_at
		FROM users u
		WHERE %s
		ORDER BY u.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []users.User
	for rows.Next() {
		var u users.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Avatar, &u.IsActive,
			&u.EmailVerifiedAt, &u.ReferralCode, &u.DisabledAt,
			&u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		roleRows, err := r.db.Query(ctx, `
			SELECT r.id, r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = $1
		`, u.ID)
		if err == nil {
			for roleRows.Next() {
				var role users.Role
				if err := roleRows.Scan(&role.ID, &role.Name); err == nil {
					u.Roles = append(u.Roles, role)
				}
			}
			roleRows.Close()
		}
		items = append(items, u)
	}

	return &users.UserListResult{
		Items:      items,
		Total:      total,
		Page:       f.Page,
		Limit:      f.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(f.Limit))),
	}, nil
}

func (r *UsersRepo) Create(ctx context.Context, u *users.User) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO users (id, email, name, password_hash, is_active, referral_code, referred_by, auth_provider, google_sub, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`, u.ID, u.Email, u.Name, u.PasswordHash, u.IsActive, u.ReferralCode, u.ReferredBy, u.AuthProvider, u.GoogleSub, u.CreatedAt, u.UpdatedAt)
	return err
}

// FindByGoogleSub finds a user by Google subject ID.
func (r *UsersRepo) FindByGoogleSub(ctx context.Context, googleSub string) (*users.User, error) {
	var u users.User
	err := r.db.QueryRow(ctx, `
		SELECT id, email, name, COALESCE(avatar,''), COALESCE(bio,''),
		       is_active, email_verified_at, COALESCE(referral_code,''), referred_by,
		       disabled_at, COALESCE(auth_provider,'local'), google_sub,
		       COALESCE(website,''), COALESCE(location,''),
		       COALESCE(social_twitter,''), COALESCE(social_github,''),
		       COALESCE(social_linkedin,''), COALESCE(social_facebook,''),
		       COALESCE(social_instagram,''), COALESCE(social_youtube,''),
		       created_at, updated_at
		FROM users WHERE google_sub = $1
	`, googleSub).Scan(&u.ID, &u.Email, &u.Name, &u.Avatar, &u.Bio,
		&u.IsActive, &u.EmailVerifiedAt, &u.ReferralCode, &u.ReferredBy,
		&u.DisabledAt, &u.AuthProvider, &u.GoogleSub,
		&u.Website, &u.Location,
		&u.SocialTwitter, &u.SocialGithub,
		&u.SocialLinkedin, &u.SocialFacebook,
		&u.SocialInstagram, &u.SocialYoutube,
		&u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Load roles
	rows, err := r.db.Query(ctx, `
		SELECT r.id, r.name FROM roles r
		JOIN user_roles ur ON ur.role_id = r.id
		WHERE ur.user_id = $1
	`, u.ID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var role users.Role
			if err := rows.Scan(&role.ID, &role.Name); err == nil {
				u.Roles = append(u.Roles, role)
			}
		}
	}

	u.Permissions = r.loadUserPermissions(ctx, u.ID)
	return &u, nil
}

// LinkGoogleAccount links a Google sub to an existing user.
func (r *UsersRepo) LinkGoogleAccount(ctx context.Context, userID, googleSub, avatar string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE users SET google_sub = $1, auth_provider = 'google',
		       avatar = CASE WHEN avatar = '' OR avatar IS NULL THEN $2 ELSE avatar END,
		       email_verified_at = COALESCE(email_verified_at, NOW()),
		       updated_at = NOW()
		WHERE id = $3
	`, googleSub, avatar, userID)
	return err
}

func (r *UsersRepo) SetRole(ctx context.Context, userID, roleID string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
		ON CONFLICT (user_id, role_id) DO NOTHING
	`, userID, roleID)
	return err
}

func (r *UsersRepo) ClearRoles(ctx context.Context, userID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM user_roles WHERE user_id = $1`, userID)
	return err
}

func (r *UsersRepo) UpdatePassword(ctx context.Context, userID, passwordHash string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2
	`, passwordHash, userID)
	return err
}

func (r *UsersRepo) DisableUser(ctx context.Context, userID string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE users SET disabled_at = NOW(), is_active = false, updated_at = NOW() WHERE id = $1
	`, userID)
	return err
}

func (r *UsersRepo) EnableUser(ctx context.Context, userID string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE users SET disabled_at = NULL, is_active = true, updated_at = NOW() WHERE id = $1
	`, userID)
	return err
}

func (r *UsersRepo) EmailExists(ctx context.Context, email string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email).Scan(&exists)
	return exists, err
}

// UpdateEmail changes the user's email address.
func (r *UsersRepo) UpdateEmail(ctx context.Context, userID, newEmail string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE users SET email = $1, email_verified_at = NOW(), updated_at = NOW() WHERE id = $2
	`, newEmail, userID)
	return err
}

// UpdateProfile updates user's name, bio, and avatar.
func (r *UsersRepo) UpdateProfile(ctx context.Context, u *users.User) error {
	_, err := r.db.Exec(ctx, `
		UPDATE users SET name = $1, bio = $2, avatar = $3,
		       website = $4, location = $5,
		       social_twitter = $6, social_github = $7,
		       social_linkedin = $8, social_facebook = $9,
		       social_instagram = $10, social_youtube = $11,
		       updated_at = NOW()
		WHERE id = $12
	`, u.Name, u.Bio, u.Avatar,
		u.Website, u.Location,
		u.SocialTwitter, u.SocialGithub,
		u.SocialLinkedin, u.SocialFacebook,
		u.SocialInstagram, u.SocialYoutube,
		u.ID)
	return err
}

// GetAuthorPublicStats returns public stats for a user's profile page.
func (r *UsersRepo) GetAuthorPublicStats(ctx context.Context, userID string) map[string]int {
	var publishedPosts, totalViews, totalLikes, totalComments int

	r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM posts WHERE author_id = $1 AND status = 'PUBLISHED' AND deleted_at IS NULL`,
		userID).Scan(&publishedPosts)

	r.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(ps.views_count), 0) FROM post_stats ps
		 JOIN posts p ON p.id = ps.post_id
		 WHERE p.author_id = $1 AND p.status = 'PUBLISHED' AND p.deleted_at IS NULL`,
		userID).Scan(&totalViews)

	r.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(ps.likes_count), 0) FROM post_stats ps
		 JOIN posts p ON p.id = ps.post_id
		 WHERE p.author_id = $1 AND p.status = 'PUBLISHED' AND p.deleted_at IS NULL`,
		userID).Scan(&totalLikes)

	r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM comments c
		 JOIN posts p ON p.id = c.post_id
		 WHERE p.author_id = $1 AND c.status = 'APPROVED' AND c.deleted_at IS NULL AND p.deleted_at IS NULL`,
		userID).Scan(&totalComments)

	return map[string]int{
		"published_posts": publishedPosts,
		"total_views":     totalViews,
		"total_likes":     totalLikes,
		"total_comments":  totalComments,
	}
}

// loadUserPermissions loads all permission names for a user through their roles.
func (r *UsersRepo) loadUserPermissions(ctx context.Context, userID string) []string {
	rows, err := r.db.Query(ctx, `
		SELECT DISTINCT p.name
		FROM permissions p
		JOIN role_permissions rp ON rp.permission_id = p.id
		JOIN user_roles ur ON ur.role_id = rp.role_id
		WHERE ur.user_id = $1
	`, userID)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var perms []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err == nil {
			perms = append(perms, name)
		}
	}
	return perms
}

// ── Roles ───────────────────────────────────────────

type RolesRepo struct {
	db *pgxpool.Pool
}

func NewRolesRepo(db *pgxpool.Pool) *RolesRepo {
	return &RolesRepo{db: db}
}

func (r *RolesRepo) FindByName(ctx context.Context, name string) (string, error) {
	var id string
	err := r.db.QueryRow(ctx, `SELECT id FROM roles WHERE name = $1`, name).Scan(&id)
	return id, err
}

func (r *RolesRepo) FindAll(ctx context.Context) ([]users.Role, error) {
	rows, err := r.db.Query(ctx, `SELECT id, name FROM roles ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []users.Role
	for rows.Next() {
		var role users.Role
		if err := rows.Scan(&role.ID, &role.Name); err != nil {
			return nil, err
		}
		// Load permissions for this role
		permRows, err := r.db.Query(ctx, `
			SELECT p.id, p.name, p.module
			FROM permissions p
			JOIN role_permissions rp ON rp.permission_id = p.id
			WHERE rp.role_id = $1
			ORDER BY p.module, p.name
		`, role.ID)
		if err == nil {
			for permRows.Next() {
				var perm users.Permission
				if err := permRows.Scan(&perm.ID, &perm.Name, &perm.Module); err == nil {
					role.Permissions = append(role.Permissions, perm)
				}
			}
			permRows.Close()
		}
		roles = append(roles, role)
	}
	return roles, nil
}

func (r *RolesRepo) FindAllPermissions(ctx context.Context) ([]users.Permission, error) {
	rows, err := r.db.Query(ctx, `SELECT id, name, module FROM permissions ORDER BY module, name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var perms []users.Permission
	for rows.Next() {
		var p users.Permission
		if err := rows.Scan(&p.ID, &p.Name, &p.Module); err != nil {
			return nil, err
		}
		perms = append(perms, p)
	}
	return perms, nil
}

func (r *RolesRepo) SetRolePermissions(ctx context.Context, roleID string, permissionIDs []string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Clear existing permissions
	_, err = tx.Exec(ctx, `DELETE FROM role_permissions WHERE role_id = $1`, roleID)
	if err != nil {
		return err
	}

	// Insert new permissions
	for _, permID := range permissionIDs {
		_, err = tx.Exec(ctx, `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`, roleID, permID)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *RolesRepo) HasPermission(ctx context.Context, userID, permission string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM permissions p
			JOIN role_permissions rp ON rp.permission_id = p.id
			JOIN user_roles ur ON ur.role_id = rp.role_id
			WHERE ur.user_id = $1 AND p.name = $2
		)
	`, userID, permission).Scan(&exists)
	return exists, err
}

// ── Audit ───────────────────────────────────────────

type AuditRepo struct {
	db *pgxpool.Pool
}

func NewAuditRepo(db *pgxpool.Pool) *AuditRepo {
	return &AuditRepo{db: db}
}

func (r *AuditRepo) Log(ctx context.Context, userID, action, entity, entityID, details, ip string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
	`, userID, action, entity, entityID, details, ip)
	return err
}

type AuditFilter struct {
	UserID string
	Action string
	Entity string
	Search string
	Page   int
	Limit  int
}

type AuditLogEntry struct {
	ID        int64  `json:"id"`
	UserID    string `json:"user_id"`
	UserName  string `json:"user_name"`
	Action    string `json:"action"`
	Entity    string `json:"entity"`
	EntityID  string `json:"entity_id"`
	Details   string `json:"details"`
	IPAddress string `json:"ip_address"`
	CreatedAt string `json:"created_at"`
}

type AuditListResult struct {
	Items      []AuditLogEntry `json:"items"`
	Total      int             `json:"total"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalPages int             `json:"total_pages"`
}

func (r *AuditRepo) FindAll(ctx context.Context, f AuditFilter) (*AuditListResult, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if f.UserID != "" {
		where = append(where, fmt.Sprintf("a.user_id = $%d", argIdx))
		args = append(args, f.UserID)
		argIdx++
	}
	if f.Action != "" {
		where = append(where, fmt.Sprintf("a.action = $%d", argIdx))
		args = append(args, f.Action)
		argIdx++
	}
	if f.Entity != "" {
		where = append(where, fmt.Sprintf("a.entity = $%d", argIdx))
		args = append(args, f.Entity)
		argIdx++
	}
	if f.Search != "" {
		where = append(where, fmt.Sprintf("(a.details ILIKE $%d OR a.action ILIKE $%d)", argIdx, argIdx))
		args = append(args, "%"+f.Search+"%")
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	r.db.QueryRow(ctx, fmt.Sprintf("SELECT COUNT(*) FROM audit_logs a WHERE %s", whereClause), args...).Scan(&total)

	offset := (f.Page - 1) * f.Limit
	args = append(args, f.Limit, offset)

	rows, err := r.db.Query(ctx, fmt.Sprintf(`
		SELECT a.id, a.user_id, COALESCE(u.name, 'System') AS user_name,
		       a.action, a.entity, COALESCE(a.entity_id,''), COALESCE(a.details,''),
		       COALESCE(a.ip_address,''), a.created_at
		FROM audit_logs a
		LEFT JOIN users u ON a.user_id = u.id
		WHERE %s
		ORDER BY a.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []AuditLogEntry
	for rows.Next() {
		var e AuditLogEntry
		var createdAt interface{}
		if err := rows.Scan(&e.ID, &e.UserID, &e.UserName, &e.Action, &e.Entity,
			&e.EntityID, &e.Details, &e.IPAddress, &createdAt); err != nil {
			return nil, err
		}
		if t, ok := createdAt.(interface{ Format(string) string }); ok {
			e.CreatedAt = t.Format("2006-01-02T15:04:05Z")
		}
		items = append(items, e)
	}

	return &AuditListResult{
		Items:      items,
		Total:      total,
		Page:       f.Page,
		Limit:      f.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(f.Limit))),
	}, nil
}

// ── Settings ────────────────────────────────────────

type SettingsRepo struct {
	db *pgxpool.Pool
}

func NewSettingsRepo(db *pgxpool.Pool) *SettingsRepo {
	return &SettingsRepo{db: db}
}

func (r *SettingsRepo) GetAll(ctx context.Context) (map[string]string, error) {
	rows, err := r.db.Query(ctx, `SELECT key, value FROM site_settings`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	settings := make(map[string]string)
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			return nil, err
		}
		settings[k] = v
	}
	return settings, nil
}

func (r *SettingsRepo) Set(ctx context.Context, key, value string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW())
		ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
	`, key, value)
	return err
}

// ── Media ────────────────────────────────────────────

type MediaItem struct {
	ID         string `json:"id"`
	Filename   string `json:"filename"`
	URL        string `json:"url"`
	MimeType   string `json:"mime_type"`
	SizeBytes  int64  `json:"size_bytes"`
	UploadedBy string `json:"uploaded_by"`
	CreatedAt  string `json:"created_at"`
}

type MediaRepo struct {
	db *pgxpool.Pool
}

func NewMediaRepo(db *pgxpool.Pool) *MediaRepo {
	return &MediaRepo{db: db}
}

func (r *MediaRepo) FindAll(ctx context.Context, search, mimeFilter string, page, limit int) ([]MediaItem, int, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	idx := 1
	if search != "" {
		where += fmt.Sprintf(" AND filename ILIKE $%d", idx)
		args = append(args, "%"+search+"%")
		idx++
	}
	if mimeFilter != "" {
		where += fmt.Sprintf(" AND mime_type LIKE $%d", idx)
		args = append(args, mimeFilter+"%")
		idx++
	}

	var total int
	countQ := "SELECT COUNT(*) FROM media " + where
	if err := r.db.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	q := fmt.Sprintf("SELECT id, filename, url, mime_type, size_bytes, uploaded_by, created_at FROM media %s ORDER BY created_at DESC LIMIT %d OFFSET %d", where, limit, offset)
	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []MediaItem
	for rows.Next() {
		var m MediaItem
		if err := rows.Scan(&m.ID, &m.Filename, &m.URL, &m.MimeType, &m.SizeBytes, &m.UploadedBy, &m.CreatedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, m)
	}
	return items, total, nil
}

func (r *MediaRepo) Create(ctx context.Context, filename, url, mimeType string, sizeBytes int64, uploadedBy string) (*MediaItem, error) {
	var m MediaItem
	err := r.db.QueryRow(ctx,
		`INSERT INTO media (filename, url, mime_type, size_bytes, uploaded_by) VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, filename, url, mime_type, size_bytes, uploaded_by, created_at`,
		filename, url, mimeType, sizeBytes, uploadedBy,
	).Scan(&m.ID, &m.Filename, &m.URL, &m.MimeType, &m.SizeBytes, &m.UploadedBy, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MediaRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM media WHERE id=$1", id)
	return err
}

func (r *MediaRepo) FindByID(ctx context.Context, id string) (*MediaItem, error) {
	var m MediaItem
	err := r.db.QueryRow(ctx,
		"SELECT id, filename, url, mime_type, size_bytes, uploaded_by, created_at FROM media WHERE id=$1", id,
	).Scan(&m.ID, &m.Filename, &m.URL, &m.MimeType, &m.SizeBytes, &m.UploadedBy, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

// ── Ad Slots ────────────────────────────────────────────

type AdSlot struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Code     string `json:"code"`
	IsActive bool   `json:"is_active"`
	Position string `json:"position"`
}

type AdsRepo struct {
	db *pgxpool.Pool
}

func NewAdsRepo(db *pgxpool.Pool) *AdsRepo {
	return &AdsRepo{db: db}
}

func (r *AdsRepo) FindAll(ctx context.Context) ([]AdSlot, error) {
	rows, err := r.db.Query(ctx, "SELECT id, name, code, is_active, position FROM ad_slots ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []AdSlot
	for rows.Next() {
		var a AdSlot
		if err := rows.Scan(&a.ID, &a.Name, &a.Code, &a.IsActive, &a.Position); err != nil {
			return nil, err
		}
		items = append(items, a)
	}
	return items, nil
}

func (r *AdsRepo) FindActive(ctx context.Context) ([]AdSlot, error) {
	rows, err := r.db.Query(ctx, "SELECT id, name, code, is_active, position FROM ad_slots WHERE is_active = true ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []AdSlot
	for rows.Next() {
		var a AdSlot
		if err := rows.Scan(&a.ID, &a.Name, &a.Code, &a.IsActive, &a.Position); err != nil {
			return nil, err
		}
		items = append(items, a)
	}
	return items, nil
}

func (r *AdsRepo) Create(ctx context.Context, name, code, position string, isActive bool) (*AdSlot, error) {
	var a AdSlot
	err := r.db.QueryRow(ctx,
		`INSERT INTO ad_slots (name, code, is_active, position) VALUES ($1, $2, $3, $4)
		 RETURNING id, name, code, is_active, position`,
		name, code, isActive, position,
	).Scan(&a.ID, &a.Name, &a.Code, &a.IsActive, &a.Position)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *AdsRepo) Update(ctx context.Context, id, name, code, position string, isActive bool) error {
	_, err := r.db.Exec(ctx,
		"UPDATE ad_slots SET name=$2, code=$3, is_active=$4, position=$5 WHERE id=$1",
		id, name, code, isActive, position,
	)
	return err
}

func (r *AdsRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM ad_slots WHERE id=$1", id)
	return err
}

func (r *AdsRepo) ToggleActive(ctx context.Context, id string) (*AdSlot, error) {
	var a AdSlot
	err := r.db.QueryRow(ctx,
		`UPDATE ad_slots SET is_active = NOT is_active WHERE id=$1
		 RETURNING id, name, code, is_active, position`, id,
	).Scan(&a.ID, &a.Name, &a.Code, &a.IsActive, &a.Position)
	if err != nil {
		return nil, err
	}
	return &a, nil
}
