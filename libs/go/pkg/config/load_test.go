package config

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"
	"time"
)

const (
	testPrivatePEM = "-----BEGIN PRIVATE KEY-----\nTESTONLY_NOT_A_REAL_KEY\n-----END PRIVATE KEY-----"
	testPublicPEM  = "-----BEGIN PUBLIC KEY-----\nTESTONLY_NOT_A_REAL_KEY\n-----END PUBLIC KEY-----"
	testDBURL      = "postgres://nexus:super-secret-password-xyz@db.internal:5432/nexus?sslmode=disable"
)

func mapLookup(values map[string]string) LookupFunc {
	return func(key string) (string, bool) {
		value, ok := values[key]
		return value, ok
	}
}

func validEnv(env string) map[string]string {
	return map[string]string{
		"AGBOFA_ENV":                      env,
		"AGBOFA_SERVICE_NAME":             "foundation",
		"AGBOFA_JWT_ISSUER":               "https://auth.agbofa.tech",
		"AGBOFA_JWT_AUDIENCE":             "agbofa-nexus-ai",
		"AGBOFA_JWT_ALGORITHM":            "RS256",
		"AGBOFA_JWT_ACTIVE_KID":           "k1",
		"AGBOFA_JWT_KEYS":                 "k1,k0",
		"AGBOFA_JWT_KEY_K0_USE":           "verify",
		"AGBOFA_COOKIE_SECURE":            "true",
		"AGBOFA_COOKIE_HTTPONLY":          "true",
		"AGBOFA_COOKIE_SAMESITE":          "Lax",
		"AGBOFA_COOKIE_PATH":              "/",
		"AGBOFA_CORS_ALLOWED_ORIGINS":     "https://app.agbofa.tech",
		"AGBOFA_SECRET_DATABASE_URL":      testDBURL,
		"AGBOFA_SECRET_JWT_KEYS_K1_PRIVATE_PEM": testPrivatePEM,
		"AGBOFA_SECRET_JWT_KEYS_K1_PUBLIC_PEM":  testPublicPEM,
		"AGBOFA_SECRET_JWT_KEYS_K0_PUBLIC_PEM":  testPublicPEM,
	}
}

func TestLoadProductionSucceeds(t *testing.T) {
	cfg, err := Load(context.Background(), LoadOptions{Lookup: mapLookup(validEnv("production"))})
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if cfg.Environment != EnvProduction {
		t.Fatalf("env=%s", cfg.Environment)
	}
	if cfg.JWT.ActiveKID != "k1" {
		t.Fatalf("active kid=%s", cfg.JWT.ActiveKID)
	}
	if _, err := cfg.JWT.SigningKey(time.Now()); err != nil {
		t.Fatalf("signing key: %v", err)
	}
	if got := cfg.JWT.VerificationKeys(time.Now()); len(got) != 2 {
		t.Fatalf("expected two verification keys, got %d", len(got))
	}
	if ContainsSecret(cfg.Database.URL.String(), cfg.Database.URL) {
		t.Fatal("database secret formatted unsafely")
	}
}

func TestLoadMissingRequiredConfiguration(t *testing.T) {
	cases := []struct {
		name  string
		clear string
		field string
	}{
		{name: "env", clear: "AGBOFA_ENV", field: "AGBOFA_ENV"},
		{name: "issuer", clear: "AGBOFA_JWT_ISSUER", field: "AGBOFA_JWT_ISSUER"},
		{name: "audience", clear: "AGBOFA_JWT_AUDIENCE", field: "AGBOFA_JWT_AUDIENCE"},
		{name: "database", clear: "AGBOFA_SECRET_DATABASE_URL", field: "database/url"},
		{name: "signing", clear: "AGBOFA_SECRET_JWT_KEYS_K1_PRIVATE_PEM", field: "jwt/keys/k1/private_pem"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			values := validEnv("production")
			delete(values, tc.clear)
			_, err := Load(context.Background(), LoadOptions{Lookup: mapLookup(values)})
			if err == nil {
				t.Fatal("expected error")
			}
			var cfgErr *Error
			if !errors.As(err, &cfgErr) {
				t.Fatalf("expected config.Error, got %T %v", err, err)
			}
			if cfgErr.Field != tc.field {
				t.Fatalf("field=%s want %s (%v)", cfgErr.Field, tc.field, err)
			}
			if strings.Contains(err.Error(), leakedCredential) || strings.Contains(err.Error(), testPrivatePEM) {
				t.Fatalf("error leaked secret: %v", err)
			}
		})
	}
}

func TestLoadMalformedConfiguration(t *testing.T) {
	cases := map[string]string{
		"AGBOFA_ENV":                   "lab",
		"AGBOFA_JWT_ACCESS_TTL":        "soon",
		"AGBOFA_DATABASE_MAX_CONNS":    "many",
		"AGBOFA_COOKIE_SAMESITE":       "Sometimes",
		"AGBOFA_JWT_ISSUER":            "not-a-uri",
		"AGBOFA_JWT_KEY_K1_NOT_BEFORE": "yesterday",
	}
	for key, value := range cases {
		t.Run(key, func(t *testing.T) {
			values := validEnv("production")
			values[key] = value
			_, err := Load(context.Background(), LoadOptions{Lookup: mapLookup(values)})
			if err == nil {
				t.Fatal("expected malformed error")
			}
			if !errors.Is(err, ErrMalformed) && !errors.Is(err, ErrUnknownEnvironment) && !errors.Is(err, ErrMissingRequired) && !errors.Is(err, ErrUnsafeConfiguration) {
				t.Fatalf("unexpected error class: %v", err)
			}
		})
	}
}

