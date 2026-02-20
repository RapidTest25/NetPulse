package middleware

import (
	"net/http"
	"time"

	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/rs/zerolog/log"
)

// RequestLogger logs every HTTP request with structured fields.
func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := chimw.NewWrapResponseWriter(w, r.ProtoMajor)

		defer func() {
			log.Info().
				Str("request_id", chimw.GetReqID(r.Context())).
				Str("method", r.Method).
				Str("path", r.URL.Path).
				Int("status", ww.Status()).
				Int("bytes", ww.BytesWritten()).
				Dur("latency", time.Since(start)).
				Str("ip", r.RemoteAddr).
				Msg("request")
		}()

		next.ServeHTTP(ww, r)
	})
}
