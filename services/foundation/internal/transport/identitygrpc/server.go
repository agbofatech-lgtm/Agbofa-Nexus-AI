// Package identitygrpc serves TenantIdentityService as unary protobuf RPCs
// over HTTP/1.1 using gRPC-Web-compatible framing.
//
// This is NOT official grpc-go. There is no grpc.NewServer, no generated
// .pb.go registration, and no HTTP/2 gRPC transport.
//
// IMP-BFF-AUTH-001
package identitygrpc

import (
"context"
"encoding/binary"
"io"
"net/http"
"strings"
"time"

"github.com/agbofa/nexus/services/foundation/internal/application"
"github.com/agbofa/nexus/services/foundation/internal/authjwt"
"github.com/agbofa/nexus/services/foundation/internal/domain"
"github.com/agbofa/nexus/services/foundation/internal/identityproto"
)

const (
grpcStatusOK               = 0
grpcStatusInvalidArgument  = 3
grpcStatusNotFound         = 5
grpcStatusPermissionDenied = 7
grpcStatusInternal         = 13
grpcStatusUnavailable      = 14
grpcStatusUnauthenticated  = 16
)

// Server is the Foundation identity transport.
type Server struct {
identity *application.TenantIdentityService
verifier application.TokenVerifier
lookup   application.IdentityLookup
}

func NewServer(identity *application.TenantIdentityService, verifier application.TokenVerifier, lookup application.IdentityLookup) *Server {
return &Server{identity: identity, verifier: verifier, lookup: lookup}
}

func (s *Server) Register(mux *http.ServeMux) {
prefix := "/" + identityproto.ServiceName + "/"
mux.HandleFunc(prefix, s.serve)
}

// RegisterUnavailable fail-closes every request when identity cannot be wired.
func RegisterUnavailable(mux *http.ServeMux, message string) {
if message == "" {
message = "identity transport unavailable"
}
mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
writeGRPC(w, r, nil, grpcStatusUnauthenticated, message)
})
}

func (s *Server) serve(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodPost {
writeGRPC(w, r, nil, grpcStatusInvalidArgument, "POST required")
return
}
msg, err := readFrame(r.Body)
if err != nil {
writeGRPC(w, r, nil, grpcStatusInvalidArgument, "invalid grpc frame")
return
}
method := r.URL.Path[strings.LastIndex(r.URL.Path, "/")+1:]
ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
defer cancel()

switch method {
case identityproto.MethodAuthenticateUser:
s.authenticate(ctx, w, r, msg)
case identityproto.MethodValidateToken:
s.validate(w, r, msg)
case identityproto.MethodRefreshToken:
s.refresh(ctx, w, r, msg)
case identityproto.MethodGetTenant:
s.getTenant(ctx, w, r, msg)
default:
writeGRPC(w, r, nil, grpcStatusNotFound, "unknown identity rpc")
}
}

func (s *Server) authenticate(ctx context.Context, w http.ResponseWriter, r *http.Request, msg []byte) {
req, err := identityproto.UnmarshalAuthenticateUserRequest(msg)
if err != nil {
writeGRPC(w, r, nil, grpcStatusInvalidArgument, "invalid request")
return
}
tokens, err := s.identity.AuthenticateByName(ctx, req.TenantName, req.PrincipalName, req.Credential)
if err != nil {
writeGRPC(w, r, nil, mapAuthError(err), "authentication failed")
return
}
out := identityproto.MarshalAuthenticationTokens(identityproto.AuthenticationTokens{
AccessToken:  tokens.AccessToken,
RefreshToken: tokens.RefreshToken,
ExpiresIn:    int32(tokens.ExpiresIn),
})
writeGRPC(w, r, out, grpcStatusOK, "")
}

func (s *Server) validate(w http.ResponseWriter, r *http.Request, msg []byte) {
req, err := identityproto.UnmarshalValidateTokenRequest(msg)
if err != nil {
writeGRPC(w, r, nil, grpcStatusInvalidArgument, "invalid request")
return
}
claims, err := s.identity.ValidateAccessToken(s.verifier, req.AccessToken)
if err != nil {
writeGRPC(w, r, nil, grpcStatusUnauthenticated, "invalid token")
return
}
out := identityproto.MarshalTokenClaims(identityproto.TokenClaims{
Subject:  claims.Subject,
TenantID: claims.TenantID,
Roles:    claims.Roles,
Issuer:   claims.Issuer,
Audience: claims.AudienceList(),
TokenID:  claims.TokenID,
})
writeGRPC(w, r, out, grpcStatusOK, "")
}

func (s *Server) refresh(ctx context.Context, w http.ResponseWriter, r *http.Request, msg []byte) {
req, err := identityproto.UnmarshalRefreshTokenRequest(msg)
if err != nil {
writeGRPC(w, r, nil, grpcStatusInvalidArgument, "invalid request")
return
}
tokens, err := s.identity.RefreshAccessToken(ctx, s.verifier, s.lookup, req.RefreshToken)
if err != nil {
writeGRPC(w, r, nil, grpcStatusUnauthenticated, "invalid refresh token")
return
}
out := identityproto.MarshalAuthenticationTokens(identityproto.AuthenticationTokens{
AccessToken:  tokens.AccessToken,
RefreshToken: tokens.RefreshToken,
ExpiresIn:    int32(tokens.ExpiresIn),
})
writeGRPC(w, r, out, grpcStatusOK, "")
}

