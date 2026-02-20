package store

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/domain/listings"
	"github.com/rapidtest/netpulse-api/internal/domain/orders"
	"github.com/rapidtest/netpulse-api/internal/domain/payment"
	"github.com/rapidtest/netpulse-api/internal/domain/portfolio"
	"github.com/rapidtest/netpulse-api/internal/gateway"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

// PublicHandler handles public store endpoints (no auth required).
type PublicHandler struct {
	listingsRepo  *postgres.ListingsRepo
	ordersRepo    *postgres.OrdersRepo
	portfolioRepo *postgres.PortfolioRepo
	paymentRepo   *postgres.PaymentRepo
	tripay        *gateway.TripayClient
	paydisini     *gateway.PaydisiniClient
	storeURL      string
}

// NewPublicHandler creates a new public store handler.
func NewPublicHandler(
	listingsRepo *postgres.ListingsRepo,
	ordersRepo *postgres.OrdersRepo,
	portfolioRepo *postgres.PortfolioRepo,
	paymentRepo *postgres.PaymentRepo,
	tripay *gateway.TripayClient,
	paydisini *gateway.PaydisiniClient,
	storeURL string,
) *PublicHandler {
	return &PublicHandler{
		listingsRepo:  listingsRepo,
		ordersRepo:    ordersRepo,
		portfolioRepo: portfolioRepo,
		paymentRepo:   paymentRepo,
		tripay:        tripay,
		paydisini:     paydisini,
		storeURL:      storeURL,
	}
}

// ── Listings ─────────────────────────────────────────

// ListListings handles GET /store/listings
func (h *PublicHandler) ListListings(w http.ResponseWriter, r *http.Request) {
	active := true
	lt := listings.ListingType(utils.QueryString(r, "type", ""))

	filter := listings.ListingFilter{
		IsActive:    &active,
		ListingType: lt,
		CategoryID:  utils.QueryString(r, "category_id", ""),
		Query:       utils.QueryString(r, "q", ""),
		Sort:        utils.QueryString(r, "sort", "newest"),
		Page:        utils.QueryInt(r, "page", 1),
		Limit:       utils.QueryInt(r, "limit", 12),
	}

	result, err := h.listingsRepo.FindAll(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load listings")
		return
	}
	utils.JSONResponse(w, http.StatusOK, result)
}

// GetListing handles GET /store/listings/{slug}
func (h *PublicHandler) GetListing(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		utils.JSONError(w, http.StatusBadRequest, "slug is required")
		return
	}

	listing, err := h.listingsRepo.FindBySlug(r.Context(), slug)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "listing not found")
		return
	}

	// Only show active listings publicly
	if !listing.IsActive {
		utils.JSONError(w, http.StatusNotFound, "listing not found")
		return
	}

	utils.JSONResponse(w, http.StatusOK, listing)
}

// ListCategories handles GET /store/categories
func (h *PublicHandler) ListCategories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.listingsRepo.FindAllCategories(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load categories")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{"items": cats})
}

// GetReviews handles GET /store/listings/{slug}/reviews
func (h *PublicHandler) GetReviews(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	listing, err := h.listingsRepo.FindBySlug(r.Context(), slug)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "listing not found")
		return
	}

	page := utils.QueryInt(r, "page", 1)
	limit := utils.QueryInt(r, "limit", 10)

	reviews, total, err := h.paymentRepo.GetReviews(r.Context(), listing.ID, page, limit)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load reviews")
		return
	}

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"items": reviews,
		"total": total,
	})
}

// ── Checkout / Orders ────────────────────────────────

