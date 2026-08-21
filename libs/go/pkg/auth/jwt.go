package auth

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/config"
)

var (
	ErrInvalidToken     = errors.New("invalid token")
	ErrAlgNone          = errors.New("alg=none is forbidden")
	ErrUnknownKID       = errors.New("unknown kid")
	ErrInvalidIssuer    = errors.New("invalid issuer")
	ErrInvalidAudience  = errors.New("invalid audience")
	ErrTokenExpired     = errors.New("token expired")
	ErrTokenNotYetValid = errors.New("token not yet valid")
	ErrInvalidSignature = errors.New("invalid signature")
	ErrInvalidAlgorithm = errors.New("invalid algorithm")
)

type Claims struct {
	Issuer    string   `json:"iss"`
	Audience  string   `json:"aud"`
	Subject   string   `json:"sub"`
	TenantID  string   `json:"tenant_id"`
	Roles     []string `json:"roles"`
	ID        string   `json:"jti"`
	IssuedAt  int64    `json:"iat"`
	NotBefore int64    `json:"nbf"`
	ExpiresAt int64    `json:"exp"`
}

type header struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
	KID string `json:"kid"`
}

type Signer struct {
	iss, aud, kid string
	key           *rsa.PrivateKey
	ttl           time.Duration
	now           func() time.Time
}

type Verifier struct {
	iss, aud string
	keys     map[string]*rsa.PublicKey
	now      func() time.Time
}

func NewSigner(cfg config.JWTConfig, at time.Time) (*Signer, error) {
	key, err := cfg.SigningKey(at)
	if err != nil {
		return nil, err
	}
	priv, err := parseRSAPrivate(key.PrivatePEM.Reveal())
	if err != nil {
		return nil, err
	}
	return &Signer{
		iss: cfg.Issuer,
		aud: cfg.Audience,
		kid: key.KID,
		key: priv,
		ttl: cfg.AccessTokenTTL,
		now: func() time.Time { return time.Now().UTC() },
	}, nil
}

func NewVerifier(cfg config.JWTConfig, at time.Time) (*Verifier, error) {
	keys := map[string]*rsa.PublicKey{}
	for _, key := range cfg.VerificationKeys(at) {
		pub, err := parseRSAPublic(key.PublicPEM.Reveal())
		if err != nil {
			return nil, fmt.Errorf("kid %s: %w", key.KID, err)
		}
		keys[key.KID] = pub
	}
	if len(keys) == 0 {
		return nil, ErrUnknownKID
	}
	// `at` selects which keys are in their rotation window at construction.
	// nbf/exp MUST use wall clock. Freezing now at process start rejects every
	// token issued after Compose (nbf > startup) with ErrTokenNotYetValid.
	return &Verifier{iss: cfg.Issuer, aud: cfg.Audience, keys: keys, now: func() time.Time { return time.Now().UTC() }}, nil
}

func (s *Signer) Issue(subject, tenantID string, roles []string) (string, Claims, error) {
	now := s.now()
	jti, err := randomID()
	if err != nil {
		return "", Claims{}, err
	}
	claims := Claims{
		Issuer:    s.iss,
		Audience:  s.aud,
		Subject:   subject,
		TenantID:  tenantID,
		Roles:     append([]string(nil), roles...),
		ID:        jti,
		IssuedAt:  now.Unix(),
		NotBefore: now.Unix(),
		ExpiresAt: now.Add(s.ttl).Unix(),
	}
	token, err := signRS256(s.kid, s.key, claims)
	return token, claims, err
}

func (v *Verifier) Verify(token string) (Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return Claims{}, ErrInvalidToken
	}
	rawHeader, err := b64(parts[0])
	if err != nil {
		return Claims{}, ErrInvalidToken
	}
	var hdr header
	if err := json.Unmarshal(rawHeader, &hdr); err != nil {
		return Claims{}, ErrInvalidToken
	}
	alg := strings.ToUpper(hdr.Alg)
	if alg == "NONE" || alg == "" {
		return Claims{}, ErrAlgNone
	}
	if alg != "RS256" {
		return Claims{}, ErrInvalidAlgorithm
	}
	pub, ok := v.keys[hdr.KID]
	if !ok {
		return Claims{}, ErrUnknownKID
	}
	sig, err := b64(parts[2])
	if err != nil {
		return Claims{}, ErrInvalidSignature
	}
	sum := sha256.Sum256([]byte(parts[0] + "." + parts[1]))
	if err := rsa.VerifyPKCS1v15(pub, crypto.SHA256, sum[:], sig); err != nil {
		return Claims{}, ErrInvalidSignature
	}
	rawClaims, err := b64(parts[1])
	if err != nil {
		return Claims{}, ErrInvalidToken
	}
	var claims Claims
	if err := json.Unmarshal(rawClaims, &claims); err != nil {
		return Claims{}, ErrInvalidToken
	}
	now := v.now().Unix()
	if claims.Issuer != v.iss {
		return Claims{}, ErrInvalidIssuer
	}
	if claims.Audience != v.aud {
		return Claims{}, ErrInvalidAudience
	}
	if claims.ExpiresAt <= now {
		return Claims{}, ErrTokenExpired
	}
	if claims.NotBefore > now {
		return Claims{}, ErrTokenNotYetValid
	}
	if claims.Subject == "" || claims.TenantID == "" {
		return Claims{}, ErrInvalidToken
	}
	return claims, nil
}

func signRS256(kid string, key *rsa.PrivateKey, claims Claims) (string, error) {
	hdr, err := json.Marshal(header{Alg: "RS256", Typ: "JWT", KID: kid})
	if err != nil {
		return "", err
	}
	payload, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	unsigned := b64e(hdr) + "." + b64e(payload)
	sum := sha256.Sum256([]byte(unsigned))
	sig, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, sum[:])
	if err != nil {
		return "", err
	}
	return unsigned + "." + b64e(sig), nil
}

func parseRSAPrivate(pemData string) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode([]byte(pemData))
	if block == nil {
		return nil, errors.New("invalid private pem")
	}
	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}
	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	key, ok := parsed.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("not an rsa private key")
	}
	return key, nil
}

func parseRSAPublic(pemData string) (*rsa.PublicKey, error) {
	block, _ := pem.Decode([]byte(pemData))
	if block == nil {
		return nil, errors.New("invalid public pem")
	}
	if key, err := x509.ParsePKCS1PublicKey(block.Bytes); err == nil {
		return key, nil
	}
	parsed, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	key, ok := parsed.(*rsa.PublicKey)
	if !ok {
		return nil, errors.New("not an rsa public key")
	}
	return key, nil
}

func b64e(in []byte) string {
	return base64.RawURLEncoding.EncodeToString(in)
}

func b64(in string) ([]byte, error) {
	return base64.RawURLEncoding.DecodeString(in)
}

func randomID() (string, error) {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return fmt.Sprintf("%x", b[:]), nil
}
