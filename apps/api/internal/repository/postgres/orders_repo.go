package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rapidtest/netpulse-api/internal/domain/orders"
)

// OrdersRepo handles order database operations.
type OrdersRepo struct {
	db *pgxpool.Pool
}

// NewOrdersRepo creates a new OrdersRepo.
func NewOrdersRepo(db *pgxpool.Pool) *OrdersRepo {
	return &OrdersRepo{db: db}
}

// Create inserts a new order.
func (r *OrdersRepo) Create(ctx context.Context, o *orders.Order) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO orders (id, order_number, buyer_name, buyer_email, buyer_phone,
			access_token, listing_id, package_id, listing_title, package_name, listing_type,
			amount, currency, status, buyer_notes, buyer_files)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
	`, o.ID, o.OrderNumber, o.BuyerName, o.BuyerEmail, o.BuyerPhone,
		o.AccessToken, o.ListingID, o.PackageID, o.ListingTitle, o.PackageName, o.ListingType,
		o.Amount, o.Currency, o.Status, o.BuyerNotes, o.BuyerFiles)
	return err
}

// FindByID returns an order by ID.
func (r *OrdersRepo) FindByID(ctx context.Context, id string) (*orders.Order, error) {
	return r.scanOrder(ctx, `SELECT `+orderCols+` FROM orders o WHERE o.id = $1`, id)
}

// FindByNumber returns an order by order number.
func (r *OrdersRepo) FindByNumber(ctx context.Context, orderNumber string) (*orders.Order, error) {
	return r.scanOrder(ctx, `SELECT `+orderCols+` FROM orders o WHERE o.order_number = $1`, orderNumber)
}

// FindByToken returns an order by access token.
func (r *OrdersRepo) FindByToken(ctx context.Context, token string) (*orders.Order, error) {
	return r.scanOrder(ctx, `SELECT `+orderCols+` FROM orders o WHERE o.access_token = $1`, token)
}

// TrackByEmail returns order summaries by email.
func (r *OrdersRepo) TrackByEmail(ctx context.Context, email string) ([]orders.OrderSummary, error) {
	return r.trackOrders(ctx, `SELECT order_number, listing_title, COALESCE(package_name,''), amount, status, created_at
		FROM orders WHERE buyer_email = $1 ORDER BY created_at DESC LIMIT 20`, email)
}

// TrackByPhone returns order summaries by phone.
func (r *OrdersRepo) TrackByPhone(ctx context.Context, phone string) ([]orders.OrderSummary, error) {
	return r.trackOrders(ctx, `SELECT order_number, listing_title, COALESCE(package_name,''), amount, status, created_at
		FROM orders WHERE buyer_phone = $1 ORDER BY created_at DESC LIMIT 20`, phone)
}

// TrackByNumber returns order summary by order number.
func (r *OrdersRepo) TrackByNumber(ctx context.Context, orderNum string) ([]orders.OrderSummary, error) {
	return r.trackOrders(ctx, `SELECT order_number, listing_title, COALESCE(package_name,''), amount, status, created_at
		FROM orders WHERE order_number = $1`, orderNum)
}

func (r *OrdersRepo) trackOrders(ctx context.Context, query string, arg string) ([]orders.OrderSummary, error) {
	rows, err := r.db.Query(ctx, query, arg)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []orders.OrderSummary
	for rows.Next() {
		var s orders.OrderSummary
		if err := rows.Scan(&s.OrderNumber, &s.ListingTitle, &s.PackageName, &s.Amount, &s.Status, &s.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, s)
	}
	return results, nil
}

// FindAll returns paginated orders for admin.
func (r *OrdersRepo) FindAll(ctx context.Context, f orders.OrderFilter) (*orders.OrderListResult, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 || f.Limit > 50 {
		f.Limit = 20
	}

	where := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if f.Status != "" {
		where = append(where, fmt.Sprintf("o.status = $%d", argIdx))
		args = append(args, string(f.Status))
		argIdx++
	}
	if f.Search != "" {
		where = append(where, fmt.Sprintf("(o.order_number ILIKE $%d OR o.buyer_name ILIKE $%d OR o.buyer_email ILIKE $%d)", argIdx, argIdx, argIdx))
		args = append(args, "%"+f.Search+"%")
		argIdx++
	}
	if f.ListingID != "" {
		where = append(where, fmt.Sprintf("o.listing_id = $%d", argIdx))
		args = append(args, f.ListingID)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	if err := r.db.QueryRow(ctx, fmt.Sprintf(`SELECT COUNT(*) FROM orders o WHERE %s`, whereClause), args...).Scan(&total); err != nil {
		return nil, err
	}

	offset := (f.Page - 1) * f.Limit
	args = append(args, f.Limit, offset)

	query := fmt.Sprintf(`
		SELECT %s FROM orders o
		LEFT JOIN users u ON u.id = o.assigned_to
		WHERE %s
		ORDER BY o.created_at DESC
		LIMIT $%d OFFSET $%d
	`, orderColsJoined, whereClause, argIdx, argIdx+1)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []orders.Order
	for rows.Next() {
		o, err := r.scanOrderRow(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *o)
	}

	return &orders.OrderListResult{
		Items:      items,
		Total:      total,
		Page:       f.Page,
		Limit:      f.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(f.Limit))),
	}, nil
}

// UpdateStatus updates the order status.
func (r *OrdersRepo) UpdateStatus(ctx context.Context, id string, status orders.OrderStatus) error {
	query := `UPDATE orders SET status = $2, updated_at = NOW()`
	switch status {
	case orders.StatusPaid:
		query += `, paid_at = NOW()`
	case orders.StatusCompleted:
		query += `, completed_at = NOW()`
	case orders.StatusCancelled:
		query += `, cancelled_at = NOW()`
	case orders.StatusExpired:
		query += `, expired_at = NOW()`
	}
	query += ` WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id, string(status))
	return err
}

