package store

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/domain/listings"
	"github.com/rapidtest/netpulse-api/internal/domain/orders"
	"github.com/rapidtest/netpulse-api/internal/domain/payment"
	"github.com/rapidtest/netpulse-api/internal/domain/portfolio"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

// AdminHandler handles admin store management endpoints.
type AdminHandler struct {
	listingsRepo  *postgres.ListingsRepo
	ordersRepo    *postgres.OrdersRepo
	portfolioRepo *postgres.PortfolioRepo
	paymentRepo   *postgres.PaymentRepo
	auditRepo     *postgres.AuditRepo
}

// NewAdminHandler creates a new admin store handler.
func NewAdminHandler(
	listingsRepo *postgres.ListingsRepo,
	ordersRepo *postgres.OrdersRepo,
	portfolioRepo *postgres.PortfolioRepo,
	paymentRepo *postgres.PaymentRepo,
	auditRepo *postgres.AuditRepo,
) *AdminHandler {
	return &AdminHandler{
		listingsRepo:  listingsRepo,
		ordersRepo:    ordersRepo,
		portfolioRepo: portfolioRepo,
		paymentRepo:   paymentRepo,
		auditRepo:     auditRepo,
	}
}

// ═══════════════════════════════════════════════════════
// LISTINGS MANAGEMENT
// ═══════════════════════════════════════════════════════

// ListListings handles GET /admin/store/listings
func (h *AdminHandler) ListListings(w http.ResponseWriter, r *http.Request) {
	lt := listings.ListingType(utils.QueryString(r, "type", ""))
	isActive := utils.QueryString(r, "active", "")
	var isActivePtr *bool
	if isActive == "true" {
		t := true
		isActivePtr = &t
	} else if isActive == "false" {
		f := false
		isActivePtr = &f
	}

	filter := listings.ListingFilter{
		ListingType: lt,
		CategoryID:  utils.QueryString(r, "category_id", ""),
		Query:       utils.QueryString(r, "q", ""),
		IsActive:    isActivePtr,
		Sort:        utils.QueryString(r, "sort", "newest"),
		Page:        utils.QueryInt(r, "page", 1),
		Limit:       utils.QueryInt(r, "limit", 20),
	}

	result, err := h.listingsRepo.FindAll(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to list listings")
		return
	}
	utils.JSONResponse(w, http.StatusOK, result)
}

// GetListing handles GET /admin/store/listings/{id}
func (h *AdminHandler) GetListing(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	listing, err := h.listingsRepo.FindByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "listing not found")
		return
	}
	utils.JSONResponse(w, http.StatusOK, listing)
}

// CreateListing handles POST /admin/store/listings
func (h *AdminHandler) CreateListing(w http.ResponseWriter, r *http.Request) {
	var input listings.CreateListingInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Title == "" || input.ListingType == "" {
		utils.JSONError(w, http.StatusBadRequest, "title and listing_type are required")
		return
	}

	catID := &input.CategoryID
	if input.CategoryID == "" {
		catID = nil
	}

	listing := &listings.Listing{
		ID:            utils.NewID(),
		Title:         input.Title,
		Slug:          utils.Slugify(input.Title),
		Description:   input.Description,
		ShortDesc:     input.ShortDesc,
		CoverURL:      input.CoverURL,
		ListingType:   input.ListingType,
		CategoryID:    catID,
		BasePrice:     input.BasePrice,
		MetaTitle:     input.MetaTitle,
		MetaDesc:      input.MetaDesc,
		Features:      input.Features,
		TechStack:     input.TechStack,
		EstimatedDays: input.EstDays,
		IsFeatured:    input.IsFeatured,
		IsActive:      false, // start as inactive / draft
	}

	if err := h.listingsRepo.Create(r.Context(), listing); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to create listing")
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "create", "listing", listing.ID, listing.Title, r.RemoteAddr)

	utils.JSONResponse(w, http.StatusCreated, listing)
}

// UpdateListing handles PATCH /admin/store/listings/{id}
func (h *AdminHandler) UpdateListing(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	existing, err := h.listingsRepo.FindByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "listing not found")
		return
	}

	var input listings.UpdateListingInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Title != nil {
		existing.Title = *input.Title
		existing.Slug = utils.Slugify(*input.Title)
	}
	if input.Description != nil {
		existing.Description = *input.Description
	}
	if input.ShortDesc != nil {
		existing.ShortDesc = *input.ShortDesc
	}
	if input.CoverURL != nil {
		existing.CoverURL = *input.CoverURL
	}
	if input.ListingType != nil {
		existing.ListingType = *input.ListingType
	}
	if input.CategoryID != nil {
		existing.CategoryID = input.CategoryID
	}
	if input.BasePrice != nil {
		existing.BasePrice = *input.BasePrice
	}
	if input.MetaTitle != nil {
		existing.MetaTitle = *input.MetaTitle
	}
	if input.MetaDesc != nil {
		existing.MetaDesc = *input.MetaDesc
	}
	if input.Features != nil {
		existing.Features = input.Features
	}
	if input.TechStack != nil {
		existing.TechStack = input.TechStack
	}
	if input.EstDays != nil {
		existing.EstimatedDays = *input.EstDays
	}
	if input.IsFeatured != nil {
		existing.IsFeatured = *input.IsFeatured
	}
	if input.IsActive != nil {
		existing.IsActive = *input.IsActive
	}

	if err := h.listingsRepo.Update(r.Context(), existing); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update listing")
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "update", "listing", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, existing)
}

