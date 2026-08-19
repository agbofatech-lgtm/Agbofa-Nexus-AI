package config

import (
	"strings"
	"testing"
)

func TestRedactRemovesCredentialShapes(t *testing.T) {
	input := strings.Join([]string{
		"postgres://nexus:" + leakedCredential + "@localhost/nexus",
		"password=" + leakedCredential,
		"Bearer abcdef0123456789",
		testPrivatePEM,
	}, " ")
	out := Redact(input)
	if strings.Contains(out, leakedCredential) {
		t.Fatalf("password remained: %s", out)
	}
	if strings.Contains(out, "BEGIN PRIVATE KEY") {
		t.Fatalf("pem remained: %s", out)
	}
	if strings.Contains(out, "abcdef0123456789") {
		t.Fatalf("bearer token remained: %s", out)
	}
	if !strings.Contains(out, redacted) {
		t.Fatalf("expected redaction markers: %s", out)
	}
}

func TestContainsSecret(t *testing.T) {
	secret := NewSecret("x", leakedCredential)
	if !ContainsSecret("wrap "+leakedCredential+" end", secret) {
		t.Fatal("expected detection")
	}
	if ContainsSecret("wrap [REDACTED] end", secret) {
		t.Fatal("redacted text is not the secret")
	}
}
