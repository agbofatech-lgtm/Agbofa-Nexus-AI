package social

import (
	"testing"
	"time"
)

func TestOAuthStateCSRFMatrix(t *testing.T) {
	st, err := NewOAuthState("tenant-a", "user-1", PlatformX, "https://app.agbofa.tech/api/v1/social/callback", 10*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now().UTC()
	if err := ValidateCallback(st, "", "tenant-a", "user-1", now); err != ErrMissingState {
		t.Fatalf("missing: %v", err)
	}
	if err := ValidateCallback(st, "wrong", "tenant-a", "user-1", now); err != ErrInvalidState {
		t.Fatalf("invalid: %v", err)
	}
	expired := st
	expired.ExpiresAt = now.Add(-time.Minute)
	if err := ValidateCallback(expired, st.Raw, "tenant-a", "user-1", now); err != ErrExpiredState {
		t.Fatalf("expired: %v", err)
	}
	if err := ValidateCallback(st, st.Raw, "tenant-b", "user-1", now); err != ErrStateTenant {
		t.Fatalf("tenant: %v", err)
	}
	if err := ValidateCallback(st, st.Raw, "tenant-a", "user-2", now); err != ErrStateUser {
		t.Fatalf("user: %v", err)
	}
	if err := ValidateCallback(st, st.Raw, "tenant-a", "user-1", now); err != nil {
		t.Fatalf("valid: %v", err)
	}
}

func TestRedirectAndPKCE(t *testing.T) {
	if _, err := NewOAuthState("t", "u", PlatformX, "javascript:alert(1)", time.Minute); err != ErrInvalidRedirect {
		t.Fatalf("open redirect: %v", err)
	}
	spec, _ := Lookup("x")
	u, err := AuthorizationURL(spec, "client", "https://app.agbofa.tech/cb", "state", "challenge")
	if err != nil || u == "" {
		t.Fatal(err)
	}
}

func TestYouTubeCatalogAndGoogleAuthURL(t *testing.T) {
	spec, ok := Lookup("youtube")
	if !ok || spec.ID != PlatformYouTube {
		t.Fatal("youtube must be in the platform catalog")
	}
	if !spec.Supports(CapabilityVideo) {
		t.Fatal("youtube must advertise video")
	}
	u, err := AuthorizationURL(spec, "client", "http://localhost:3000/api/v1/social/callback", "state", "challenge")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(u, "accounts.google.com") || !strings.Contains(u, "access_type=offline") {
		t.Fatalf("google auth url: %s", u)
	}
	if _, err := NewOAuthState("t", "u", PlatformYouTube, "http://localhost:3000/api/v1/social/callback", time.Minute); err != nil {
		t.Fatal(err)
	}
}

func TestTokenBoxRoundTrip(t *testing.T) {
	box, err := NewTokenBox("0123456789abcdef0123456789abcdef")
	if err != nil {
		t.Fatal(err)
	}
	sealed, err := box.Seal("access-token-value")
	if err != nil {
		t.Fatal(err)
	}
	if sealed == "access-token-value" {
		t.Fatal("token stored in plaintext")
	}
	plain, err := box.Open(sealed)
	if err != nil || plain != "access-token-value" {
		t.Fatalf("open: %q %v", plain, err)
	}
}
