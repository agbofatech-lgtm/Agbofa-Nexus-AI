package identitygrpc_test

import (
"bytes"
"encoding/binary"
"io"
"net/http"
"net/http/httptest"
"strings"
"testing"
"time"

"github.com/agbofa/nexus/services/foundation/internal/application"
"github.com/agbofa/nexus/services/foundation/internal/authjwt"
"github.com/agbofa/nexus/services/foundation/internal/domain"
"github.com/agbofa/nexus/services/foundation/internal/identityproto"
"github.com/agbofa/nexus/services/foundation/internal/infrastructure"
"github.com/agbofa/nexus/services/foundation/internal/transport/identitygrpc"
)

func frame(payload []byte) []byte {
var hdr [5]byte
binary.BigEndian.PutUint32(hdr[1:], uint32(len(payload)))
return append(hdr[:], payload...)
}

func testServer(t *testing.T) (*httptest.Server, application.JWTConfigVerifier) {
t.Helper()
store := infrastructure.NewMemoryIdentityStore()
store.SeedTenantAndUser(domain.Tenant{
ID:     "tenant-1",
Name:   "tenant-default",
Status: domain.TenantStatusActive,
Config: domain.TenantConfig{MaxUsers: 10, AllowedAuthProviders: []string{"email"}},
}, domain.User{
ID:             "user-1",
PrincipalName:  "editor",
CredentialHash: infrastructure.HashCredential("correct-horse"),
Status:         domain.UserStatusActive,
Roles:          []string{"EDITOR"},
})
cfg := authjwt.Config{
HMACKey:    []byte("unit-test-hmac-key-32-bytes-min!!"),
Issuer:     "agbofa-foundation",
Audience:   "agbofa-nexus",
AccessTTL:  time.Hour,
RefreshTTL: 24 * time.Hour,
}
svc := application.NewTenantIdentityService(store, infrastructure.NewSHA256CredentialVerifier(), infrastructure.NewHMACTokenIssuer(cfg, store), infrastructure.NoopEvents{})
verifier := application.JWTConfigVerifier{Config: cfg}
mux := http.NewServeMux()
identitygrpc.NewServer(svc, verifier, store).Register(mux)
return httptest.NewServer(mux), verifier
}

func postRPC(t *testing.T, ts *httptest.Server, method string, payload []byte, extra http.Header) *http.Response {
t.Helper()
req, err := http.NewRequest(http.MethodPost, ts.URL+"/"+identityproto.ServiceName+"/"+method, bytes.NewReader(frame(payload)))
if err != nil {
t.Fatal(err)
}
req.Header.Set("Content-Type", "application/grpc-web+proto")
req.Header.Set("X-Grpc-Web", "1")
for k, vals := range extra {
for _, v := range vals {
req.Header.Set(k, v)
}
}
res, err := http.DefaultClient.Do(req)
if err != nil {
t.Fatal(err)
}
return res
}

func readBody(t *testing.T, res *http.Response) []byte {
t.Helper()
defer res.Body.Close()
body, err := io.ReadAll(res.Body)
if err != nil {
t.Fatal(err)
}
return body
}

func readPayload(t *testing.T, body []byte) []byte {
t.Helper()
if len(body) < 5 {
t.Fatalf("short body %d", len(body))
}
n := binary.BigEndian.Uint32(body[1:5])
return body[5 : 5+n]
}

func grpcStatusOf(body []byte) int {
if len(body) < 5 {
return -1
}
n := int(binary.BigEndian.Uint32(body[1:5]))
offset := 5 + n
if offset+5 > len(body) || body[offset] != 0x80 {
return -1
}
tlen := int(binary.BigEndian.Uint32(body[offset+1 : offset+5]))
trailer := string(body[offset+5 : offset+5+tlen])
for _, line := range strings.Split(trailer, "\r\n") {
if strings.HasPrefix(line, "grpc-status:") {
v := strings.TrimSpace(strings.TrimPrefix(line, "grpc-status:"))
if v == "" {
return -1
}
out := 0
for _, c := range v {
if c < '0' || c > '9' {
return -1
}
out = out*10 + int(c-'0')
}
return out
}
}
return -1
}

func authenticate(t *testing.T, ts *httptest.Server, credential string) identityproto.AuthenticationTokens {
t.Helper()
res := postRPC(t, ts, identityproto.MethodAuthenticateUser, identityproto.MarshalAuthenticateUserRequest(identityproto.AuthenticateUserRequest{
TenantName:    "tenant-default",
PrincipalName: "editor",
Credential:    credential,
}), nil)
body := readBody(t, res)
if grpcStatusOf(body) != 0 {
t.Fatalf("authenticate status %d", grpcStatusOf(body))
}
tokens, err := identityproto.UnmarshalAuthenticationTokens(readPayload(t, body))
if err != nil {
t.Fatal(err)
}
return tokens
}

