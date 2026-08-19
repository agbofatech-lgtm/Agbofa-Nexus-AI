package authn

import (
	"context"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/auth"
	"github.com/agbofa/nexus/libs/go/pkg/config"
	"github.com/agbofa/nexus/services/foundation/internal/domain"
)

type PasswordVerifier struct{}

func (PasswordVerifier) VerifyCredential(_ context.Context, credentialHash, credential string) (bool, error) {
	if err := auth.VerifyPassword(credentialHash, credential); err != nil {
		return false, nil
	}
	return true, nil
}

type TokenService struct {
	cfg     config.JWTConfig
	refresh interface {
		Create(ctx context.Context, token domain.RefreshToken) (domain.RefreshToken, error)
	}
	now func() time.Time
}

func NewTokenService(cfg config.JWTConfig, refresh interface {
	Create(ctx context.Context, token domain.RefreshToken) (domain.RefreshToken, error)
}) *TokenService {
	return &TokenService{cfg: cfg, refresh: refresh, now: time.Now}
}

func (s *TokenService) IssueTokens(ctx context.Context, tenant domain.Tenant, user domain.User) (domain.AuthenticationTokens, error) {
	now := s.now()
	signer, err := auth.NewSigner(s.cfg, now)
	if err != nil {
		return domain.AuthenticationTokens{}, err
	}
	access, _, err := signer.Issue(user.ID, tenant.ID, user.Roles)
	if err != nil {
		return domain.AuthenticationTokens{}, err
	}
	refresh, err := auth.NewRefreshMaterial("")
	if err != nil {
		return domain.AuthenticationTokens{}, err
	}
	if s.refresh != nil {
		if _, err := s.refresh.Create(ctx, domain.RefreshToken{
			UserID: user.ID, TenantID: tenant.ID, TokenHash: refresh.Hash, FamilyID: refresh.FamilyID,
			ExpiresAt: now.Add(s.cfg.RefreshTTL),
		}); err != nil {
			return domain.AuthenticationTokens{}, err
		}
	}
	return domain.AuthenticationTokens{
		AccessToken:  access,
		RefreshToken: refresh.Raw,
		ExpiresIn:    int(s.cfg.AccessTokenTTL.Seconds()),
	}, nil
}
