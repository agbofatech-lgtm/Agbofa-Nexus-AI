package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
)

var ErrCSRF = errors.New("csrf validation failed")

func NewCSRFToken() (string, error) {
	var b [32]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b[:]), nil
}

func VerifyCSRF(cookieValue, headerValue string) error {
	if cookieValue == "" || headerValue == "" {
		return ErrCSRF
	}
	if subtle.ConstantTimeCompare([]byte(cookieValue), []byte(headerValue)) != 1 {
		return ErrCSRF
	}
	return nil
}
