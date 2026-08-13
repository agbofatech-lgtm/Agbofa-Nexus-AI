package application

import (
"context"
"fmt"

"github.com/agbofa/nexus/services/foundation/internal/authjwt"
"github.com/agbofa/nexus/services/foundation/internal/domain"
)

// TokenVerifier is implemented by the HS256 JWT verifier.
type TokenVerifier interface {
Verify(token string, wantType string) (authjwt.Claims, error)
}

// JWTConfigVerifier adapts authjwt.Config to TokenVerifier.
type JWTConfigVerifier struct {
Config authjwt.Config
}

func (v JWTConfigVerifier) Verify(token string, wantType string) (authjwt.Claims, error) {
return authjwt.Verify(v.Config, token, wantType)
}

// AuthenticateByName looks up the tenant then delegates to AuthenticateUser.
func (s *TenantIdentityService) AuthenticateByName(ctx context.Context, tenantName, principalName, credential string) (domain.AuthenticationTokens, error) {
if tenantName == "" || principalName == "" || credential == "" {
return domain.AuthenticationTokens{}, domain.ErrAuthentication
}
tenant, err := s.repository.FindTenantByName(ctx, tenantName)
if err != nil {
return domain.AuthenticationTokens{}, fmt.Errorf("find tenant: %w", err)
}
if tenant == nil {
return domain.AuthenticationTokens{}, domain.ErrAuthentication
}
return s.AuthenticateUser(ctx, *tenant, principalName, credential)
}

// GetTenant returns a tenant by id. authorizedTenantID must match id.
func (s *TenantIdentityService) GetTenant(ctx context.Context, id, authorizedTenantID string) (*domain.Tenant, error) {
if id == "" {
return nil, domain.ErrAuthentication
}
if authorizedTenantID == "" || authorizedTenantID != id {
return nil, domain.ErrAuthentication
}
tenant, err := s.repository.FindTenantByID(ctx, id)
if err != nil {
return nil, fmt.Errorf("find tenant by id: %w", err)
}
if tenant == nil {
return nil, domain.ErrAuthentication
}
return tenant, nil
}

// ValidateAccessToken cryptographically verifies an access JWT.
func (s *TenantIdentityService) ValidateAccessToken(verifier TokenVerifier, accessToken string) (authjwt.Claims, error) {
if verifier == nil {
return authjwt.Claims{}, authjwt.ErrMissingKey
}
return verifier.Verify(accessToken, authjwt.TokenTypeAccess)
}

// RefreshAccessToken validates a refresh JWT, consumes the stored refresh hash, and issues a new pair.
func (s *TenantIdentityService) RefreshAccessToken(ctx context.Context, verifier TokenVerifier, lookup IdentityLookup, refreshToken string) (domain.AuthenticationTokens, error) {
if verifier == nil || lookup == nil {
return domain.AuthenticationTokens{}, domain.ErrAuthentication
}
claims, err := verifier.Verify(refreshToken, authjwt.TokenTypeRefresh)
if err != nil {
return domain.AuthenticationTokens{}, domain.ErrAuthentication
}
userID, tenantID, ok := lookup.ConsumeRefreshToken(ctx, refreshToken)
if !ok || userID == "" || tenantID == "" || tenantID != claims.TenantID {
return domain.AuthenticationTokens{}, domain.ErrAuthentication
}
user, err := lookup.FindUserByID(ctx, userID)
if err != nil || user == nil {
return domain.AuthenticationTokens{}, domain.ErrAuthentication
}
tenant, err := s.repository.FindTenantByID(ctx, tenantID)
if err != nil || tenant == nil {
return domain.AuthenticationTokens{}, domain.ErrAuthentication
}
if tenant.Status != domain.TenantStatusActive || user.Status != domain.UserStatusActive {
return domain.AuthenticationTokens{}, domain.ErrAuthentication
}
return s.tokens.IssueTokens(ctx, *tenant, *user)
}