func (s *Server) getTenant(ctx context.Context, w http.ResponseWriter, r *http.Request, msg []byte) {
req, err := identityproto.UnmarshalGetTenantRequest(msg)
if err != nil {
writeGRPC(w, r, nil, grpcStatusInvalidArgument, "invalid request")
return
}
authorizedTenant := bearerTenant(s, r)
if authorizedTenant == "" {
writeGRPC(w, r, nil, grpcStatusUnauthenticated, "authentication required")
return
}
tenant, err := s.identity.GetTenant(ctx, req.ID, authorizedTenant)
if err != nil {
writeGRPC(w, r, nil, mapAuthError(err), "tenant access denied")
return
}
status := int32(0)
switch tenant.Status {
case domain.TenantStatusSuspended:
status = 1
case domain.TenantStatusDeleted:
status = 2
}
out := identityproto.MarshalTenant(identityproto.Tenant{
ID:        tenant.ID,
Name:      tenant.Name,
Status:    status,
CreatedAt: tenant.CreatedAt.UTC().Format(time.RFC3339),
Config: identityproto.TenantConfig{
DefaultRegion:        tenant.Config.DefaultRegion,
MaxUsers:             int32(tenant.Config.MaxUsers),
AllowedAuthProviders: tenant.Config.AllowedAuthProviders,
},
})
writeGRPC(w, r, out, grpcStatusOK, "")
}

func bearerTenant(s *Server, r *http.Request) string {
authz := r.Header.Get("Authorization")
if !strings.HasPrefix(strings.ToLower(authz), "bearer ") {
return ""
}
token := strings.TrimSpace(authz[7:])
claims, err := s.identity.ValidateAccessToken(s.verifier, token)
if err != nil {
return ""
}
return claims.TenantID
}

func mapAuthError(err error) int {
switch err {
case domain.ErrAuthentication, domain.ErrUserNotActive, domain.ErrTenantSuspended,
authjwt.ErrTokenExpired, authjwt.ErrInvalidSignature, authjwt.ErrAlgNone,
authjwt.ErrMalformedToken, authjwt.ErrUnsupportedAlg, authjwt.ErrInvalidIssuer,
authjwt.ErrInvalidAudience, authjwt.ErrInvalidTokenType, authjwt.ErrMissingExpiry,
authjwt.ErrInvalidClaims, authjwt.ErrMissingKey, authjwt.ErrWeakKey:
return grpcStatusUnauthenticated
default:
return grpcStatusUnauthenticated
}
}

func readFrame(r io.Reader) ([]byte, error) {
var hdr [5]byte
if _, err := io.ReadFull(r, hdr[:]); err != nil {
return nil, err
}
if hdr[0] != 0 {
return nil, identityproto.ErrCodec
}
length := binary.BigEndian.Uint32(hdr[1:])
if length > 1<<20 {
return nil, identityproto.ErrCodec
}
body := make([]byte, length)
if _, err := io.ReadFull(r, body); err != nil {
return nil, err
}
return body, nil
}

func writeGRPC(w http.ResponseWriter, r *http.Request, payload []byte, status int, message string) {
ct := r.Header.Get("Content-Type")
web := strings.Contains(ct, "grpc-web") || r.Header.Get("X-Grpc-Web") == "1"
if payload == nil {
payload = []byte{}
}
if web {
w.Header().Set("Content-Type", "application/grpc-web+proto")
w.WriteHeader(http.StatusOK)
var hdr [5]byte
binary.BigEndian.PutUint32(hdr[1:], uint32(len(payload)))
_, _ = w.Write(hdr[:])
_, _ = w.Write(payload)
trailer := []byte("grpc-status:" + itoa(status) + "\r\ngrpc-message:" + message + "\r\n")
var th [5]byte
th[0] = 0x80
binary.BigEndian.PutUint32(th[1:], uint32(len(trailer)))
_, _ = w.Write(th[:])
_, _ = w.Write(trailer)
return
}
w.Header().Set("Content-Type", "application/grpc")
w.Header().Set("Grpc-Status", itoa(status))
w.Header().Set("Grpc-Message", message)
w.WriteHeader(http.StatusOK)
var hdr [5]byte
binary.BigEndian.PutUint32(hdr[1:], uint32(len(payload)))
_, _ = w.Write(hdr[:])
_, _ = w.Write(payload)
}

func itoa(v int) string {
if v == 0 {
return "0"
}
neg := v < 0
if neg {
v = -v
}
var buf [16]byte
i := len(buf)
for v > 0 {
i--
buf[i] = byte('0' + v%10)
v /= 10
}
if neg {
i--
buf[i] = '-'
}
return string(buf[i:])
}
