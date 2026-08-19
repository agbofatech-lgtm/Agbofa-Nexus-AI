package config

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestEnvProviderMapsSecretNames(t *testing.T) {
	lookup := mapLookup(map[string]string{
		"AGBOFA_SECRET_DATABASE_URL": "postgres://nexus:" + leakedCredential + "@localhost/nexus",
	})
	provider := NewEnvProvider(lookup)
	secret, err := provider.Get(context.Background(), "database/url")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if secret.Reveal() != "postgres://nexus:"+leakedCredential+"@localhost/nexus" {
		t.Fatal("unexpected secret value")
	}
	if _, err := provider.Get(context.Background(), "missing"); !errors.Is(err, ErrSecretNotFound) {
		t.Fatalf("expected not found, got %v", err)
	}
}

func TestFileProviderReadsNestedAndFlatNames(t *testing.T) {
	root := t.TempDir()

	nestedDir := filepath.Join(root, "jwt", "keys", "k1")
	if err := os.MkdirAll(nestedDir, 0o700); err != nil {
		t.Fatalf("create nested secret directory: %v", err)
	}
	nestedPath := filepath.Join(nestedDir, "public_pem")
	if err := os.WriteFile(nestedPath, []byte(testPublicPEM+"\n"), 0o600); err != nil {
		t.Fatalf("write nested secret file: %v", err)
	}
	if _, err := os.Stat(nestedPath); err != nil {
		t.Fatalf("nested secret file missing at %s: %v", nestedPath, err)
	}

	flatPath := filepath.Join(root, "jwt--keys--k1--private_pem")
	if err := os.WriteFile(flatPath, []byte(testPrivatePEM+"\n"), 0o600); err != nil {
		t.Fatalf("write flat secret file: %v", err)
	}
	if _, err := os.Stat(flatPath); err != nil {
		t.Fatalf("flat secret file missing at %s: %v", flatPath, err)
	}

	provider := NewFileProvider(root, nil)
	secret, err := provider.Get(context.Background(), "jwt/keys/k1/public_pem")
	if err != nil {
		t.Fatalf("get nested: %v", err)
	}
	if secret.Empty() {
		t.Fatal("expected pem")
	}

	flat := NewFileProvider(root, nil)
	got, err := flat.Get(context.Background(), "jwt/keys/k1/private_pem")
	if err != nil {
		t.Fatalf("get flat: %v", err)
	}
	if !strings.Contains(got.Reveal(), "PRIVATE KEY") {
		t.Fatal("expected private pem")
	}
}

func TestFileCandidatesIncludeSlashAndNativeNestedPaths(t *testing.T) {
	provider := NewFileProvider("/secrets", func(string) ([]byte, error) {
		return nil, errors.New("not used")
	})
	candidates, err := provider.fileCandidates("jwt/keys/k1/public_pem")
	if err != nil {
		t.Fatalf("candidates: %v", err)
	}
	if !containsString(candidates, "/secrets/jwt/keys/k1/public_pem") {
		t.Fatalf("missing slash-form nested path in %v", candidates)
	}
	if !containsString(candidates, "/secrets/jwt--keys--k1--public_pem") {
		t.Fatalf("missing slash-form flat path in %v", candidates)
	}
}

func filepathToSlash(name string) string {
	return filepath.ToSlash(name)
}

func containsString(values []string, want string) bool {
	for _, value := range values {
		if value == want {
			return true
		}
	}
	return false
}

func TestFileProviderRejectsTraversal(t *testing.T) {
	provider := NewFileProvider("/secrets", func(string) ([]byte, error) {
		t.Fatal("must not read")
		return nil, nil
	})
	if _, err := provider.Get(context.Background(), "../etc/passwd"); !errors.Is(err, ErrInvalidSecret) {
		t.Fatalf("expected invalid secret, got %v", err)
	}
}

func TestManagedProvidersFailClosed(t *testing.T) {
	cases := []string{"vault", "aws_secrets_manager", "unknown"}
	for _, kind := range cases {
		_, err := NewSecretProvider(ProviderOptions{Kind: kind})
		if err == nil {
			t.Fatalf("expected failure for %s", kind)
		}
		if strings.Contains(err.Error(), leakedCredential) {
			t.Fatalf("provider error leaked secret: %v", err)
		}
		if kind == "unknown" && !errors.Is(err, ErrUnknownProvider) {
			t.Fatalf("expected unknown provider, got %v", err)
		}
		if kind != "unknown" && !errors.Is(err, ErrProviderUnavailable) {
			t.Fatalf("expected unavailable, got %v", err)
		}
	}
}

func TestStaticProviderCannotBeSelectedFromFactory(t *testing.T) {
	if _, err := NewSecretProvider(ProviderOptions{Kind: "static"}); !errors.Is(err, ErrUnknownProvider) {
		t.Fatalf("static must not be selectable, got %v", err)
	}
}
