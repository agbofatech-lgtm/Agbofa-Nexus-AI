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
	cfg config.JWTConfig
	now func() time.Time
}

func NewTokenService(cfg config.JWTConfig) *TokenService {
	return &TokenService{cfg: cfg, now: time.Now}
}

func (s *TokenService) IssueTokens(_ context.Context, tenant domain.Tenant, user domain.User) (domain.AuthenticationTokens, error) {
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
	return domain.AuthenticationTokens{
		AccessToken:  access,
		RefreshToken: refresh.Raw,
		ExpiresIn:    int(s.cfg.AccessTokenTTL.Seconds()),
	}, nil
}
