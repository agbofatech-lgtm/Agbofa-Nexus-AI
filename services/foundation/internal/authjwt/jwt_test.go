package authjwt

import (
"encoding/base64"
"encoding/json"
"strings"
"testing"
"time"
)

func testConfig(t *testing.T) Config {
t.Helper()
return Config{
HMACKey:    []byte("unit-test-hmac-key-32-bytes-min!!"),
Issuer:     "agbofa-foundation",
Audience:   "agbofa-nexus",
AccessTTL:  time.Hour,
RefreshTTL: 24 * time.Hour,
Now:        func() time.Time { return time.Unix(1_700_000_000, 0).UTC() },
}
}

func validClaims(cfg Config) Claims {
return Claims{
Subject:   "editor",
UserID:    "user-1",
TenantID:  "tenant-1",
Roles:     []string{"EDITOR"},
Issuer:    cfg.Issuer,
Audience:  []string{cfg.Audience},
ExpiresAt: cfg.now().Add(time.Hour).Unix(),
IssuedAt:  cfg.now().Unix(),
TokenID:   "tok-1",
TokenType: TokenTypeAccess,
}
}

func TestA_ValidSignedJWT(t *testing.T) {
cfg := testConfig(t)
token, err := Encode(cfg, validClaims(cfg))
if err != nil {
t.Fatalf("encode: %v", err)
}
got, err := Verify(cfg, token, TokenTypeAccess)
if err != nil {
t.Fatalf("expected valid signed jwt, got %v", err)
}
if got.Subject != "editor" || got.TenantID != "tenant-1" {
t.Fatalf("unexpected claims: %+v", got)
}
}

func TestB_ModifiedPayloadRejected(t *testing.T) {
cfg := testConfig(t)
token, err := Encode(cfg, validClaims(cfg))
if err != nil {
t.Fatalf("encode: %v", err)
}
parts := strings.Split(token, ".")
raw, _ := base64.RawURLEncoding.DecodeString(parts[1])
var payload map[string]any
_ = json.Unmarshal(raw, &payload)
payload["roles"] = []string{"ADMIN"}
modified, _ := json.Marshal(payload)
parts[1] = base64.RawURLEncoding.EncodeToString(modified)
_, err = Verify(cfg, strings.Join(parts, "."), TokenTypeAccess)
if err != ErrInvalidSignature {
t.Fatalf("expected invalid signature after payload mutation, got %v", err)
}
}

func TestC_ModifiedSignatureRejected(t *testing.T) {
cfg := testConfig(t)
token, err := Encode(cfg, validClaims(cfg))
if err != nil {
t.Fatalf("encode: %v", err)
}
parts := strings.Split(token, ".")
parts[2] = base64.RawURLEncoding.EncodeToString([]byte("tampered-signature-bytes"))
_, err = Verify(cfg, strings.Join(parts, "."), TokenTypeAccess)
if err != ErrInvalidSignature {
t.Fatalf("expected invalid signature, got %v", err)
}
}

func TestD_AlgNoneRejected(t *testing.T) {
cfg := testConfig(t)
claims := validClaims(cfg)
payload, _ := json.Marshal(claims)
noneHeader, _ := json.Marshal(map[string]string{"alg": "none", "typ": "JWT"})
token := base64.RawURLEncoding.EncodeToString(noneHeader) + "." + base64.RawURLEncoding.EncodeToString(payload) + "." + base64.RawURLEncoding.EncodeToString([]byte("x"))
_, err := Verify(cfg, token, TokenTypeAccess)
if err != ErrAlgNone {
t.Fatalf("expected alg=none rejection, got %v", err)
}
}

