package postgres

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/domain/affiliate"
)

type AffiliateRepo struct {
	db *pgxpool.Pool
}

func NewAffiliateRepo(db *pgxpool.Pool) *AffiliateRepo {
	return &AffiliateRepo{db: db}
}

// ══════════════════════════════════════════════════════════
// Settings
// ══════════════════════════════════════════════════════════

func (r *AffiliateRepo) GetSettings(ctx context.Context) (*affiliate.AffiliateSettings, error) {
	var s affiliate.AffiliateSettings
	err := r.db.QueryRow(ctx, `
		SELECT id, enabled, commission_type, commission_value, cookie_days,
		       referral_hold_days, payout_minimum, payout_schedule,
		       COALESCE(how_it_works_md,''), COALESCE(terms_md,''), COALESCE(payout_rules_md,''),
		       COALESCE(terms_text,''), updated_at
		FROM affiliate_settings WHERE id = 1
	`).Scan(&s.ID, &s.Enabled, &s.CommissionType, &s.CommissionValue,
		&s.CookieDays, &s.ReferralHoldDays, &s.PayoutMinimum, &s.PayoutSchedule,
		&s.HowItWorksMD, &s.TermsMD, &s.PayoutRulesMD, &s.TermsText, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *AffiliateRepo) UpdateSettings(ctx context.Context, input affiliate.UpdateSettingsInput) error {
	sets := []string{}
	args := []interface{}{}
	idx := 1

	addSet := func(col string, val interface{}) {
		sets = append(sets, fmt.Sprintf("%s = $%d", col, idx))
		args = append(args, val)
		idx++
	}

	if input.Enabled != nil {
		addSet("enabled", *input.Enabled)
	}
	if input.CommissionType != nil {
		addSet("commission_type", *input.CommissionType)
	}
	if input.CommissionValue != nil {
		addSet("commission_value", *input.CommissionValue)
	}
	if input.CookieDays != nil {
		addSet("cookie_days", *input.CookieDays)
	}
	if input.ReferralHoldDays != nil {
		addSet("referral_hold_days", *input.ReferralHoldDays)
	}
	if input.PayoutMinimum != nil {
		addSet("payout_minimum", *input.PayoutMinimum)
	}
	if input.PayoutSchedule != nil {
		addSet("payout_schedule", *input.PayoutSchedule)
	}
	if input.HowItWorksMD != nil {
		addSet("how_it_works_md", *input.HowItWorksMD)
	}
	if input.TermsMD != nil {
		addSet("terms_md", *input.TermsMD)
	}
	if input.PayoutRulesMD != nil {
		addSet("payout_rules_md", *input.PayoutRulesMD)
	}
	if input.TermsText != nil {
		addSet("terms_text", *input.TermsText)
	}

	if len(sets) == 0 {
		return nil
	}

	sets = append(sets, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE affiliate_settings SET %s WHERE id = 1", strings.Join(sets, ", "))
	_, err := r.db.Exec(ctx, query, args...)
	return err
}

// ══════════════════════════════════════════════════════════
// Profiles
// ══════════════════════════════════════════════════════════

func (r *AffiliateRepo) GetProfileByUserID(ctx context.Context, userID string) (*affiliate.AffiliateProfile, error) {
	var p affiliate.AffiliateProfile
	err := r.db.QueryRow(ctx, `
		SELECT ap.id, ap.user_id, ap.status, ap.payout_method, COALESCE(ap.provider_name,''),
		       ap.payout_name_encrypted, ap.payout_number_encrypted,
		       ap.total_earnings, ap.total_paid, ap.pending_balance,
		       ap.available_balance, ap.locked_balance,
		       ap.is_blocked, ap.is_suspicious, COALESCE(ap.blocked_reason,''), ap.blocked_at,
		       ap.approved_at, ap.created_at, ap.updated_at,
		       u.name, u.email, COALESCE(u.referral_code,'')
		FROM affiliate_profiles ap
		JOIN users u ON u.id = ap.user_id
		WHERE ap.user_id = $1
	`, userID).Scan(&p.ID, &p.UserID, &p.Status, &p.PayoutMethod, &p.ProviderName,
		&p.PayoutNameEncrypted, &p.PayoutNumberEncrypted,
		&p.TotalEarnings, &p.TotalPaid, &p.PendingBalance,
		&p.AvailableBalance, &p.LockedBalance,
		&p.IsBlocked, &p.IsSuspicious, &p.BlockedReason, &p.BlockedAt,
		&p.ApprovedAt, &p.CreatedAt, &p.UpdatedAt,
		&p.UserName, &p.UserEmail, &p.ReferralCode)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *AffiliateRepo) CreateProfile(ctx context.Context, p *affiliate.AffiliateProfile) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO affiliate_profiles (user_id, status, payout_method, provider_name,
		       payout_name_encrypted, payout_number_encrypted)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, p.UserID, p.Status, p.PayoutMethod, p.ProviderName,
		p.PayoutNameEncrypted, p.PayoutNumberEncrypted)
	return err
}