func TestAuthenticateAndValidateRoundTrip(t *testing.T) {
ts, verifier := testServer(t)
defer ts.Close()
tokens := authenticate(t, ts, "correct-horse")
if tokens.AccessToken == "" {
t.Fatal("missing access token")
}
if bytes.Contains([]byte(tokens.AccessToken), []byte("correct-horse")) {
t.Fatal("credential reflected in access token")
}
if _, err := authjwt.Verify(verifier.Config, tokens.AccessToken, authjwt.TokenTypeAccess); err != nil {
t.Fatalf("signed access: %v", err)
}
vres := postRPC(t, ts, identityproto.MethodValidateToken, identityproto.MarshalValidateTokenRequest(identityproto.ValidateTokenRequest{AccessToken: tokens.AccessToken}), nil)
body := readBody(t, vres)
if grpcStatusOf(body) != 0 {
t.Fatalf("validate status %d", grpcStatusOf(body))
}
claims, err := identityproto.UnmarshalTokenClaims(readPayload(t, body))
if err != nil || claims.Subject != "editor" || claims.TenantID != "tenant-1" {
t.Fatalf("claims: %v %+v", err, claims)
}
}

func TestAuthenticateRejectsBadPassword(t *testing.T) {
ts, _ := testServer(t)
defer ts.Close()
res := postRPC(t, ts, identityproto.MethodAuthenticateUser, identityproto.MarshalAuthenticateUserRequest(identityproto.AuthenticateUserRequest{
TenantName:    "tenant-default",
PrincipalName: "editor",
Credential:    "nope",
}), nil)
body := readBody(t, res)
if grpcStatusOf(body) != 16 {
t.Fatalf("expected unauthenticated, got %d", grpcStatusOf(body))
}
if bytes.Contains(body, []byte("nope")) {
t.Fatal("credential reflected")
}
}

func TestGetTenantRequiresAuthorization(t *testing.T) {
ts, _ := testServer(t)
defer ts.Close()
res := postRPC(t, ts, identityproto.MethodGetTenant, identityproto.MarshalGetTenantRequest(identityproto.GetTenantRequest{ID: "tenant-1"}), nil)
body := readBody(t, res)
if grpcStatusOf(body) != 16 {
t.Fatalf("expected unauthenticated, got %d", grpcStatusOf(body))
}
}

func TestGetTenantEnforcesCallerTenant(t *testing.T) {
ts, _ := testServer(t)
defer ts.Close()
tokens := authenticate(t, ts, "correct-horse")
okRes := postRPC(t, ts, identityproto.MethodGetTenant, identityproto.MarshalGetTenantRequest(identityproto.GetTenantRequest{ID: "tenant-1"}), http.Header{
"Authorization": []string{"Bearer " + tokens.AccessToken},
})
okBody := readBody(t, okRes)
if grpcStatusOf(okBody) != 0 {
t.Fatalf("expected own tenant, got %d", grpcStatusOf(okBody))
}
tenant, err := identityproto.UnmarshalTenant(readPayload(t, okBody))
if err != nil || tenant.ID != "tenant-1" {
t.Fatalf("tenant: %v %+v", err, tenant)
}
deny := postRPC(t, ts, identityproto.MethodGetTenant, identityproto.MarshalGetTenantRequest(identityproto.GetTenantRequest{ID: "other-tenant"}), http.Header{
"Authorization": []string{"Bearer " + tokens.AccessToken},
})
denyBody := readBody(t, deny)
if grpcStatusOf(denyBody) != 16 {
t.Fatalf("expected isolation failure, got %d", grpcStatusOf(denyBody))
}
}

func TestValidateTokenRejectsAlgNone(t *testing.T) {
ts, _ := testServer(t)
defer ts.Close()
none := "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJlZGl0b3IifQ.eA"
res := postRPC(t, ts, identityproto.MethodValidateToken, identityproto.MarshalValidateTokenRequest(identityproto.ValidateTokenRequest{AccessToken: none}), nil)
body := readBody(t, res)
if grpcStatusOf(body) != 16 {
t.Fatalf("expected alg=none rejection, got %d", grpcStatusOf(body))
}
}

func TestRefreshRotates(t *testing.T) {
ts, _ := testServer(t)
defer ts.Close()
tokens := authenticate(t, ts, "correct-horse")
res := postRPC(t, ts, identityproto.MethodRefreshToken, identityproto.MarshalRefreshTokenRequest(identityproto.RefreshTokenRequest{RefreshToken: tokens.RefreshToken}), nil)
body := readBody(t, res)
if grpcStatusOf(body) != 0 {
t.Fatalf("refresh status %d", grpcStatusOf(body))
}
next, err := identityproto.UnmarshalAuthenticationTokens(readPayload(t, body))
if err != nil || next.AccessToken == "" || next.AccessToken == tokens.AccessToken {
t.Fatalf("refresh tokens: %v %+v", err, next)
}
replay := postRPC(t, ts, identityproto.MethodRefreshToken, identityproto.MarshalRefreshTokenRequest(identityproto.RefreshTokenRequest{RefreshToken: tokens.RefreshToken}), nil)
replayBody := readBody(t, replay)
if grpcStatusOf(replayBody) != 16 {
t.Fatalf("expected replay rejection, got %d", grpcStatusOf(replayBody))
}
}