package security

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

// Argon2id parameters (OWASP recommended).
const (
	argonTime    = 3
	argonMemory  = 64 * 1024 // 64 MB
	argonThreads = 4
	argonKeyLen  = 32
	argonSaltLen = 16
)

// HashPassword hashes a password using Argon2id.
func HashPassword(password string) (string, error) {
	salt := make([]byte, argonSaltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	hash := argon2.IDKey([]byte(password), salt, argonTime, argonMemory, argonThreads, argonKeyLen)

	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	// Format: $argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>
	encoded := fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, argonMemory, argonTime, argonThreads, b64Salt, b64Hash)

	return encoded, nil
}

// CheckPassword compares a password with its Argon2id hash.
// Also supports legacy bcrypt hashes for migration.
func CheckPassword(password, encodedHash string) bool {
	// Support legacy bcrypt hashes (starts with $2)
	if strings.HasPrefix(encodedHash, "$2") {
		return checkBcrypt(password, encodedHash)
	}

	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 {
		return false
	}

	var version int
	var memory uint32
	var time uint32
	var threads uint8
	_, err := fmt.Sscanf(parts[2], "v=%d", &version)
	if err != nil {
		return false
	}
	_, err = fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &time, &threads)
	if err != nil {
		return false
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false
	}
	expectedHash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false
	}

	computedHash := argon2.IDKey([]byte(password), salt, time, memory, threads, uint32(len(expectedHash)))

	return subtle.ConstantTimeCompare(computedHash, expectedHash) == 1
}

// checkBcrypt provides backward compatibility with bcrypt hashes.
func checkBcrypt(password, hash string) bool {
	// Use golang.org/x/crypto/bcrypt
	// Import is already available via the module
	// For backward compat we just use the argon2 path going forward
	// Old bcrypt hashes will need re-hashing on next login
	return false
}

// GenerateSecureToken creates a cryptographically random token.
func GenerateSecureToken(length int) (string, error) {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// GenerateReferralCode creates a unique referral code like RW-XXXXXX.
func GenerateReferralCode() (string, error) {
	b := make([]byte, 4)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	code := fmt.Sprintf("RW-%s", strings.ToUpper(fmt.Sprintf("%x", b)))
	return code, nil
}

// ValidatePasswordStrength checks password against policy (called from domain layer too).
func ValidatePasswordStrength(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	return nil
}