func (r *AffiliateRepo) UpdateProfileStatus(ctx context.Context, profileID, status string) error {
	var extra string
	if status == "APPROVED" {
		extra = ", approved_at = NOW()"
	}
	_, err := r.db.Exec(ctx, fmt.Sprintf(`
		UPDATE affiliate_profiles SET status = $1, updated_at = NOW()%s WHERE id = $2
	`, extra), status, profileID)
	return err
}

func (r *AffiliateRepo) UpdateProfilePayout(ctx context.Context, userID, method, providerName, nameEnc, numEnc string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE affiliate_profiles
		SET payout_method = $1, provider_name = $2,
		    payout_name_encrypted = $3, payout_number_encrypted = $4, updated_at = NOW()
		WHERE user_id = $5
	`, method, providerName, nameEnc, numEnc, userID)
	return err
}

func (r *AffiliateRepo) BlockAffiliate(ctx context.Context, userID string, blocked bool, reason string) error {
	if blocked {
		_, err := r.db.Exec(ctx, `
			UPDATE affiliate_profiles
			SET is_blocked = true, blocked_reason = $1, blocked_at = NOW(), updated_at = NOW()
			WHERE user_id = $2
		`, reason, userID)
		return err
	}
	_, err := r.db.Exec(ctx, `
		UPDATE affiliate_profiles
		SET is_blocked = false, blocked_reason = '', blocked_at = NULL, updated_at = NOW()
		WHERE user_id = $1
	`, userID)
	return err
}

func (r *AffiliateRepo) FlagSuspicious(ctx context.Context, userID string, suspicious bool) error {
	_, err := r.db.Exec(ctx, `
		UPDATE affiliate_profiles SET is_suspicious = $1, updated_at = NOW() WHERE user_id = $2
	`, suspicious, userID)
	return err
}

func (r *AffiliateRepo) ListProfiles(ctx context.Context, filter affiliate.AffiliateListFilter) ([]affiliate.AffiliateProfile, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	idx := 1

	if filter.Status != "" {
		where = append(where, fmt.Sprintf("ap.status = $%d", idx))
		args = append(args, filter.Status)
		idx++
	}
	if filter.Search != "" {
		where = append(where, fmt.Sprintf("(u.name ILIKE $%d OR u.email ILIKE $%d)", idx, idx))
		args = append(args, "%"+filter.Search+"%")
		idx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	countQ := fmt.Sprintf("SELECT COUNT(*) FROM affiliate_profiles ap JOIN users u ON u.id = ap.user_id WHERE %s", whereClause)
	r.db.QueryRow(ctx, countQ, args...).Scan(&total)

	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 20
	}
	offset := (filter.Page - 1) * filter.Limit

	query := fmt.Sprintf(`
		SELECT ap.id, ap.user_id, ap.status, ap.payout_method, COALESCE(ap.provider_name,''),
		       ap.payout_name_encrypted, ap.payout_number_encrypted,
		       ap.total_earnings, ap.total_paid, ap.pending_balance,
		       ap.available_balance, ap.locked_balance,
		       ap.is_blocked, ap.is_suspicious, COALESCE(ap.blocked_reason,''), ap.blocked_at,
		       ap.approved_at, ap.created_at, ap.updated_at,
		       u.name, u.email, COALESCE(u.referral_code,'')
		FROM affiliate_profiles ap
		JOIN users u ON u.id = ap.user_id
		WHERE %s
		ORDER BY ap.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, idx, idx+1)
	args = append(args, filter.Limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var profiles []affiliate.AffiliateProfile
	for rows.Next() {
		var p affiliate.AffiliateProfile
		if err := rows.Scan(&p.ID, &p.UserID, &p.Status, &p.PayoutMethod, &p.ProviderName,
			&p.PayoutNameEncrypted, &p.PayoutNumberEncrypted,
			&p.TotalEarnings, &p.TotalPaid, &p.PendingBalance,
			&p.AvailableBalance, &p.LockedBalance,
			&p.IsBlocked, &p.IsSuspicious, &p.BlockedReason, &p.BlockedAt,
			&p.ApprovedAt, &p.CreatedAt, &p.UpdatedAt,
			&p.UserName, &p.UserEmail, &p.ReferralCode); err != nil {
			return nil, 0, err
		}
		profiles = append(profiles, p)
	}
	return profiles, total, nil
}

