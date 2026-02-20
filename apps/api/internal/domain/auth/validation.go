package auth

import (
	"errors"
	"strings"
	"unicode"
)

// Common passwords blacklist (simplified).
var commonPasswords = map[string]bool{
	"password":     true, "12345678":     true, "qwerty12":     true,
	"password1":    true, "admin123":     true, "letmein1":     true,
	"welcome1":     true, "monkey12":     true, "dragon12":     true,
	"master12":     true, "abc12345":     true, "iloveyou":     true,
	"trustno1":     true, "sunshine":     true, "princess":     true,
	"football":     true, "charlie1":     true, "shadow12":     true,
	"michael1":     true, "passw0rd":     true, "p@ssw0rd":     true,
	"qwerty123":    true, "password1234": true, "1234567890":   true,
}

// ValidatePassword enforces strong password policy:
// - min 8 chars
// - at least 1 uppercase
// - at least 1 lowercase
// - at least 1 digit
// - at least 1 symbol
// - not in common passwords list
func ValidatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	if len(password) > 128 {
		return errors.New("password must not exceed 128 characters")
	}

	var hasUpper, hasLower, hasDigit, hasSymbol bool
	for _, ch := range password {
		switch {
		case unicode.IsUpper(ch):
			hasUpper = true
		case unicode.IsLower(ch):
			hasLower = true
		case unicode.IsDigit(ch):
			hasDigit = true
		case unicode.IsPunct(ch) || unicode.IsSymbol(ch):
			hasSymbol = true
		}
	}

	if !hasUpper {
		return errors.New("password must contain at least one uppercase letter")
	}
	if !hasLower {
		return errors.New("password must contain at least one lowercase letter")
	}
	if !hasDigit {
		return errors.New("password must contain at least one digit")
	}
	if !hasSymbol {
		return errors.New("password must contain at least one symbol")
	}

	if commonPasswords[strings.ToLower(password)] {
		return errors.New("password is too common, please choose a different one")
	}

	return nil
}

// ValidateEmail performs basic email validation.
func ValidateEmail(email string) error {
	if len(email) < 5 || len(email) > 254 {
		return errors.New("invalid email address")
	}
	at := strings.LastIndex(email, "@")
	if at < 1 || at >= len(email)-4 {
		return errors.New("invalid email format")
	}
	domain := email[at+1:]
	if !strings.Contains(domain, ".") {
		return errors.New("invalid email domain")
	}
	return nil
}

// ValidateName checks name constraints.
func ValidateName(name string) error {
	name = strings.TrimSpace(name)
	if len(name) < 2 {
		return errors.New("name must be at least 2 characters")
	}
	if len(name) > 100 {
		return errors.New("name must not exceed 100 characters")
	}
	return nil
}
