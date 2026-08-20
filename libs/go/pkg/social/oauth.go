package social

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"net/url"
	"strings"
	"time"
)

type OAuthState struct {
	Raw       string
	Hash      string
	Verifier  string
	Challenge string
	TenantID  string
	UserID    string
	Platform  Platform
	Redirect  string
	ExpiresAt time.Time
}

func NewOAuthState(tenantID, userID string, platform Platform, redirect string, ttl time.Duration) (OAuthState, error) {
	if tenantID == "" || userID == "" {
		return OAuthState{}, ErrMissingState
	}
	if _, ok := Lookup(string(platform)); !ok {
		return OAuthState{}, ErrUnknownPlatform
	}
	if err := validateRedirect(redirect); err != nil {
		return OAuthState{}, err
	}
	raw, err := randomB64(32)
	if err != nil {
		return OAuthState{}, err
	}
	verifier, err := randomB64(32)
	if err != nil {
		return OAuthState{}, err
	}
	sum := sha256.Sum256([]byte(verifier))
	return OAuthState{
		Raw: raw, Hash: HashOpaque(raw), Verifier: verifier,
		Challenge: base64.RawURLEncoding.EncodeToString(sum[:]),
		TenantID:  tenantID, UserID: userID, Platform: platform,
		Redirect: redirect, ExpiresAt: time.Now().UTC().Add(ttl),
	}, nil
}

func HashOpaque(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func ValidateCallback(stored OAuthState, rawState, tenantID, userID string, now time.Time) error {
	if strings.TrimSpace(rawState) == "" {
		return ErrMissingState
	}
	if stored.Hash == "" || stored.Hash != HashOpaque(rawState) {
		return ErrInvalidState
	}
	if !stored.ExpiresAt.After(now) {
		return ErrExpiredState
	}
	if stored.TenantID != tenantID {
		return ErrStateTenant
	}
	if stored.UserID != userID {
		return ErrStateUser
	}
	return nil
}

func AuthorizationURL(spec Spec, clientID, redirect, state, challenge string) (string, error) {
	if clientID == "" {
		return "", ErrTokenUnavailable
	}
	if err := validateRedirect(redirect); err != nil {
		return "", err
	}
	u, err := url.Parse(spec.AuthURL)
	if err != nil {
		return "", err
	}
	q := u.Query()
	q.Set("response_type", "code")
	q.Set("client_id", clientID)
	q.Set("redirect_uri", redirect)
	q.Set("scope", strings.Join(spec.Scopes, " "))
	q.Set("state", state)
	if spec.PKCE {
		q.Set("code_challenge", challenge)
		q.Set("code_challenge_method", "S256")
	}
	u.RawQuery = q.Encode()
	return u.String(), nil
}

func validateRedirect(redirect string) error {
	u, err := url.Parse(redirect)
	if err != nil || u.Scheme == "" || u.Host == "" || u.Fragment != "" {
		return ErrInvalidRedirect
	}
	if u.Scheme != "https" && u.Hostname() != "localhost" && u.Hostname() != "127.0.0.1" {
		return ErrInvalidRedirect
	}
	return nil
}

func randomB64(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("entropy: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}