// ══════════════════════════════════════════════════════════
// Commissions (Affiliate Events)
// ══════════════════════════════════════════════════════════

// GrantCommission creates a commission with hold period and adds to pending balance atomically.
func (r *AffiliateRepo) GrantCommission(ctx context.Context, affiliateID string, referralEventID int64,
	amount float64, desc string, holdDays int) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	holdUntil := time.Now().Add(time.Duration(holdDays) * 24 * time.Hour)

	_, err = tx.Exec(ctx, `
		INSERT INTO affiliate_commissions (affiliate_id, referral_event_id, amount, description, status, hold_until)
		VALUES ($1, $2, $3, $4, 'PENDING', $5)
	`, affiliateID, referralEventID, amount, desc, holdUntil)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		UPDATE affiliate_profiles
		SET pending_balance = pending_balance + $1,
		    total_earnings = total_earnings + $1,
		    updated_at = NOW()
		WHERE id = $2
	`, amount, affiliateID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *AffiliateRepo) ListCommissions(ctx context.Context, affiliateID string, page, limit int) ([]affiliate.Commission, int, error) {
	var total int
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM affiliate_commissions WHERE affiliate_id = $1`, affiliateID).Scan(&total)

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	rows, err := r.db.Query(ctx, `
		SELECT id, affiliate_id, referral_event_id, amount, description, status,
		       hold_until, released_at, created_at
		FROM affiliate_commissions
		WHERE affiliate_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, affiliateID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var comms []affiliate.Commission
	for rows.Next() {
		var c affiliate.Commission
		if err := rows.Scan(&c.ID, &c.AffiliateID, &c.ReferralEventID,
			&c.Amount, &c.Description, &c.Status,
			&c.HoldUntil, &c.ReleasedAt, &c.CreatedAt); err != nil {
			return nil, 0, err
		}
		comms = append(comms, c)
	}
	return comms, total, nil
}

// ReleaseHeldCommissions moves matured commissions from pending → available.
func (r *AffiliateRepo) ReleaseHeldCommissions(ctx context.Context) (int, error) {
	var released int
	err := r.db.QueryRow(ctx, `SELECT release_held_commissions()`).Scan(&released)
	return released, err
}

// ══════════════════════════════════════════════════════════
// Payout Requests
// ══════════════════════════════════════════════════════════

func (r *AffiliateRepo) HasActivePayout(ctx context.Context, userID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM payout_requests
			WHERE user_id = $1 AND status IN ('PENDING', 'APPROVED')
		)
	`, userID).Scan(&exists)
	return exists, err
}

