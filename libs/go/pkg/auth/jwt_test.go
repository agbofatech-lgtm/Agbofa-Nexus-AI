package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"strings"
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/config"
)

func testJWTConfig(t *testing.T, at time.Time) config.JWTConfig {
	t.Helper()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	privPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(priv)})
	pubPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PUBLIC KEY", Bytes: x509.MarshalPKCS1PublicKey(&priv.PublicKey)})
	return config.JWTConfig{
		Issuer:         "https://auth.agbofa.tech",
		Audience:       "agbofa-nexus-ai",
		Algorithm:      "RS256",
		AccessTokenTTL: time.Minute,
		RefreshTTL:     time.Hour,
		ActiveKID:      "k1",
		Keys: []config.JWTKey{{
			KID:        "k1",
			Use:        config.KeyUseSign,
			Algorithm:  config.AlgorithmRS256,
			PrivatePEM: config.NewSecret("priv", string(privPEM)),
			PublicPEM:  config.NewSecret("pub", string(pubPEM)),
		}},
	}
}

func TestJWTRoundTripAndRejects(t *testing.T) {
	at := time.Date(2026, 8, 19, 15, 0, 0, 0, time.UTC)
	cfg := testJWTConfig(t, at)
	signer, err := NewSigner(cfg, at)
	if err != nil {
		t.Fatal(err)
	}
	verifier, err := NewVerifier(cfg, at)
	if err != nil {
		t.Fatal(err)
	}
	token, _, err := signer.Issue("user-1", "tenant-1", []string{"EDITOR"})
	if err != nil {
		t.Fatal(err)
	}
	claims, err := verifier.Verify(token)
	if err != nil {
		t.Fatalf("valid token: %v", err)
	}
	if claims.Subject != "user-1" || claims.TenantID != "tenant-1" {
		t.Fatalf("claims %+v", claims)
	}

	parts := strings.Split(token, ".")
	tampered := parts[0] + "." + parts[1] + "." + base64.RawURLEncoding.EncodeToString([]byte("nope"))
	if _, err := verifier.Verify(tampered); err != ErrInvalidSignature {
		t.Fatalf("tampered: %v", err)
	}

	noneHdr, _ := json.Marshal(map[string]string{"alg": "none", "typ": "JWT", "kid": "k1"})
	noneTok := base64.RawURLEncoding.EncodeToString(noneHdr) + "." + parts[1] + "."
	if _, err := verifier.Verify(noneTok); err != ErrAlgNone {
		t.Fatalf("alg none: %v", err)
	}

	expiredSigner := *signer
	expiredSigner.ttl = -time.Minute
	expired, _, err := expiredSigner.Issue("user-1", "tenant-1", nil)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := verifier.Verify(expired); err != ErrTokenExpired {
		t.Fatalf("expired: %v", err)
	}

	future := *signer
	future.now = func() time.Time { return at.Add(time.Hour) }
	futTok, _, _ := future.Issue("user-1", "tenant-1", nil)
	if _, err := verifier.Verify(futTok); err != ErrTokenNotYetValid {
		t.Fatalf("nbf: %v", err)
	}

	badIss := *verifier
	badIss.iss = "https://evil.example"
	if _, err := badIss.Verify(token); err != ErrInvalidIssuer {
		t.Fatalf("iss: %v", err)
	}
	badAud := *verifier
	badAud.aud = "other"
	if _, err := badAud.Verify(token); err != ErrInvalidAudience {
		t.Fatalf("aud: %v", err)
	}
}

func TestCSRFAndRefreshMaterial(t *testing.T) {
	token, err := NewCSRFToken()
	if err != nil || token == "" {
		t.Fatal(err)
	}
	if err := VerifyCSRF(token, token); err != nil {
		t.Fatal(err)
	}
	if err := VerifyCSRF(token, "nope"); err != ErrCSRF {
		t.Fatalf("csrf: %v", err)
	}
	mat, err := NewRefreshMaterial("")
	if err != nil || HashRefresh(mat.Raw) != mat.Hash {
		t.Fatalf("refresh material: %+v %v", mat, err)
	}
}
