package config

import (
	"strings"
	"time"
)

func (k JWTKey) usableAt(at time.Time, requirePrivate bool) error {
	if k.KID == "" {
		return ErrJWTKeyNotUsable
	}
	if !k.NotBefore.IsZero() && at.Before(k.NotBefore) {
		return ErrJWTKeyNotUsable
	}
	if !k.NotAfter.IsZero() && !at.Before(k.NotAfter) {
		return ErrJWTKeyNotUsable
	}
	if k.PublicPEM.Empty() {
		return ErrJWTKeyNotUsable
	}
	if requirePrivate && k.PrivatePEM.Empty() {
		return ErrJWTSigningKeyMissing
	}
	return nil
}

// SigningKey returns the active signing key if it is inside its rotation window.
func (c JWTConfig) SigningKey(at time.Time) (JWTKey, error) {
	for _, key := range c.Keys {
		if key.KID != c.ActiveKID {
			continue
		}
		if !strings.EqualFold(key.Use, KeyUseSign) {
			return JWTKey{}, ErrJWTSigningKeyMissing
		}
		if err := key.usableAt(at, true); err != nil {
			return JWTKey{}, err
		}
		return key, nil
	}
	return JWTKey{}, ErrJWTSigningKeyMissing
}

// VerificationKey returns a key that may verify signatures for kid at time at.
// Retired signing keys remain eligible while their NotAfter window is open.
func (c JWTConfig) VerificationKey(kid string, at time.Time) (JWTKey, error) {
	for _, key := range c.Keys {
		if key.KID != kid {
			continue
		}
		if err := key.usableAt(at, false); err != nil {
			return JWTKey{}, err
		}
		return key, nil
	}
	return JWTKey{}, ErrJWTKeyNotUsable
}

// VerificationKeys returns every key that may verify signatures at time at.
func (c JWTConfig) VerificationKeys(at time.Time) []JWTKey {
	out := make([]JWTKey, 0, len(c.Keys))
	for _, key := range c.Keys {
		if err := key.usableAt(at, false); err != nil {
			continue
		}
		out = append(out, key)
	}
	return out
}

func looksLikePEM(value, hint string) bool {
	trimmed := strings.TrimSpace(value)
	if !strings.Contains(trimmed, "BEGIN") || !strings.Contains(trimmed, "END") {
		return false
	}
	if hint == "" {
		return true
	}
	return strings.Contains(strings.ToUpper(trimmed), strings.ToUpper(hint))
}
