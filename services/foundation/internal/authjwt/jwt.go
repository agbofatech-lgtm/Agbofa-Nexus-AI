// Package authjwt implements HS256 JWT issuance and cryptographic verification
// using only the Go standard library.
//
// This is not a decode-only helper. Signature verification happens before
// claims are trusted. alg=none and unsupported algorithms are rejected.
//
// IMP-BFF-AUTH-001
package authjwt

import (
"crypto/hmac"
"crypto/sha256"
"encoding/base64"
"encoding/json"
"errors"
"fmt"
"strings"
"time"
)

const (
AlgorithmHS256   = "HS256"
TokenTypeAccess  = "access"
TokenTypeRefresh = "refresh"
MinHMACKeyBytes  = 32
)

var (
ErrMissingKey       = errors.New("jwt hmac key is required")
ErrWeakKey          = errors.New("jwt hmac key must be at least 32 bytes")
ErrMalformedToken   = errors.New("malformed jwt")
ErrUnsupportedAlg   = errors.New("unsupported jwt algorithm")
ErrAlgNone          = errors.New("jwt alg=none is rejected")
ErrInvalidSignature = errors.New("invalid jwt signature")
ErrTokenExpired     = errors.New("jwt expired")
ErrMissingExpiry    = errors.New("jwt expiration is required")
ErrInvalidIssuer    = errors.New("jwt issuer mismatch")
ErrInvalidAudience  = errors.New("jwt audience mismatch")
ErrInvalidTokenType = errors.New("jwt token type mismatch")
ErrInvalidClaims    = errors.New("jwt claims invalid")
)

// Config is the issuer/audience policy plus the HMAC key from the environment.
type Config struct {
HMACKey    []byte
Issuer     string
Audience   string
AccessTTL  time.Duration
RefreshTTL time.Duration
Now        func() time.Time
}

func (c Config) now() time.Time {
if c.Now != nil {
return c.Now()
}
return time.Now().UTC()
}

func (c Config) validateKey() error {
if len(c.HMACKey) == 0 {
return ErrMissingKey
}
if len(c.HMACKey) < MinHMACKeyBytes {
return ErrWeakKey
}
return nil
}

// Claims is the trusted authentication assertion issued by Foundation.
type Claims struct {
Subject   string   `json:"sub"`
UserID    string   `json:"user_id"`
TenantID  string   `json:"tenant_id"`
Roles     []string `json:"roles"`
Issuer    string   `json:"iss"`
Audience  any      `json:"aud"`
ExpiresAt int64    `json:"exp"`
IssuedAt  int64    `json:"iat"`
TokenID   string   `json:"jti"`
TokenType string   `json:"typ"`
}

func (c Claims) AudienceList() []string {
switch v := c.Audience.(type) {
case string:
if v == "" {
return nil
}
return []string{v}
case []string:
return v
case []any:
out := make([]string, 0, len(v))
for _, item := range v {
s, ok := item.(string)
if ok && s != "" {
out = append(out, s)
}
}
return out
default:
return nil
}
}

type header struct {
Algorithm string `json:"alg"`
Type      string `json:"typ"`
}

func Encode(cfg Config, claims Claims) (string, error) {
if err := cfg.validateKey(); err != nil {
return "", err
}
if claims.ExpiresAt == 0 {
return "", ErrMissingExpiry
}
hdr, err := json.Marshal(header{Algorithm: AlgorithmHS256, Type: "JWT"})
if err != nil {
return "", err
}
payload, err := json.Marshal(claims)
if err != nil {
return "", err
}
unsigned := b64(hdr) + "." + b64(payload)
sig := sign(cfg.HMACKey, unsigned)
return unsigned + "." + b64(sig), nil
}

