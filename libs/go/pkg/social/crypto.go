package social

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"strings"
)

// TokenBox encrypts OAuth tokens at rest with AES-256-GCM.
type TokenBox struct {
	gcm cipher.AEAD
}

func NewTokenBox(keyMaterial string) (*TokenBox, error) {
	key, err := parseKey(keyMaterial)
	if err != nil {
		return nil, err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	return &TokenBox{gcm: gcm}, nil
}

func (b *TokenBox) Seal(plaintext string) (string, error) {
	if b == nil {
		return "", errors.New("social: token box not configured")
	}
	nonce := make([]byte, b.gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	out := b.gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.RawStdEncoding.EncodeToString(out), nil
}

func (b *TokenBox) Open(ciphertext string) (string, error) {
	if b == nil {
		return "", errors.New("social: token box not configured")
	}
	raw, err := base64.RawStdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}
	ns := b.gcm.NonceSize()
	if len(raw) < ns {
		return "", errors.New("social: ciphertext too short")
	}
	plain, err := b.gcm.Open(nil, raw[:ns], raw[ns:], nil)
	if err != nil {
		return "", err
	}
	return string(plain), nil
}

func parseKey(raw string) ([]byte, error) {
	raw = normalizeKeyMaterial(raw)
	if raw == "" {
		return nil, errors.New("social: token encryption key required")
	}
	if decoded, err := hex.DecodeString(raw); err == nil {
		if len(decoded) == 32 {
			return decoded, nil
		}
		return nil, fmt.Errorf("social: token key hex decoded to %d bytes, want 32", len(decoded))
	}
	if decoded, err := base64.StdEncoding.DecodeString(raw); err == nil && len(decoded) == 32 {
		return decoded, nil
	}
	if decoded, err := base64.RawStdEncoding.DecodeString(raw); err == nil && len(decoded) == 32 {
		return decoded, nil
	}
	if len(raw) == 32 {
		return []byte(raw), nil
	}
	return nil, fmt.Errorf("social: token key must be 32 bytes (64 hex chars or base64); chars=%d", len(raw))
}

// normalizeKeyMaterial strips wrapping that Windows/.env files often add.
// It does not accept a shorter or longer cryptographic key.
func normalizeKeyMaterial(raw string) string {
	raw = strings.TrimSpace(raw)
	raw = strings.TrimPrefix(raw, "\uFEFF")
	raw = strings.TrimSpace(raw)
	if len(raw) >= 2 {
		if (raw[0] == '"' && raw[len(raw)-1] == '"') || (raw[0] == '\'' && raw[len(raw)-1] == '\'') {
			raw = strings.TrimSpace(raw[1 : len(raw)-1])
		}
	}
	if strings.HasPrefix(raw, "0x") || strings.HasPrefix(raw, "0X") {
		raw = raw[2:]
	}
	raw = strings.Map(func(r rune) rune {
		switch r {
		case ' ', '\t', '\n', '\r', '-':
			return -1
		default:
			return r
		}
	}, raw)
	return raw
}
