package utils

import "time"

// FormatISO formats a time as ISO 8601 string.
func FormatISO(t time.Time) string {
	return t.UTC().Format(time.RFC3339)
}

// NowUTC returns the current time in UTC.
func NowUTC() time.Time {
	return time.Now().UTC()
}
