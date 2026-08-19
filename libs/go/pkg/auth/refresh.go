package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"time"
)

var (
	ErrRefreshReuse     = errors.New("refresh token reuse detected")
	ErrRefreshRevoked   = errors.New("refresh token revoked")
	ErrRefreshExpired   = errors.New("refresh token expired")
	ErrRefreshNotFound  = errors.New("refresh token not found")
	ErrRefreshMalformed = errors.New("refresh token malformed")
)

type RefreshMaterial struct {
	Raw      string
	Hash     string
	FamilyID string
}

func NewRefreshMaterial(familyID string) (RefreshMaterial, error) {
	var raw [32]byte
	if _, err := rand.Read(raw[:]); err != nil {
		return RefreshMaterial{}, err
	}
	if familyID == "" {
		var fam [16]byte
		if _, err := rand.Read(fam[:]); err != nil {
			return RefreshMaterial{}, err
		}
		familyID = hex.EncodeToString(fam[:])
	}
	encoded := base64.RawURLEncoding.EncodeToString(raw[:])
	return RefreshMaterial{Raw: encoded, Hash: HashRefresh(encoded), FamilyID: familyID}, nil
}

func HashRefresh(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func AssertRefreshUsable(revoked bool, expiresAt, now time.Time) error {
	if revoked {
		return ErrRefreshRevoked
	}
	if !expiresAt.After(now) {
		return ErrRefreshExpired
	}
	return nil
}
