package application_test

import (
"context"
"testing"
"time"

"github.com/agbofa/nexus/services/foundation/internal/application"
"github.com/agbofa/nexus/services/foundation/internal/authjwt"
"github.com/agbofa/nexus/services/foundation/internal/domain"
"github.com/agbofa/nexus/services/foundation/internal/infrastructure"
)

func testStack(t *testing.T) (*application.TenantIdentityService, *infrastructure.MemoryIdentityStore, application.JWTConfigVerifier) {
t.Helper()
store := infrastructure.NewMemoryIdentityStore()
store.SeedTenantAndUser(domain.Tenant{
ID:     "tenant-1",
Name:   "tenant-default",
Status: domain.TenantStatusActive,
Config: domain.TenantConfig{MaxUsers: 10, AllowedAuthProviders: []string{"email"}},
}, domain.User{
ID:             "user-1",
TenantID:       "tenant-1",
PrincipalName:  "editor",
CredentialHash: infrastructure.HashCredential("correct-horse"),
Status:         domain.UserStatusActive,
Roles:          []string{"EDITOR", "ANALYST"},
})
cfg := authjwt.Config{
HMACKey:    []byte("unit-test-hmac-key-32-bytes-min!!"),
Issuer:     "agbofa-foundation",
Audience:   "agbofa-nexus",
AccessTTL:  time.Hour,
RefreshTTL: 24 * time.Hour,
}
svc := application.NewTenantIdentityService(store, infrastructure.NewSHA256CredentialVerifier(), infrastructure.NewHMACTokenIssuer(cfg, store), infrastructure.NoopEvents{})
return svc, store, application.JWTConfigVerifier{Config: cfg}
}

func TestAuthenticateByNameRejectsBadCredential(t *testing.T) {
svc, _, _ := testStack(t)
_, err := svc.AuthenticateByName(context.Background(), "tenant-default", "editor", "wrong")
if err != domain.ErrAuthentication {
t.Fatalf("expected authentication failure, got %v", err)
}
}

func TestAuthenticateByNameIssuesSignedTokens(t *testing.T) {
svc, _, verifier := testStack(t)
tokens, err := svc.AuthenticateByName(context.Background(), "tenant-default", "editor", "correct-horse")
if err != nil {
t.Fatalf("authenticate: %v", err)
}
if tokens.AccessToken == "" || tokens.RefreshToken == "" {
t.Fatal("expected tokens")
}
claims, err := svc.ValidateAccessToken(verifier, tokens.AccessToken)
if err != nil {
t.Fatalf("validate: %v", err)
}
if claims.Subject != "editor" || claims.TenantID != "tenant-1" {
t.Fatalf("claims %+v", claims)
}
if _, err := svc.ValidateAccessToken(verifier, tokens.RefreshToken); err != authjwt.ErrInvalidTokenType {
t.Fatalf("refresh accepted as access: %v", err)
}
}

func TestRefreshRotatesAndRejectsReplay(t *testing.T) {
svc, store, verifier := testStack(t)
tokens, err := svc.AuthenticateByName(context.Background(), "tenant-default", "editor", "correct-horse")
if err != nil {
t.Fatalf("authenticate: %v", err)
}
next, err := svc.RefreshAccessToken(context.Background(), verifier, store, tokens.RefreshToken)
if err != nil {
t.Fatalf("refresh: %v", err)
}
if next.AccessToken == "" || next.AccessToken == tokens.AccessToken {
t.Fatal("expected new access token")
}
if _, err := svc.RefreshAccessToken(context.Background(), verifier, store, tokens.RefreshToken); err != domain.ErrAuthentication {
t.Fatalf("replay should fail, got %v", err)
}
}

func TestGetTenantEnforcesCallerTenant(t *testing.T) {
svc, _, _ := testStack(t)
if _, err := svc.GetTenant(context.Background(), "tenant-1", "other"); err != domain.ErrAuthentication {
t.Fatalf("expected isolation failure, got %v", err)
}
got, err := svc.GetTenant(context.Background(), "tenant-1", "tenant-1")
if err != nil || got == nil || got.Name != "tenant-default" {
t.Fatalf("get tenant: %v %+v", err, got)
}
}