func TestLoadRejectsInvalidSecretMaterial(t *testing.T) {
	values := validEnv("production")
	values["AGBOFA_SECRET_JWT_KEYS_K1_PRIVATE_PEM"] = "not-a-pem"
	_, err := Load(context.Background(), LoadOptions{Lookup: mapLookup(values)})
	if err == nil || !errors.Is(err, ErrInvalidSecret) {
		t.Fatalf("expected invalid secret, got %v", err)
	}
	if strings.Contains(err.Error(), "not-a-pem") {
		t.Fatalf("error included raw secret material: %v", err)
	}
}

func TestEnvironmentSeparationCookieAndIssuer(t *testing.T) {
	dev := validEnv("development")
	dev["AGBOFA_COOKIE_SECURE"] = "false"
	dev["AGBOFA_JWT_ISSUER"] = "http://localhost:8080"
	if _, err := Load(context.Background(), LoadOptions{Lookup: mapLookup(dev)}); err != nil {
		t.Fatalf("development should allow localhost http and insecure cookies: %v", err)
	}

	prod := validEnv("production")
	prod["AGBOFA_COOKIE_SECURE"] = "false"
	if _, err := Load(context.Background(), LoadOptions{Lookup: mapLookup(prod)}); err == nil {
		t.Fatal("production must reject insecure cookies")
	}

	prod = validEnv("production")
	prod["AGBOFA_JWT_ISSUER"] = "http://auth.internal"
	if _, err := Load(context.Background(), LoadOptions{Lookup: mapLookup(prod)}); err == nil {
		t.Fatal("production must reject http issuer")
	}
}

func TestLoadRejectsAlgNone(t *testing.T) {
	values := validEnv("production")
	values["AGBOFA_JWT_ALGORITHM"] = "none"
	_, err := Load(context.Background(), LoadOptions{Lookup: mapLookup(values)})
	if err == nil || !errors.Is(err, ErrUnsafeConfiguration) {
		t.Fatalf("expected unsafe alg=none, got %v", err)
	}
}

func TestLoadRejectsWildcardCORSInProduction(t *testing.T) {
	values := validEnv("production")
	values["AGBOFA_CORS_ALLOWED_ORIGINS"] = "*"
	if _, err := Load(context.Background(), LoadOptions{Lookup: mapLookup(values)}); err == nil {
		t.Fatal("expected wildcard CORS rejection")
	}
}

func TestLoadRejectsUnavailableManagedProvider(t *testing.T) {
	values := validEnv("production")
	values["AGBOFA_SECRET_PROVIDER"] = "vault"
	_, err := Load(context.Background(), LoadOptions{Lookup: mapLookup(values)})
	if err == nil || !errors.Is(err, ErrProviderUnavailable) {
		t.Fatalf("expected provider unavailable, got %v", err)
	}
}

func TestJWTRotationWindow(t *testing.T) {
	now := time.Date(2026, 8, 19, 12, 0, 0, 0, time.UTC)
	values := validEnv("production")
	values["AGBOFA_JWT_KEY_K1_NOT_BEFORE"] = "2026-01-01T00:00:00Z"
	values["AGBOFA_JWT_KEY_K1_NOT_AFTER"] = "2026-12-31T00:00:00Z"
	values["AGBOFA_JWT_KEY_K0_NOT_BEFORE"] = "2025-01-01T00:00:00Z"
	values["AGBOFA_JWT_KEY_K0_NOT_AFTER"] = "2026-09-01T00:00:00Z"
	cfg, err := Load(context.Background(), LoadOptions{
		Lookup: mapLookup(values),
		Now:    func() time.Time { return now },
	})
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if _, err := cfg.JWT.VerificationKey("k0", now); err != nil {
		t.Fatalf("retired key should still verify inside window: %v", err)
	}

	values["AGBOFA_JWT_KEY_K1_NOT_AFTER"] = "2026-01-01T00:00:00Z"
	if _, err := Load(context.Background(), LoadOptions{
		Lookup: mapLookup(values),
		Now:    func() time.Time { return now },
	}); err == nil {
		t.Fatal("expired active signing key must fail startup")
	}
}

func TestPublicSnapshotAndJSONOmitSecrets(t *testing.T) {
	cfg, err := Load(context.Background(), LoadOptions{Lookup: mapLookup(validEnv("production"))})
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	raw, err := json.Marshal(cfg.PublicSnapshot())
	if err != nil {
		t.Fatalf("snapshot json: %v", err)
	}
	text := string(raw)
	if strings.Contains(text, leakedCredential) || strings.Contains(text, "PRIVATE KEY") || strings.Contains(text, testDBURL) {
		t.Fatalf("snapshot leaked secret: %s", text)
	}
	if !strings.Contains(text, `"jwt_issuer":"https://auth.agbofa.tech"`) {
		t.Fatalf("snapshot missing non-secret fields: %s", text)
	}
}