// Update modifies order fields (admin update).
func (r *OrdersRepo) Update(ctx context.Context, o *orders.Order) error {
	_, err := r.db.Exec(ctx, `
		UPDATE orders SET
			admin_notes = $2, assigned_to = $3,
			deliverable_url = $4, deliverable_notes = $5,
			delivery_method = $6, delivery_sent_at = $7,
			download_url = $8, download_expires_at = $9,
			download_count = $10, max_downloads = $11,
			updated_at = NOW()
		WHERE id = $1
	`, o.ID, o.AdminNotes, o.AssignedTo,
		o.DeliverableURL, o.DeliverableNotes,
		o.DeliveryMethod, o.DeliverySentAt,
		o.DownloadURL, o.DownloadExpiresAt,
		o.DownloadCount, o.MaxDownloads)
	return err
}

// IncrementDownload increments the download counter and checks max.
func (r *OrdersRepo) IncrementDownload(ctx context.Context, id string) (bool, error) {
	var count, max int
	err := r.db.QueryRow(ctx, `
		UPDATE orders SET download_count = download_count + 1, updated_at = NOW()
		WHERE id = $1 RETURNING download_count, max_downloads
	`, id).Scan(&count, &max)
	if err != nil {
		return false, err
	}
	return count <= max, nil
}

// ── Payment Transactions ─────────────────────────────

// CreatePayment inserts a payment transaction.
func (r *OrdersRepo) CreatePayment(ctx context.Context, pt *orders.PaymentTransaction) error {
	callbackJSON, _ := json.Marshal(pt.CallbackData)
	_, err := r.db.Exec(ctx, `
		INSERT INTO payment_transactions (id, order_id, gateway, gateway_ref, gateway_url,
			method, amount, fee, total, pay_code, qr_url, status, expired_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
	`, pt.ID, pt.OrderID, pt.Gateway, pt.GatewayRef, pt.GatewayURL,
		pt.Method, pt.Amount, pt.Fee, pt.Total, pt.PayCode, pt.QRURL, pt.Status, pt.ExpiredAt)
	_ = callbackJSON
	return err
}