// UpdateDelivery handles PATCH /admin/store/listings/{id}/delivery
func (h *AdminHandler) UpdateDelivery(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	existing, err := h.listingsRepo.FindByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "listing not found")
		return
	}

	var input listings.DeliveryConfig
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	existing.AutoDelivery = input.AutoDelivery
	existing.DeliveryFileURL = input.FileURL
	existing.DeliveryFileName = input.FileName
	existing.DeliveryFileSize = input.FileSize
	existing.DeliveryExpiryDays = input.ExpiryDays
	existing.DeliveryMaxDownloads = input.MaxDownloads
	existing.DeliveryEmailTpl = input.EmailTemplate
	existing.DeliveryWATpl = input.WATemplate

	if err := h.listingsRepo.Update(r.Context(), existing); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update delivery settings")
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "update_delivery", "listing", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, existing)
}

// DeleteListing handles DELETE /admin/store/listings/{id}
func (h *AdminHandler) DeleteListing(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.listingsRepo.Delete(r.Context(), id); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to delete listing")
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "delete", "listing", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "listing deleted"})
}

// ── Listing Packages ─────────────────────────────────

// AddPackage handles POST /admin/store/listings/{id}/packages
func (h *AdminHandler) AddPackage(w http.ResponseWriter, r *http.Request) {
	listingID := chi.URLParam(r, "id")

	var pkg listings.Package
	if err := utils.DecodeJSON(r, &pkg); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	pkg.ID = utils.NewID()
	pkg.ListingID = listingID

	if err := h.listingsRepo.CreatePackage(r.Context(), &pkg); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to add package")
		return
	}

	utils.JSONResponse(w, http.StatusCreated, pkg)
}

// UpdatePackage handles PATCH /admin/store/listings/{id}/packages/{pkgId}
func (h *AdminHandler) UpdatePackage(w http.ResponseWriter, r *http.Request) {
	pkgID := chi.URLParam(r, "pkgId")

	var pkg listings.Package
	if err := utils.DecodeJSON(r, &pkg); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	pkg.ID = pkgID
	if err := h.listingsRepo.UpdatePackage(r.Context(), &pkg); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update package")
		return
	}

	utils.JSONResponse(w, http.StatusOK, pkg)
}

// DeletePackage handles DELETE /admin/store/listings/{id}/packages/{pkgId}
func (h *AdminHandler) DeletePackage(w http.ResponseWriter, r *http.Request) {
	pkgID := chi.URLParam(r, "pkgId")
	if err := h.listingsRepo.DeletePackage(r.Context(), pkgID); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to delete package")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "package deleted"})
}

// ── Listing FAQ ──────────────────────────────────────

// AddFAQ handles POST /admin/store/listings/{id}/faq
func (h *AdminHandler) AddFAQ(w http.ResponseWriter, r *http.Request) {
	listingID := chi.URLParam(r, "id")

	var faq listings.FAQ
	if err := utils.DecodeJSON(r, &faq); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	faq.ID = utils.NewID()
	faq.ListingID = listingID

	if err := h.listingsRepo.CreateFAQ(r.Context(), &faq); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to add FAQ")
		return
	}

	utils.JSONResponse(w, http.StatusCreated, faq)
}

// DeleteFAQ handles DELETE /admin/store/listings/{id}/faq/{faqId}
func (h *AdminHandler) DeleteFAQ(w http.ResponseWriter, r *http.Request) {
	faqID := chi.URLParam(r, "faqId")
	if err := h.listingsRepo.DeleteFAQ(r.Context(), faqID); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to delete FAQ")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "FAQ deleted"})
}

// ═══════════════════════════════════════════════════════
// ORDERS MANAGEMENT
// ═══════════════════════════════════════════════════════