// CreateOrder handles POST /store/orders
func (h *PublicHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var input orders.CreateOrderInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if msg := input.Validate(); msg != "" {
		utils.JSONError(w, http.StatusBadRequest, msg)
		return
	}

	// Get listing
	listing, err := h.listingsRepo.FindByID(r.Context(), input.ListingID)
	if err != nil || !listing.IsActive {
		utils.JSONError(w, http.StatusNotFound, "listing not found or inactive")
		return
	}

	// Determine price from package or base price
	amount := listing.BasePrice
	packageName := ""
	if input.PackageID != "" {
		// Load packages via FindBySlug for full listing with packages
		fullListing, err := h.listingsRepo.FindBySlug(r.Context(), listing.Slug)
		if err == nil {
			for _, pkg := range fullListing.Packages {
				if pkg.ID == input.PackageID {
					amount = pkg.Price
					packageName = pkg.Name
					break
				}
			}
		}
	}

	// Get payment method and calculate fee
	method, err := h.paymentRepo.GetMethodByCode(r.Context(), input.PaymentMethod)
	if err != nil || !method.IsActive {
		utils.JSONError(w, http.StatusBadRequest, "invalid or inactive payment method")
		return
	}

	fee := method.CalcFee(amount)
	total := amount + fee

	// Generate order
	orderID := utils.NewID()
	orderNumber := generateOrderNumber()
	accessToken := generateToken()

	order := &orders.Order{
		ID:           orderID,
		OrderNumber:  orderNumber,
		BuyerName:    input.BuyerName,
		BuyerEmail:   input.BuyerEmail,
		BuyerPhone:   input.BuyerPhone,
		AccessToken:  accessToken,
		ListingID:    listing.ID,
		PackageID:    input.PackageID,
		ListingTitle: listing.Title,
		PackageName:  packageName,
		ListingType:  string(listing.ListingType),
		Amount:       amount,
		Currency:     "IDR",
		Status:       orders.StatusPendingPayment,
		BuyerNotes:   input.BuyerNotes,
	}

	if err := h.ordersRepo.Create(r.Context(), order); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to create order")
		return
	}

	// Create payment transaction via gateway
	paymentTx, err := h.createPayment(r.Context(), order, method, fee, total)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to create payment: "+err.Error())
		return
	}

	// Increment listing order count
	_ = h.listingsRepo.IncrementOrderCount(r.Context(), listing.ID)

	// Build response
	resp := orders.OrderResponse{
		OrderNumber: orderNumber,
		Status:      orders.StatusPendingPayment,
		Amount:      total,
		Payment: orders.PaymentInfo{
			Method:    method.Name,
			Gateway:   method.Gateway,
			PayURL:    paymentTx.GatewayURL,
			QRURL:     paymentTx.QRURL,
			PayCode:   paymentTx.PayCode,
			ExpiredAt: paymentTx.ExpiredAt,
		},
		TrackingURL: fmt.Sprintf("%s/order/%s?token=%s", h.storeURL, orderNumber, accessToken),
	}

	utils.JSONResponse(w, http.StatusCreated, resp)
}

func (h *PublicHandler) createPayment(ctx context.Context, order *orders.Order, method *payment.Method, fee, total int64) (*orders.PaymentTransaction, error) {
	txID := utils.NewID()
	var gatewayRef, gatewayURL, payCode, qrURL string
	var expiredAt time.Time

	switch method.Gateway {
	case "tripay":
		resp, err := h.tripay.CreateTransaction(gateway.TripayCreateTxRequest{
			Method:        method.Code,
			MerchantRef:   order.OrderNumber,
			Amount:        total,
			CustomerName:  order.BuyerName,
			CustomerEmail: order.BuyerEmail,
			CustomerPhone: order.BuyerPhone,
			OrderItems: []gateway.TripayOrderItem{{
				Name:     order.ListingTitle,
				Price:    order.Amount,
				Quantity: 1,
			}},
		})
		if err != nil {
			return nil, fmt.Errorf("tripay: %w", err)
		}
		gatewayRef = resp.Reference
		gatewayURL = resp.PaymentURL
		payCode = resp.PayCode
		qrURL = resp.QRURL
		expiredAt = time.Unix(resp.ExpiredTime, 0)

	case "paydisini":
		resp, err := h.paydisini.CreateTransaction(gateway.PaydisiniCreateRequest{
			UniqueCode: order.OrderNumber,
			Service:    gateway.MapServiceCode(method.Code),
			Amount:     total,
			Note:       order.ListingTitle,
		})
		if err != nil {
			return nil, fmt.Errorf("paydisini: %w", err)
		}
		gatewayRef = resp.TransactionID
		gatewayURL = resp.CheckoutURL
		qrURL = resp.QRCodeURL

		// Paydisini default expiry: 24h
		expiredAt = time.Now().Add(24 * time.Hour)

	default:
		return nil, fmt.Errorf("unsupported gateway: %s", method.Gateway)
	}

	pt := &orders.PaymentTransaction{
		ID:         txID,
		OrderID:    order.ID,
		Gateway:    method.Gateway,
		GatewayRef: gatewayRef,
		GatewayURL: gatewayURL,
		Method:     method.Code,
		Amount:     order.Amount,
		Fee:        fee,
		Total:      total,
		PayCode:    payCode,
		QRURL:      qrURL,
		Status:     "PENDING",
		ExpiredAt:  &expiredAt,
	}

	if err := h.ordersRepo.CreatePayment(ctx, pt); err != nil {
		return nil, err
	}

	return pt, nil
}

