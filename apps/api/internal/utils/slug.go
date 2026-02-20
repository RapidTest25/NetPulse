package utils

import (
	"crypto/rand"
	"encoding/hex"
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

var (
	slugRe      = regexp.MustCompile(`[^a-z0-9]+`)
	multiDashRe = regexp.MustCompile(`-{2,}`)
)

// NewID generates a random 16-byte hex ID.
func NewID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// Slugify converts a title to a URL-friendly slug.
func Slugify(s string) string {
	s = strings.ToLower(s)
	s = norm.NFD.String(s)

	var b strings.Builder
	for _, r := range s {
		if unicode.Is(unicode.Mn, r) {
			continue // strip diacritics
		}
		b.WriteRune(r)
	}
	s = b.String()

	s = slugRe.ReplaceAllString(s, "-")
	s = multiDashRe.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")

	if len(s) > 80 {
		s = s[:80]
		s = strings.TrimRight(s, "-")
	}

	return s
}