func (r *AffiliateRepo) CreatePayoutRequest(ctx context.Context, pr *affiliate.PayoutRequest) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO payout_requests (user_id, affiliate_id, amount, status, note)
		VALUES ($1, $2, $3, 'PENDING', $4)
	`, pr.UserID, pr.AffiliateID, pr.Amount, pr.Note)
	return err
}

func (r *AffiliateRepo) GetPayoutByID(ctx context.Context, payoutID string) (*affiliate.PayoutRequest, error) {
	var p affiliate.PayoutRequest
	err := r.db.QueryRow(ctx, `
		SELECT pr.id, pr.user_id, pr.affiliate_id, pr.amount, pr.status,
		       COALESCE(pr.admin_note,''), COALESCE(pr.note,''),
		       COALESCE(pr.payment_reference,''), COALESCE(pr.proof_url,''),
		       pr.requested_at, pr.processed_at, pr.processed_by, pr.created_at,
		       u.name, u.email
		FROM payout_requests pr
		JOIN users u ON u.id = pr.user_id
		WHERE pr.id = $1
	`, payoutID).Scan(&p.ID, &p.UserID, &p.AffiliateID, &p.Amount, &p.Status,
		&p.AdminNote, &p.Note, &p.PaymentReference, &p.ProofURL,
		&p.RequestedAt, &p.ProcessedAt, &p.ProcessedBy, &p.CreatedAt,
		&p.UserName, &p.UserEmail)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *AffiliateRepo) ListPayoutsByUser(ctx context.Context, userID string, page, limit int) ([]affiliate.PayoutRequest, int, error) {
	var total int
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM payout_requests WHERE user_id = $1`, userID).Scan(&total)

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	rows, err := r.db.Query(ctx, `
		SELECT id, user_id, affiliate_id, amount, status,
		       COALESCE(admin_note,''), COALESCE(note,''),
		       COALESCE(payment_reference,''), COALESCE(proof_url,''),
		       requested_at, processed_at, processed_by, created_at
		FROM payout_requests
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var payouts []affiliate.PayoutRequest
	for rows.Next() {
		var p affiliate.PayoutRequest
		if err := rows.Scan(&p.ID, &p.UserID, &p.AffiliateID, &p.Amount, &p.Status,
			&p.AdminNote, &p.Note, &p.PaymentReference, &p.ProofURL,
			&p.RequestedAt, &p.ProcessedAt, &p.ProcessedBy, &p.CreatedAt); err != nil {
			return nil, 0, err
		}
		payouts = append(payouts, p)
	}
	return payouts, total, nil
}

func (r *AffiliateRepo) ListAllPayouts(ctx context.Context, filter affiliate.PayoutListFilter) ([]affiliate.PayoutRequest, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	idx := 1

	if filter.Status != "" {
		where = append(where, fmt.Sprintf("pr.status = $%d", idx))
		args = append(args, filter.Status)
		idx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	r.db.QueryRow(ctx, fmt.Sprintf("SELECT COUNT(*) FROM payout_requests pr WHERE %s", whereClause), args...).Scan(&total)

	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 20
	}
	offset := (filter.Page - 1) * filter.Limit

	query := fmt.Sprintf(`
		SELECT pr.id, pr.user_id, pr.affiliate_id, pr.amount, pr.status,
		       COALESCE(pr.admin_note,''), COALESCE(pr.note,''),
		       COALESCE(pr.payment_reference,''), COALESCE(pr.proof_url,''),
		       pr.requested_at, pr.processed_at, pr.processed_by, pr.created_at,
		       u.name, u.email
		FROM payout_requests pr
		JOIN users u ON u.id = pr.user_id
		WHERE %s
		ORDER BY pr.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, idx, idx+1)
	args = append(args, filter.Limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var payouts []affiliate.PayoutRequest
	for rows.Next() {
		var p affiliate.PayoutRequest
		if err := rows.Scan(&p.ID, &p.UserID, &p.AffiliateID, &p.Amount, &p.Status,
			&p.AdminNote, &p.Note, &p.PaymentReference, &p.ProofURL,
			&p.RequestedAt, &p.ProcessedAt, &p.ProcessedBy, &p.CreatedAt,
			&p.UserName, &p.UserEmail); err != nil {
			return nil, 0, err
		}
		payouts = append(payouts, p)
	}
	return payouts, total, nil
}