// ── Order Tracking ───────────────────────────────────

// TrackOrder handles POST /store/orders/track
func (h *PublicHandler) TrackOrder(w http.ResponseWriter, r *http.Request) {
	var input orders.TrackOrderInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Value == "" {
		utils.JSONError(w, http.StatusBadRequest, "value is required")
		return
	}

	var results []orders.OrderSummary
	var err error

	switch input.Method {
	case orders.TrackByTRX:
		results, err = h.ordersRepo.TrackByNumber(r.Context(), strings.ToUpper(input.Value))
	case orders.TrackByEmail:
		results, err = h.ordersRepo.TrackByEmail(r.Context(), input.Value)
	case orders.TrackByPhone:
		results, err = h.ordersRepo.TrackByPhone(r.Context(), input.Value)
	default:
		utils.JSONError(w, http.StatusBadRequest, "invalid tracking method (trx, email, phone)")
		return
	}

	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to track order")
		return
	}

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{"orders": results})
}

// GetOrderByToken handles GET /store/orders/{orderNumber}?token=xxx
func (h *PublicHandler) GetOrderByToken(w http.ResponseWriter, r *http.Request) {
	orderNum := chi.URLParam(r, "orderNumber")
	token := r.URL.Query().Get("token")

	if orderNum == "" || token == "" {
		utils.JSONError(w, http.StatusBadRequest, "order number and token are required")
		return
	}

	order, err := h.ordersRepo.FindByNumber(r.Context(), orderNum)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "order not found")
		return
	}

	if order.AccessToken != token {
		utils.JSONError(w, http.StatusForbidden, "invalid access token")
		return
	}

	// Attach payment info
	pt, err := h.ordersRepo.FindPaymentByOrderID(r.Context(), order.ID)
	if err == nil {
		order.Payment = pt
	}

	utils.JSONResponse(w, http.StatusOK, order)
}

// DownloadFile handles GET /store/orders/{orderNumber}/download?token=xxx
func (h *PublicHandler) DownloadFile(w http.ResponseWriter, r *http.Request) {
	orderNum := chi.URLParam(r, "orderNumber")
	token := r.URL.Query().Get("token")

	order, err := h.ordersRepo.FindByNumber(r.Context(), orderNum)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "order not found")
		return
	}

	if order.AccessToken != token {
		utils.JSONError(w, http.StatusForbidden, "invalid access token")
		return
	}

	if order.Status != orders.StatusCompleted && order.Status != orders.StatusPaid {
		utils.JSONError(w, http.StatusForbidden, "order is not completed")
		return
	}

	if order.DownloadURL == "" {
		utils.JSONError(w, http.StatusNotFound, "no file available for download")
		return
	}

	if order.DownloadExpiresAt != nil && time.Now().After(*order.DownloadExpiresAt) {
		utils.JSONError(w, http.StatusGone, "download link has expired")
		return
	}

	if order.DownloadCount >= order.MaxDownloads && order.MaxDownloads > 0 {
		utils.JSONError(w, http.StatusGone, "download limit reached")
		return
	}

	// Increment download counter
	_, _ = h.ordersRepo.IncrementDownload(r.Context(), order.ID)

	// Redirect to the actual file
	http.Redirect(w, r, order.DownloadURL, http.StatusTemporaryRedirect)
}

// ── Portfolio ────────────────────────────────────────