func TestE_UnsupportedAlgorithmRejected(t *testing.T) {
cfg := testConfig(t)
claims := validClaims(cfg)
payload, _ := json.Marshal(claims)
hdr, _ := json.Marshal(map[string]string{"alg": "RS256", "typ": "JWT"})
unsigned := base64.RawURLEncoding.EncodeToString(hdr) + "." + base64.RawURLEncoding.EncodeToString(payload)
sig := sign(cfg.HMACKey, unsigned)
token := unsigned + "." + base64.RawURLEncoding.EncodeToString(sig)
_, err := Verify(cfg, token, TokenTypeAccess)
if err != ErrUnsupportedAlg {
t.Fatalf("expected unsupported algorithm, got %v", err)
}
}

func TestF_ExpiredJWTRejected(t *testing.T) {
cfg := testConfig(t)
claims := validClaims(cfg)
claims.ExpiresAt = cfg.now().Add(-time.Second).Unix()
token, err := Encode(cfg, claims)
if err != nil {
t.Fatalf("encode: %v", err)
}
_, err = Verify(cfg, token, TokenTypeAccess)
if err != ErrTokenExpired {
t.Fatalf("expected expired, got %v", err)
}
}

func TestG_WrongIssuerRejected(t *testing.T) {
cfg := testConfig(t)
claims := validClaims(cfg)
claims.Issuer = "other-issuer"
token, err := Encode(cfg, claims)
if err != nil {
t.Fatalf("encode: %v", err)
}
_, err = Verify(cfg, token, TokenTypeAccess)
if err != ErrInvalidIssuer {
t.Fatalf("expected issuer mismatch, got %v", err)
}
}

func TestH_WrongAudienceRejected(t *testing.T) {
cfg := testConfig(t)
claims := validClaims(cfg)
claims.Audience = []string{"someone-else"}
token, err := Encode(cfg, claims)
if err != nil {
t.Fatalf("encode: %v", err)
}
_, err = Verify(cfg, token, TokenTypeAccess)
if err != ErrInvalidAudience {
t.Fatalf("expected audience mismatch, got %v", err)
}
}

func TestI_MalformedJWTRejected(t *testing.T) {
cfg := testConfig(t)
for _, token := range []string{"", "a", "a.b", "a.b.c.d", "not-a-jwt", "..."} {
if _, err := Verify(cfg, token, TokenTypeAccess); err == nil {
t.Fatalf("expected malformed rejection for %q", token)
}
}
}

func TestJ_MissingToken(t *testing.T) {
cfg := testConfig(t)
_, err := Verify(cfg, "", TokenTypeAccess)
if err != ErrMalformedToken {
t.Fatalf("expected missing/malformed token, got %v", err)
}
}

func TestWrongTokenTypeRejected(t *testing.T) {
cfg := testConfig(t)
access, refresh, expiresIn, err := IssueAccessAndRefresh(cfg, "editor", "user-1", "tenant-1", "tok-9", []string{"EDITOR"})
if err != nil {
t.Fatalf("issue: %v", err)
}
if expiresIn != 3600 {
t.Fatalf("expiresIn=%d", expiresIn)
}
if _, err := Verify(cfg, access, TokenTypeAccess); err != nil {
t.Fatalf("access: %v", err)
}
if _, err := Verify(cfg, refresh, TokenTypeRefresh); err != nil {
t.Fatalf("refresh: %v", err)
}
if _, err := Verify(cfg, access, TokenTypeRefresh); err != ErrInvalidTokenType {
t.Fatalf("access accepted as refresh: %v", err)
}
if _, err := Verify(cfg, refresh, TokenTypeAccess); err != ErrInvalidTokenType {
t.Fatalf("refresh accepted as access: %v", err)
}
}

func TestWeakAndMissingKeysRejected(t *testing.T) {
cfg := testConfig(t)
claims := validClaims(cfg)
cfg.HMACKey = []byte("short")
if _, err := Encode(cfg, claims); err != ErrWeakKey {
t.Fatalf("expected weak key, got %v", err)
}
cfg.HMACKey = nil
if _, err := Verify(cfg, "a.b.c", TokenTypeAccess); err != ErrMissingKey {
t.Fatalf("expected missing key, got %v", err)
}
}