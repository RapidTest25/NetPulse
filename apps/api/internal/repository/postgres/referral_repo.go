package postgres

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/domain/referral"
)

type ReferralRepo struct {
	db *pgxpool.Pool
}

func NewReferralRepo(db *pgxpool.Pool) *ReferralRepo {
	return &ReferralRepo{db: db}
}

// RecordReferral stores a referral event.
func (r *ReferralRepo) RecordReferral(ctx context.Context, referrerID, referredID, ip string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO referral_events (referrer_id, referred_id, ip_address)
		VALUES ($1, $2, $3)
	`, referrerID, referredID, ip)
	return err
}

// MarkVerified marks a referral as verified (when referred user verifies email).
func (r *ReferralRepo) MarkVerified(ctx context.Context, referredID string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE referral_events SET verified = true WHERE referred_id = $1
	`, referredID)
	return err
}

// GetStats returns overall referral statistics.
func (r *ReferralRepo) GetStats(ctx context.Context) (*referral.ReferralStats, error) {
	s := &referral.ReferralStats{}

	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM referral_events`).Scan(&s.TotalInvites)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM referral_events WHERE verified = true`).Scan(&s.VerifiedReferrals)

	rows, err := r.db.Query(ctx, `
		SELECT u.id, u.name, u.email,
		       COUNT(*) AS total_referred,
		       COUNT(*) FILTER (WHERE re.verified = true) AS verified
		FROM referral_events re
		JOIN users u ON re.referrer_id = u.id
		GROUP BY u.id, u.name, u.email
		ORDER BY total_referred DESC
		LIMIT 20
	`)
	if err != nil {
		return s, nil
	}
	defer rows.Close()

	for rows.Next() {
		var t referral.TopReferrer
		if err := rows.Scan(&t.UserID, &t.UserName, &t.UserEmail, &t.TotalReferred, &t.Verified); err == nil {
			s.TopReferrers = append(s.TopReferrers, t)
		}
	}

	return s, nil
}

// GetUserReferralStats returns referral stats for a specific user.
func (r *ReferralRepo) GetUserReferralStats(ctx context.Context, userID string) (int, int, error) {
	var total, verified int
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM referral_events WHERE referrer_id = $1`, userID).Scan(&total)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM referral_events WHERE referrer_id = $1 AND verified = true`, userID).Scan(&verified)
	return total, verified, nil
}

// CheckIPReferralLimit checks if an IP has too many referrals.
func (r *ReferralRepo) CheckIPReferralLimit(ctx context.Context, ip string, limit int) (bool, error) {
	var count int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM referral_events
		WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '24 hours'
	`, ip).Scan(&count)
	if err != nil {
		return false, err
	}
	return count >= limit, nil
}

// FindReferrerByCode finds the user who owns a referral code.
func (r *ReferralRepo) FindReferrerByCode(ctx context.Context, code string) (string, error) {
	var userID string
	err := r.db.QueryRow(ctx, `
		SELECT id FROM users WHERE referral_code = $1 AND disabled_at IS NULL
	`, code).Scan(&userID)
	return userID, err
}
