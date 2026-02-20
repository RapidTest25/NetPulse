package admin

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type MediaHandler struct {
	mediaRepo *postgres.MediaRepo
	auditRepo *postgres.AuditRepo
	uploadDir string
	baseURL   string
}

func NewMediaHandler(mediaRepo *postgres.MediaRepo, auditRepo *postgres.AuditRepo, baseURL string) *MediaHandler {
	uploadDir := "./uploads"
	_ = os.MkdirAll(uploadDir, 0o755)
	return &MediaHandler{
		mediaRepo: mediaRepo,
		auditRepo: auditRepo,
		uploadDir: uploadDir,
		baseURL:   baseURL,
	}
}

// List returns all media items with optional filtering.
func (h *MediaHandler) List(w http.ResponseWriter, r *http.Request) {
	page := utils.QueryInt(r, "page", 1)
	limit := utils.QueryInt(r, "per_page", 30)
	search := utils.QueryString(r, "search", "")
	mimeFilter := utils.QueryString(r, "type", "")

	items, total, err := h.mediaRepo.FindAll(r.Context(), search, mimeFilter, page, limit)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load media")
		return
	}

	totalPages := (total + limit - 1) / limit
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"items":       items,
		"total":       total,
		"page":        page,
		"per_page":    limit,
		"total_pages": totalPages,
	})
}

// Upload handles file upload via multipart form.
func (h *MediaHandler) Upload(w http.ResponseWriter, r *http.Request) {
	// Limit to 10MB
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "file too large (max 10MB)")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		utils.JSONError(w, http.StatusBadRequest, "file required")
		return
	}
	defer file.Close()

	// Validate mime type
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowedExts := map[string]string{
		".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
		".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
		".mp4": "video/mp4", ".webm": "video/webm",
		".pdf": "application/pdf",
	}
	mimeType, ok := allowedExts[ext]
	if !ok {
		utils.JSONError(w, http.StatusBadRequest, "tipe file tidak diizinkan")
		return
	}

	// Generate unique filename
	ts := time.Now().Format("20060102-150405")
	safeName := strings.ReplaceAll(strings.TrimSuffix(header.Filename, ext), " ", "-")
	filename := fmt.Sprintf("%s-%s%s", ts, safeName, ext)

	// Create uploads directory (by year/month)
	subDir := time.Now().Format("2006/01")
	fullDir := filepath.Join(h.uploadDir, subDir)
	_ = os.MkdirAll(fullDir, 0o755)

	dst, err := os.Create(filepath.Join(fullDir, filename))
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to save file")
		return
	}
	defer dst.Close()

	written, err := io.Copy(dst, file)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to write file")
		return
	}

	url := fmt.Sprintf("%s/uploads/%s/%s", h.baseURL, subDir, filename)
	userID := middleware.GetUserID(r)

	item, err := h.mediaRepo.Create(r.Context(), header.Filename, url, mimeType, written, userID)
	if err != nil {
		fmt.Printf("[MEDIA] failed to record media: userID=%s, file=%s, err=%v\n", userID, header.Filename, err)
		utils.JSONError(w, http.StatusInternalServerError, fmt.Sprintf("failed to record media: %v", err))
		return
	}

	_ = h.auditRepo.Log(r.Context(), userID, "upload", "media", item.ID, header.Filename, r.RemoteAddr)

	utils.JSONResponse(w, http.StatusCreated, item)
}

// Delete removes a media item and its file.
func (h *MediaHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	item, err := h.mediaRepo.FindByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "media not found")
		return
	}

	// Try to delete the physical file
	urlPath := strings.TrimPrefix(item.URL, h.baseURL)
	filePath := filepath.Join(".", urlPath)
	_ = os.Remove(filePath)

	if err := h.mediaRepo.Delete(r.Context(), id); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to delete media")
		return
	}

	userID := middleware.GetUserID(r)
	_ = h.auditRepo.Log(r.Context(), userID, "delete", "media", id, item.Filename, r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "deleted"})
}