// FindPaymentByGatewayRef returns a payment by gateway reference.
func (r *OrdersRepo) FindPaymentByGatewayRef(ctx context.Context, ref string) (*orders.PaymentTransaction, error) {
	var pt orders.PaymentTransaction
	var callbackJSON []byte
	err := r.db.QueryRow(ctx, `
		SELECT id, order_id, gateway, gateway_ref, gateway_url,
			method, amount, fee, total, pay_code, qr_url,
			status, expired_at, paid_at, callback_data, created_at, updated_at
		FROM payment_transactions WHERE gateway_ref = $1
	`, ref).Scan(&pt.ID, &pt.OrderID, &pt.Gateway, &pt.GatewayRef, &pt.GatewayURL,
		&pt.Method, &pt.Amount, &pt.Fee, &pt.Total, &pt.PayCode, &pt.QRURL,
		&pt.Status, &pt.ExpiredAt, &pt.PaidAt, &callbackJSON, &pt.CreatedAt, &pt.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if len(callbackJSON) > 0 {
		json.Unmarshal(callbackJSON, &pt.CallbackData)
	}
	return &pt, nil
}

// FindPaymentByOrderID returns a payment by order ID.
func (r *OrdersRepo) FindPaymentByOrderID(ctx context.Context, orderID string) (*orders.PaymentTransaction, error) {
	var pt orders.PaymentTransaction
	err := r.db.QueryRow(ctx, `
		SELECT id, order_id, gateway, gateway_ref, gateway_url,
			method, amount, fee, total, pay_code, qr_url,
			status, expired_at, paid_at, created_at, updated_at
		FROM payment_transactions WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1
	`, orderID).Scan(&pt.ID, &pt.OrderID, &pt.Gateway, &pt.GatewayRef, &pt.GatewayURL,
		&pt.Method, &pt.Amount, &pt.Fee, &pt.Total, &pt.PayCode, &pt.QRURL,
		&pt.Status, &pt.ExpiredAt, &pt.PaidAt, &pt.CreatedAt, &pt.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &pt, nil
}

// UpdatePaymentStatus updates payment status after webhook.
func (r *OrdersRepo) UpdatePaymentStatus(ctx context.Context, id, status string, paidAt *time.Time, callbackData map[string]interface{}) error {
	cbJSON, _ := json.Marshal(callbackData)
	_, err := r.db.Exec(ctx, `
		UPDATE payment_transactions SET status = $2, paid_at = $3, callback_data = $4, updated_at = NOW()
		WHERE id = $1
	`, id, status, paidAt, cbJSON)
	return err
}

// ── Helpers ──────────────────────────────────────────

const orderCols = `o.id, o.order_number, o.buyer_name, o.buyer_email, o.buyer_phone,
	o.access_token, o.listing_id, o.package_id, o.listing_title, o.package_name, o.listing_type,
	o.amount, o.currency, o.status, o.paid_at,
	o.delivery_method, o.delivery_sent_at, o.download_url, o.download_expires_at,
	o.download_count, o.max_downloads, o.deliverable_url, o.deliverable_notes,
	o.buyer_notes, o.buyer_files, o.admin_notes, o.assigned_to,
	o.completed_at, o.cancelled_at, o.expired_at, o.created_at, o.updated_at`

const orderColsJoined = `o.id, o.order_number, o.buyer_name, o.buyer_email, o.buyer_phone,
	o.access_token, o.listing_id, o.package_id, o.listing_title, o.package_name, o.listing_type,
	o.amount, o.currency, o.status, o.paid_at,
	o.delivery_method, o.delivery_sent_at, o.download_url, o.download_expires_at,
	o.download_count, o.max_downloads, o.deliverable_url, o.deliverable_notes,
	o.buyer_notes, o.buyer_files, o.admin_notes, o.assigned_to,
	o.completed_at, o.cancelled_at, o.expired_at, o.created_at, o.updated_at,
	COALESCE(u.name, '') AS assigned_name`

func (r *OrdersRepo) scanOrder(ctx context.Context, query string, arg interface{}) (*orders.Order, error) {
	var o orders.Order
	err := r.db.QueryRow(ctx, query, arg).Scan(
		&o.ID, &o.OrderNumber, &o.BuyerName, &o.BuyerEmail, &o.BuyerPhone,
		&o.AccessToken, &o.ListingID, &o.PackageID, &o.ListingTitle, &o.PackageName, &o.ListingType,
		&o.Amount, &o.Currency, &o.Status, &o.PaidAt,
		&o.DeliveryMethod, &o.DeliverySentAt, &o.DownloadURL, &o.DownloadExpiresAt,
		&o.DownloadCount, &o.MaxDownloads, &o.DeliverableURL, &o.DeliverableNotes,
		&o.BuyerNotes, &o.BuyerFiles, &o.AdminNotes, &o.AssignedTo,
		&o.CompletedAt, &o.CancelledAt, &o.ExpiredAt, &o.CreatedAt, &o.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &o, nil
}

type scannable interface {
	Scan(dest ...interface{}) error
}

func (r *OrdersRepo) scanOrderRow(row scannable) (*orders.Order, error) {
	var o orders.Order
	err := row.Scan(
		&o.ID, &o.OrderNumber, &o.BuyerName, &o.BuyerEmail, &o.BuyerPhone,
		&o.AccessToken, &o.ListingID, &o.PackageID, &o.ListingTitle, &o.PackageName, &o.ListingType,
		&o.Amount, &o.Currency, &o.Status, &o.PaidAt,
		&o.DeliveryMethod, &o.DeliverySentAt, &o.DownloadURL, &o.DownloadExpiresAt,
		&o.DownloadCount, &o.MaxDownloads, &o.DeliverableURL, &o.DeliverableNotes,
		&o.BuyerNotes, &o.BuyerFiles, &o.AdminNotes, &o.AssignedTo,
		&o.CompletedAt, &o.CancelledAt, &o.ExpiredAt, &o.CreatedAt, &o.UpdatedAt,
		&o.AssignedName,
	)
	if err != nil {
		return nil, err
	}
	return &o, nil
}