// ListOrders handles GET /admin/store/orders
func (h *AdminHandler) ListOrders(w http.ResponseWriter, r *http.Request) {
	filter := orders.OrderFilter{
		Status:    orders.OrderStatus(utils.QueryString(r, "status", "")),
		Search:    utils.QueryString(r, "search", ""),
		ListingID: utils.QueryString(r, "listing_id", ""),
		Page:      utils.QueryInt(r, "page", 1),
		Limit:     utils.QueryInt(r, "limit", 20),
	}

	result, err := h.ordersRepo.FindAll(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to list orders")
		return
	}
	utils.JSONResponse(w, http.StatusOK, result)
}

// GetOrder handles GET /admin/store/orders/{id}
func (h *AdminHandler) GetOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	order, err := h.ordersRepo.FindByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "order not found")
		return
	}

	// Attach payment
	pt, err := h.ordersRepo.FindPaymentByOrderID(r.Context(), order.ID)
	if err == nil {
		order.Payment = pt
	}

	utils.JSONResponse(w, http.StatusOK, order)
}

// UpdateOrder handles PATCH /admin/store/orders/{id}
func (h *AdminHandler) UpdateOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	existing, err := h.ordersRepo.FindByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "order not found")
		return
	}

	var input orders.UpdateOrderInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Status != nil {
		if err := h.ordersRepo.UpdateStatus(r.Context(), id, *input.Status); err != nil {
			utils.JSONError(w, http.StatusInternalServerError, "failed to update status")
			return
		}
	}

	if input.AdminNotes != nil {
		existing.AdminNotes = *input.AdminNotes
	}
	if input.AssignedTo != nil {
		existing.AssignedTo = input.AssignedTo
	}
	if input.DeliverableURL != nil {
		existing.DeliverableURL = *input.DeliverableURL
	}
	if input.DeliverableNotes != nil {
		existing.DeliverableNotes = *input.DeliverableNotes
	}

	if err := h.ordersRepo.Update(r.Context(), existing); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update order")
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "update", "order", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, existing)
}

// ═══════════════════════════════════════════════════════
// PORTFOLIO MANAGEMENT
// ═══════════════════════════════════════════════════════

// ListPortfolio handles GET /admin/store/portfolio
func (h *AdminHandler) ListPortfolio(w http.ResponseWriter, r *http.Request) {
	isActive := utils.QueryString(r, "active", "")
	var isActivePtr *bool
	if isActive == "true" {
		t := true
		isActivePtr = &t
	} else if isActive == "false" {
		f := false
		isActivePtr = &f
	}

	filter := portfolio.Filter{
		IsActive:  isActivePtr,
		ListingID: utils.QueryString(r, "listing_id", ""),
		Page:      utils.QueryInt(r, "page", 1),
		Limit:     utils.QueryInt(r, "limit", 20),
	}

	result, err := h.portfolioRepo.FindAll(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to list portfolio")
		return
	}
	utils.JSONResponse(w, http.StatusOK, result)
}

// GetPortfolioItem handles GET /admin/store/portfolio/{id}
func (h *AdminHandler) GetPortfolioItem(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	item, err := h.portfolioRepo.FindByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "portfolio item not found")
		return
	}
	utils.JSONResponse(w, http.StatusOK, item)
}

// CreatePortfolio handles POST /admin/store/portfolio
func (h *AdminHandler) CreatePortfolio(w http.ResponseWriter, r *http.Request) {
	var input portfolio.CreateInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var listingID *string
	if input.ListingID != "" {
		listingID = &input.ListingID
	}

	item := &portfolio.Item{
		ID:                utils.NewID(),
		ListingID:         listingID,
		Title:             input.Title,
		Description:       input.Description,
		PreviewType:       input.PreviewType,
		PreviewURL:        input.PreviewURL,
		DesktopScreenshot: input.DesktopScreenshot,
		MobileScreenshot:  input.MobileScreenshot,
		ClientName:        input.ClientName,
		TechStack:         input.TechStack,
		IsFeatured:        input.IsFeatured,
		IsActive:          input.IsActive,
	}

	if err := h.portfolioRepo.Create(r.Context(), item); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to create portfolio item")
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "create", "portfolio", item.ID, item.Title, r.RemoteAddr)

	utils.JSONResponse(w, http.StatusCreated, item)
}