// Verify cryptographically validates a JWT and then enforces exp/iss/aud/typ.
func Verify(cfg Config, token string, wantType string) (Claims, error) {
if err := cfg.validateKey(); err != nil {
return Claims{}, err
}
if token == "" {
return Claims{}, ErrMalformedToken
}
parts := strings.Split(token, ".")
if len(parts) != 3 || parts[0] == "" || parts[1] == "" || parts[2] == "" {
return Claims{}, ErrMalformedToken
}

rawHeader, err := decodeB64(parts[0])
if err != nil {
return Claims{}, ErrMalformedToken
}
var hdr header
if err := json.Unmarshal(rawHeader, &hdr); err != nil {
return Claims{}, ErrMalformedToken
}
alg := strings.TrimSpace(hdr.Algorithm)
if alg == "" {
return Claims{}, ErrUnsupportedAlg
}
if strings.EqualFold(alg, "none") {
return Claims{}, ErrAlgNone
}
if alg != AlgorithmHS256 {
return Claims{}, ErrUnsupportedAlg
}

expected := sign(cfg.HMACKey, parts[0]+"."+parts[1])
got, err := decodeB64(parts[2])
if err != nil {
return Claims{}, ErrMalformedToken
}
if !hmac.Equal(expected, got) {
return Claims{}, ErrInvalidSignature
}

rawClaims, err := decodeB64(parts[1])
if err != nil {
return Claims{}, ErrMalformedToken
}
var claims Claims
if err := json.Unmarshal(rawClaims, &claims); err != nil {
return Claims{}, ErrMalformedToken
}
if claims.Subject == "" || claims.TenantID == "" || claims.TokenID == "" {
return Claims{}, ErrInvalidClaims
}
if claims.ExpiresAt == 0 {
return Claims{}, ErrMissingExpiry
}
if cfg.now().Unix() >= claims.ExpiresAt {
return Claims{}, ErrTokenExpired
}
if cfg.Issuer != "" && claims.Issuer != cfg.Issuer {
return Claims{}, ErrInvalidIssuer
}
if cfg.Audience != "" && !audienceContains(claims.AudienceList(), cfg.Audience) {
return Claims{}, ErrInvalidAudience
}
if wantType != "" && claims.TokenType != wantType {
return Claims{}, ErrInvalidTokenType
}
return claims, nil
}

func IssueAccessAndRefresh(cfg Config, subject, userID, tenantID, tokenID string, roles []string) (access string, refresh string, expiresIn int, err error) {
if cfg.AccessTTL <= 0 {
cfg.AccessTTL = time.Hour
}
if cfg.RefreshTTL <= 0 {
cfg.RefreshTTL = 7 * 24 * time.Hour
}
now := cfg.now()
copiedRoles := append([]string(nil), roles...)
base := Claims{
Subject:  subject,
UserID:   userID,
TenantID: tenantID,
Roles:    copiedRoles,
Issuer:   cfg.Issuer,
Audience: []string{cfg.Audience},
IssuedAt: now.Unix(),
}
accessClaims := base
accessClaims.ExpiresAt = now.Add(cfg.AccessTTL).Unix()
accessClaims.TokenID = tokenID
accessClaims.TokenType = TokenTypeAccess
refreshClaims := base
refreshClaims.ExpiresAt = now.Add(cfg.RefreshTTL).Unix()
refreshClaims.TokenID = tokenID + "-r"
refreshClaims.TokenType = TokenTypeRefresh

access, err = Encode(cfg, accessClaims)
if err != nil {
return "", "", 0, fmt.Errorf("encode access token: %w", err)
}
refresh, err = Encode(cfg, refreshClaims)
if err != nil {
return "", "", 0, fmt.Errorf("encode refresh token: %w", err)
}
return access, refresh, int(cfg.AccessTTL.Seconds()), nil
}

func sign(key []byte, unsigned string) []byte {
mac := hmac.New(sha256.New, key)
_, _ = mac.Write([]byte(unsigned))
return mac.Sum(nil)
}

func b64(raw []byte) string {
return base64.RawURLEncoding.EncodeToString(raw)
}

func decodeB64(s string) ([]byte, error) {
return base64.RawURLEncoding.DecodeString(s)
}

func audienceContains(list []string, want string) bool {
for _, item := range list {
if item == want {
return true
}
}
return false
}