// ListPortfolio handles GET /store/portfolio
func (h *PublicHandler) ListPortfolio(w http.ResponseWriter, r *http.Request) {
	active := true
	featured := utils.QueryString(r, "featured", "")
	var featuredPtr *bool
	if featured == "true" {
		t := true
		featuredPtr = &t
	}

	filter := portfolio.Filter{
		IsActive:   &active,
		IsFeatured: featuredPtr,
		ListingID:  utils.QueryString(r, "listing_id", ""),
		Page:       utils.QueryInt(r, "page", 1),
		Limit:      utils.QueryInt(r, "limit", 12),
	}

	result, err := h.portfolioRepo.FindAll(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load portfolio")
		return
	}
	utils.JSONResponse(w, http.StatusOK, result)
}

// GetPortfolioItem handles GET /store/portfolio/{id}
func (h *PublicHandler) GetPortfolioItem(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	item, err := h.portfolioRepo.FindByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "portfolio item not found")
		return
	}

	if !item.IsActive {
		utils.JSONError(w, http.StatusNotFound, "portfolio item not found")
		return
	}

	utils.JSONResponse(w, http.StatusOK, item)
}

// ── Payment Methods ──────────────────────────────────

// ListPaymentMethods handles GET /store/payment-methods
func (h *PublicHandler) ListPaymentMethods(w http.ResponseWriter, r *http.Request) {
	methods, err := h.paymentRepo.GetMethods(r.Context(), true)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load payment methods")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{"items": methods})
}

// ── Webhooks ─────────────────────────────────────────

// TripayWebhook handles POST /webhooks/tripay
func (h *PublicHandler) TripayWebhook(w http.ResponseWriter, r *http.Request) {
	// Read raw body for signature validation
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		utils.JSONError(w, http.StatusBadRequest, "failed to read body")
		return
	}

	signature := r.Header.Get("X-Callback-Signature")
	if !h.tripay.ValidateCallback(signature, bodyBytes) {
		utils.JSONError(w, http.StatusUnauthorized, "invalid signature")
		return
	}

	var payload gateway.TripayCallbackPayload
	if err := json.Unmarshal(bodyBytes, &payload); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid payload")
		return
	}

	// Find payment transaction
	pt, err := h.ordersRepo.FindPaymentByGatewayRef(r.Context(), payload.Reference)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "transaction not found")
		return
	}

	// Update payment status
	var paidAt *time.Time
	status := "PENDING"
	if payload.Status == "PAID" {
		now := time.Now()
		paidAt = &now
		status = "PAID"
	} else if payload.Status == "EXPIRED" {
		status = "EXPIRED"
	} else if payload.Status == "FAILED" {
		status = "FAILED"
	}

	callbackData := map[string]interface{}{
		"tripay_reference": payload.Reference,
		"status":           payload.Status,
		"paid_at":          payload.PaidAt,
	}

	if err := h.ordersRepo.UpdatePaymentStatus(r.Context(), pt.ID, status, paidAt, callbackData); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update payment")
		return
	}

	// Update order status
	if status == "PAID" {
		order, err := h.ordersRepo.FindByID(r.Context(), pt.OrderID)
		if err == nil {
			_ = h.ordersRepo.UpdateStatus(r.Context(), order.ID, orders.StatusPaid)

			// Auto-deliver for digital products
			if order.ListingType == "DIGITAL_PRODUCT" {
				h.autoDeliver(r.Context(), order)
			}
		}
	} else if status == "EXPIRED" {
		_ = h.ordersRepo.UpdateStatus(r.Context(), pt.OrderID, orders.StatusExpired)
	}

	utils.JSONResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// PaydisiniWebhook handles POST /webhooks/paydisini