// UpdatePortfolio handles PATCH /admin/store/portfolio/{id}
func (h *AdminHandler) UpdatePortfolio(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	existing, err := h.portfolioRepo.FindByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "portfolio item not found")
		return
	}

	var input portfolio.UpdateInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Title != nil {
		existing.Title = *input.Title
	}
	if input.Description != nil {
		existing.Description = *input.Description
	}
	if input.PreviewType != nil {
		existing.PreviewType = *input.PreviewType
	}
	if input.PreviewURL != nil {
		existing.PreviewURL = *input.PreviewURL
	}
	if input.DesktopScreenshot != nil {
		existing.DesktopScreenshot = *input.DesktopScreenshot
	}
	if input.MobileScreenshot != nil {
		existing.MobileScreenshot = *input.MobileScreenshot
	}
	if input.ClientName != nil {
		existing.ClientName = *input.ClientName
	}
	if input.TechStack != nil {
		existing.TechStack = input.TechStack
	}
	if input.IsFeatured != nil {
		existing.IsFeatured = *input.IsFeatured
	}
	if input.IsActive != nil {
		existing.IsActive = *input.IsActive
	}
	if input.SortOrder != nil {
		existing.SortOrder = *input.SortOrder
	}

	if err := h.portfolioRepo.Update(r.Context(), existing); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update portfolio item")
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "update", "portfolio", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, existing)
}

// DeletePortfolio handles DELETE /admin/store/portfolio/{id}
func (h *AdminHandler) DeletePortfolio(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.portfolioRepo.Delete(r.Context(), id); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to delete portfolio item")
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "delete", "portfolio", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "portfolio item deleted"})
}

// AddPortfolioImage handles POST /admin/store/portfolio/{id}/images
func (h *AdminHandler) AddPortfolioImage(w http.ResponseWriter, r *http.Request) {
	portfolioID := chi.URLParam(r, "id")

	var img portfolio.Image
	if err := utils.DecodeJSON(r, &img); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	img.ID = utils.NewID()
	img.PortfolioID = portfolioID

	if err := h.portfolioRepo.AddImage(r.Context(), &img); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to add image")
		return
	}

	utils.JSONResponse(w, http.StatusCreated, img)
}

// DeletePortfolioImage handles DELETE /admin/store/portfolio/{id}/images/{imgId}
func (h *AdminHandler) DeletePortfolioImage(w http.ResponseWriter, r *http.Request) {
	imgID := chi.URLParam(r, "imgId")
	if err := h.portfolioRepo.DeleteImage(r.Context(), imgID); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to delete image")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "image deleted"})
}

// ═══════════════════════════════════════════════════════
// PAYMENT SETTINGS
// ═══════════════════════════════════════════════════════

// GetPaymentSettings handles GET /admin/store/payment/settings
func (h *AdminHandler) GetPaymentSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.paymentRepo.GetAllSettings(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load payment settings")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{"items": settings})
}

// UpdatePaymentSettings handles PATCH /admin/store/payment/settings/{id}
func (h *AdminHandler) UpdatePaymentSettings(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var input payment.UpdateSettingsInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.paymentRepo.UpdateSettings(r.Context(), id, &input); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update payment settings")
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "update", "payment_settings", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "settings updated"})
}

// GetPaymentMethods handles GET /admin/store/payment/methods
func (h *AdminHandler) GetPaymentMethods(w http.ResponseWriter, r *http.Request) {
	methods, err := h.paymentRepo.GetMethods(r.Context(), false)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load payment methods")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{"items": methods})
}

// UpdatePaymentMethod handles PATCH /admin/store/payment/methods/{id}
func (h *AdminHandler) UpdatePaymentMethod(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var input payment.UpdateMethodInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.paymentRepo.UpdateMethod(r.Context(), id, &input); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update payment method")
		return
	}

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "method updated"})
}

// ═══════════════════════════════════════════════════════
// NOTIFICATION TEMPLATES
// ═══════════════════════════════════════════════════════

// GetTemplates handles GET /admin/store/templates
func (h *AdminHandler) GetTemplates(w http.ResponseWriter, r *http.Request) {
	templates, err := h.paymentRepo.GetTemplates(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load templates")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{"items": templates})
}

// UpdateTemplate handles PATCH /admin/store/templates/{id}
func (h *AdminHandler) UpdateTemplate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var input struct {
		Subject  string `json:"subject"`
		Body     string `json:"body"`
		IsActive bool   `json:"is_active"`
	}
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.paymentRepo.UpdateTemplate(r.Context(), id, input.Subject, input.Body, input.IsActive); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update template")
		return
	}

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "template updated"})
}

// ═══════════════════════════════════════════════════════
// REVIEWS MANAGEMENT
// ═══════════════════════════════════════════════════════

// ToggleReview handles PATCH /admin/store/reviews/{id}/toggle
func (h *AdminHandler) ToggleReview(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var input struct {
		Visible bool `json:"visible"`
	}
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.paymentRepo.ToggleReviewVisibility(r.Context(), id, input.Visible); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to toggle review")
		return
	}

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "review updated"})
}

// ═══════════════════════════════════════════════════════
// LISTING CATEGORIES
// ═══════════════════════════════════════════════════════

// ListCategories handles GET /admin/store/categories
func (h *AdminHandler) ListCategories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.listingsRepo.FindAllCategories(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load categories")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{"items": cats})
}