// ── Payout State Machine (Transactional) ─────────────

// ApprovePayout: available_balance → locked_balance
func (r *AffiliateRepo) ApprovePayout(ctx context.Context, payoutID, adminNote, processedBy string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var amount float64
	var affiliateID string
	err = tx.QueryRow(ctx, `
		SELECT amount, affiliate_id FROM payout_requests WHERE id = $1 AND status = 'PENDING'
	`, payoutID).Scan(&amount, &affiliateID)
	if err != nil {
		return fmt.Errorf("payout not found or not pending")
	}

	// Check available balance
	var available float64
	tx.QueryRow(ctx, `SELECT available_balance FROM affiliate_profiles WHERE id = $1`, affiliateID).Scan(&available)
	if available < amount {
		return fmt.Errorf("insufficient available balance")
	}

	// Move available → locked
	_, err = tx.Exec(ctx, `
		UPDATE affiliate_profiles
		SET available_balance = available_balance - $1,
		    locked_balance = locked_balance + $1,
		    updated_at = NOW()
		WHERE id = $2
	`, amount, affiliateID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		UPDATE payout_requests
		SET status = 'APPROVED', admin_note = $1, processed_at = NOW(), processed_by = $2
		WHERE id = $3
	`, adminNote, processedBy, payoutID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// RejectPayout: if previously locked, release locked → available
func (r *AffiliateRepo) RejectPayout(ctx context.Context, payoutID, adminNote, processedBy string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var amount float64
	var affiliateID, currentStatus string
	err = tx.QueryRow(ctx, `
		SELECT amount, affiliate_id, status FROM payout_requests WHERE id = $1
	`, payoutID).Scan(&amount, &affiliateID, &currentStatus)
	if err != nil {
		return fmt.Errorf("payout not found")
	}

	// If was APPROVED (locked), release back to available
	if currentStatus == "APPROVED" {
		_, err = tx.Exec(ctx, `
			UPDATE affiliate_profiles
			SET locked_balance = locked_balance - $1,
			    available_balance = available_balance + $1,
			    updated_at = NOW()
			WHERE id = $2
		`, amount, affiliateID)
		if err != nil {
			return err
		}
	}

	_, err = tx.Exec(ctx, `
		UPDATE payout_requests
		SET status = 'REJECTED', admin_note = $1, processed_at = NOW(), processed_by = $2
		WHERE id = $3
	`, adminNote, processedBy, payoutID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// MarkPaid: locked → paid
func (r *AffiliateRepo) MarkPaid(ctx context.Context, payoutID, adminNote, processedBy, paymentRef, proofURL string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var amount float64
	var affiliateID string
	err = tx.QueryRow(ctx, `
		SELECT amount, affiliate_id FROM payout_requests WHERE id = $1 AND status = 'APPROVED'
	`, payoutID).Scan(&amount, &affiliateID)
	if err != nil {
		return fmt.Errorf("payout not found or not approved")
	}

	// Move locked → paid
	_, err = tx.Exec(ctx, `
		UPDATE affiliate_profiles
		SET locked_balance = locked_balance - $1,
		    total_paid = total_paid + $1,
		    updated_at = NOW()
		WHERE id = $2
	`, amount, affiliateID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		UPDATE payout_requests
		SET status = 'PAID', admin_note = $1, processed_at = NOW(), processed_by = $2,
		    payment_reference = $3, proof_url = $4
		WHERE id = $5
	`, adminNote, processedBy, paymentRef, proofURL, payoutID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ══════════════════════════════════════════════════════════
// Balance Adjustments
// ══════════════════════════════════════════════════════════

func (r *AffiliateRepo) AdjustBalance(ctx context.Context, userID, adminID string, input affiliate.AdjustBalanceInput) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Record adjustment
	_, err = tx.Exec(ctx, `
		INSERT INTO affiliate_balance_adjustments (user_id, admin_id, amount, balance_type, reason)
		VALUES ($1, $2, $3, $4, $5)
	`, userID, adminID, input.Amount, input.BalanceType, input.Reason)
	if err != nil {
		return err
	}

	// Apply to balance
	var col string
	switch input.BalanceType {
	case "pending":
		col = "pending_balance"
	case "available":
		col = "available_balance"
	case "paid":
		col = "total_paid"
	default:
		return fmt.Errorf("invalid balance type")
	}

	_, err = tx.Exec(ctx, fmt.Sprintf(`
		UPDATE affiliate_profiles
		SET %s = %s + $1, total_earnings = total_earnings + $1, updated_at = NOW()
		WHERE user_id = $2
	`, col, col), input.Amount, userID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ══════════════════════════════════════════════════════════
// Stats
// ══════════════════════════════════════════════════════════

func (r *AffiliateRepo) GetUserStats(ctx context.Context, userID string) (*affiliate.AffiliateStats, error) {
	s := &affiliate.AffiliateStats{}

	r.db.QueryRow(ctx, `
		SELECT COALESCE(total_earnings, 0), COALESCE(total_paid, 0),
		       COALESCE(pending_balance, 0), COALESCE(available_balance, 0)
		FROM affiliate_profiles WHERE user_id = $1
	`, userID).Scan(&s.TotalEarnings, &s.TotalPaid, &s.PendingBalance, &s.AvailableBalance)

	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM referral_events WHERE referrer_id = $1`, userID).Scan(&s.TotalReferrals)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM referral_events WHERE referrer_id = $1 AND verified = true`, userID).Scan(&s.VerifiedReferrals)

	r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(ac.amount), 0)
		FROM affiliate_commissions ac
		JOIN affiliate_profiles ap ON ap.id = ac.affiliate_id
		WHERE ap.user_id = $1 AND ac.created_at >= date_trunc('month', NOW())
	`, userID).Scan(&s.ThisMonth)

	return s, nil
}

func (r *AffiliateRepo) GetAdminStats(ctx context.Context) (*affiliate.AdminAffiliateStats, error) {
	s := &affiliate.AdminAffiliateStats{}
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM affiliate_profiles`).Scan(&s.TotalAffiliates)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM affiliate_profiles WHERE status = 'APPROVED'`).Scan(&s.ActiveAffiliates)
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM payout_requests WHERE status = 'PENDING'`).Scan(&s.PendingPayouts)
	r.db.QueryRow(ctx, `SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE status = 'PENDING'`).Scan(&s.PendingPayoutsAmount)
	r.db.QueryRow(ctx, `SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE status = 'PAID'`).Scan(&s.TotalPaidOut)
	r.db.QueryRow(ctx, `SELECT COALESCE(SUM(amount), 0) FROM affiliate_commissions`).Scan(&s.TotalCommissions)
	r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM referral_events
		WHERE verified = true AND created_at >= NOW() - INTERVAL '30 days'
	`).Scan(&s.VerifiedLast30Days)

	// Top affiliates
	rows, err := r.db.Query(ctx, `
		SELECT u.id, u.name, u.email, COALESCE(u.referral_code,''),
		       COUNT(*) FILTER (WHERE re.verified = true) AS verified,
		       COALESCE(ap.total_earnings, 0)
		FROM affiliate_profiles ap
		JOIN users u ON u.id = ap.user_id
		LEFT JOIN referral_events re ON re.referrer_id = u.id
		WHERE ap.status = 'APPROVED'
		GROUP BY u.id, u.name, u.email, u.referral_code, ap.total_earnings
		ORDER BY verified DESC
		LIMIT 10
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var t affiliate.TopAffiliate
			if err := rows.Scan(&t.UserID, &t.UserName, &t.UserEmail, &t.ReferralCode,
				&t.VerifiedReferrals, &t.TotalEarnings); err == nil {
				s.TopAffiliates = append(s.TopAffiliates, t)
			}
		}
	}

	return s, nil
}