func (h *PublicHandler) PaydisiniWebhook(w http.ResponseWriter, r *http.Request) {
	var payload gateway.PaydisiniCallbackPayload
	if err := utils.DecodeJSON(r, &payload); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid payload")
		return
	}

	if !h.paydisini.ValidateCallback(payload.UniqueCode, payload.Status, payload.Signature) {
		utils.JSONError(w, http.StatusUnauthorized, "invalid signature")
		return
	}

	// Paydisini uses unique_code (order number) as reference
	order, err := h.ordersRepo.FindByNumber(r.Context(), payload.UniqueCode)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "order not found")
		return
	}

	pt, err := h.ordersRepo.FindPaymentByOrderID(r.Context(), order.ID)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "transaction not found")
		return
	}

	var paidAt *time.Time
	status := "PENDING"
	if payload.Status == "Success" || payload.Status == "Paid" {
		now := time.Now()
		paidAt = &now
		status = "PAID"
	} else if payload.Status == "Canceled" || payload.Status == "Expired" {
		status = "EXPIRED"
	}

	callbackData := map[string]interface{}{
		"unique_code": payload.UniqueCode,
		"status":      payload.Status,
	}

	if err := h.ordersRepo.UpdatePaymentStatus(r.Context(), pt.ID, status, paidAt, callbackData); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update payment")
		return
	}

	if status == "PAID" {
		_ = h.ordersRepo.UpdateStatus(r.Context(), order.ID, orders.StatusPaid)
		if order.ListingType == "DIGITAL_PRODUCT" {
			h.autoDeliver(r.Context(), order)
		}
	} else if status == "EXPIRED" {
		_ = h.ordersRepo.UpdateStatus(r.Context(), order.ID, orders.StatusExpired)
	}

	utils.JSONResponse(w, http.StatusOK, map[string]string{"status": "ok"})
}

// autoDeliver handles auto-delivery for digital products.
func (h *PublicHandler) autoDeliver(ctx context.Context, order *orders.Order) {
	listing, err := h.listingsRepo.FindByID(ctx, order.ListingID)
	if err != nil || !listing.AutoDelivery {
		return
	}

	maxDL := listing.DeliveryMaxDownloads
	if maxDL == 0 {
		maxDL = 5
	}

	var dlExpiry *time.Time
	if listing.DeliveryExpiryDays > 0 {
		t := time.Now().Add(time.Duration(listing.DeliveryExpiryDays) * 24 * time.Hour)
		dlExpiry = &t
	}

	order.DownloadURL = listing.DeliveryFileURL
	order.MaxDownloads = maxDL
	order.DownloadExpiresAt = dlExpiry
	order.DeliveryMethod = "AUTO"
	now := time.Now()
	order.DeliverySentAt = &now
	_ = h.ordersRepo.Update(ctx, order)
	_ = h.ordersRepo.UpdateStatus(ctx, order.ID, orders.StatusCompleted)
}

// ── Submit Review ────────────────────────────────────

// SubmitReview handles POST /store/orders/{orderNumber}/review?token=xxx
func (h *PublicHandler) SubmitReview(w http.ResponseWriter, r *http.Request) {
	orderNum := chi.URLParam(r, "orderNumber")
	token := r.URL.Query().Get("token")

	order, err := h.ordersRepo.FindByNumber(r.Context(), orderNum)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "order not found")
		return
	}

	if order.AccessToken != token {
		utils.JSONError(w, http.StatusForbidden, "invalid access token")
		return
	}

	if order.Status != orders.StatusCompleted {
		utils.JSONError(w, http.StatusBadRequest, "only completed orders can be reviewed")
		return
	}

	var input payment.CreateReviewInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Rating < 1 || input.Rating > 5 {
		utils.JSONError(w, http.StatusBadRequest, "rating must be 1-5")
		return
	}

	rev := &payment.Review{
		ID:           utils.NewID(),
		ListingID:    order.ListingID,
		OrderID:      order.ID,
		ReviewerName: order.BuyerName,
		Rating:       input.Rating,
		Content:      input.Content,
	}

	if err := h.paymentRepo.CreateReview(r.Context(), rev); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to submit review")
		return
	}

	// Update listing rating
	_ = h.listingsRepo.UpdateRating(r.Context(), order.ListingID)

	utils.JSONResponse(w, http.StatusCreated, map[string]string{"message": "review submitted"})
}

// ── Helpers ──────────────────────────────────────────

func generateOrderNumber() string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return fmt.Sprintf("NP-%s-%s", time.Now().Format("060102"), strings.ToUpper(hex.EncodeToString(b)))
}

func generateToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