// TotalPages helper
func totalPages(total, limit int) int {
	return int(math.Ceil(float64(total) / float64(limit)))
}

// ── Invites ─────────────────────────────────────────

type InviteRepo struct {
	db *pgxpool.Pool
}

func NewInviteRepo(db *pgxpool.Pool) *InviteRepo {
	return &InviteRepo{db: db}
}

type Invite struct {
	ID        string     `json:"id"`
	Email     string     `json:"email"`
	TokenHash string     `json:"-"`
	RoleID    string     `json:"role_id"`
	RoleName  string     `json:"role_name,omitempty"`
	InvitedBy string     `json:"invited_by"`
	InviterName string   `json:"inviter_name,omitempty"`
	Message   string     `json:"message"`
	ExpiresAt time.Time  `json:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

func (r *InviteRepo) Create(ctx context.Context, inv *Invite) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO invites (email, token_hash, role_id, invited_by, message, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, inv.Email, inv.TokenHash, inv.RoleID, inv.InvitedBy, inv.Message, inv.ExpiresAt)
	return err
}

func (r *InviteRepo) FindByTokenHash(ctx context.Context, tokenHash string) (*Invite, error) {
	var inv Invite
	err := r.db.QueryRow(ctx, `
		SELECT i.id, i.email, i.token_hash, i.role_id, r.name, i.invited_by, i.message, i.expires_at, i.used_at, i.created_at
		FROM invites i
		JOIN roles r ON r.id = i.role_id
		WHERE i.token_hash = $1
	`, tokenHash).Scan(&inv.ID, &inv.Email, &inv.TokenHash, &inv.RoleID, &inv.RoleName,
		&inv.InvitedBy, &inv.Message, &inv.ExpiresAt, &inv.UsedAt, &inv.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *InviteRepo) MarkUsed(ctx context.Context, inviteID string) error {
	_, err := r.db.Exec(ctx, `UPDATE invites SET used_at = NOW() WHERE id = $1`, inviteID)
	return err
}

func (r *InviteRepo) ListAll(ctx context.Context, page, limit int) ([]Invite, int, error) {
	var total int
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM invites`).Scan(&total)

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	rows, err := r.db.Query(ctx, `
		SELECT i.id, i.email, i.role_id, r.name, i.invited_by, iu.name, i.message, i.expires_at, i.used_at, i.created_at
		FROM invites i
		JOIN roles r ON r.id = i.role_id
		LEFT JOIN users iu ON iu.id = i.invited_by
		ORDER BY i.created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var invites []Invite
	for rows.Next() {
		var inv Invite
		if err := rows.Scan(&inv.ID, &inv.Email, &inv.RoleID, &inv.RoleName,
			&inv.InvitedBy, &inv.InviterName, &inv.Message, &inv.ExpiresAt, &inv.UsedAt, &inv.CreatedAt); err != nil {
			return nil, 0, err
		}
		invites = append(invites, inv)
	}
	return invites, total, nil
}
