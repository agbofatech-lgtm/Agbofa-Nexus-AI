package application

import (
	"context"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/foundation/internal/domain"
)

type TenantRepository interface {
	FindTenantByName(ctx context.Context, name string) (*domain.Tenant, error)
	CreateTenant(ctx context.Context, tenant domain.Tenant) (domain.Tenant, error)
	CreateUser(ctx context.Context, user domain.User) (domain.User, error)
	FindUserByPrincipal(ctx context.Context, tenantID string, principalName string) (*domain.User, error)
	RecordLogin(ctx context.Context, userID string, occurredAt time.Time) error
}

type CredentialVerifier interface {
	VerifyCredential(ctx context.Context, credentialHash string, credential string) (bool, error)
}

type TokenIssuer interface {
	IssueTokens(ctx context.Context, tenant domain.Tenant, user domain.User) (domain.AuthenticationTokens, error)
}

type FoundationEventPublisher interface {
	PublishTenantProvisioned(ctx context.Context, tenant domain.Tenant) error
	PublishUserCreated(ctx context.Context, user domain.User) error
	PublishUserAuthenticated(ctx context.Context, user domain.User, occurredAt time.Time) error
}

type TenantIdentityService struct {
	repository TenantRepository
	verifier   CredentialVerifier
	tokens     TokenIssuer
	events     FoundationEventPublisher
	now        func() time.Time
}

func NewTenantIdentityService(repository TenantRepository, verifier CredentialVerifier, tokens TokenIssuer, events FoundationEventPublisher) *TenantIdentityService {
	return &TenantIdentityService{repository: repository, verifier: verifier, tokens: tokens, events: events, now: time.Now}
}

func (s *TenantIdentityService) ProvisionTenant(ctx context.Context, name string, config domain.TenantConfig, bootstrapPrincipal string) (domain.Tenant, domain.User, error) {
	if err := config.Validate(); err != nil {
		return domain.Tenant{}, domain.User{}, fmt.Errorf("validate tenant config: %w", err)
	}
	existing, err := s.repository.FindTenantByName(ctx, name)
	if err != nil {
		return domain.Tenant{}, domain.User{}, fmt.Errorf("find tenant by name: %w", err)
	}
	if existing != nil {
		if existing.Status == domain.TenantStatusSuspended {
			return domain.Tenant{}, domain.User{}, domain.ErrTenantSuspended
		}
		return domain.Tenant{}, domain.User{}, domain.ErrTenantConflict
	}
	tenant, err := s.repository.CreateTenant(ctx, domain.Tenant{Name: name, Status: domain.TenantStatusActive, Config: config})
	if err != nil {
		return domain.Tenant{}, domain.User{}, fmt.Errorf("create tenant: %w", err)
	}
	user, err := s.repository.CreateUser(ctx, domain.User{TenantID: tenant.ID, PrincipalName: bootstrapPrincipal, Status: domain.UserStatusPasswordResetRequired, Roles: []string{"TENANT_ADMIN"}})
	if err != nil {
		return domain.Tenant{}, domain.User{}, fmt.Errorf("create bootstrap user: %w", err)
	}
	if err := s.events.PublishTenantProvisioned(ctx, tenant); err != nil {
		return domain.Tenant{}, domain.User{}, fmt.Errorf("publish tenant provisioned: %w", err)
	}
	if err := s.events.PublishUserCreated(ctx, user); err != nil {
		return domain.Tenant{}, domain.User{}, fmt.Errorf("publish user created: %w", err)
	}
	return tenant, user, nil
}

func (s *TenantIdentityService) AuthenticateUser(ctx context.Context, tenant domain.Tenant, principalName string, credential string) (domain.AuthenticationTokens, error) {
	if tenant.Status != domain.TenantStatusActive {
		return domain.AuthenticationTokens{}, domain.ErrTenantSuspended
	}
	user, err := s.repository.FindUserByPrincipal(ctx, tenant.ID, principalName)
	if err != nil {
		return domain.AuthenticationTokens{}, fmt.Errorf("find user: %w", err)
	}
	if user == nil {
		return domain.AuthenticationTokens{}, domain.ErrAuthentication
	}
	if user.Status != domain.UserStatusActive {
		return domain.AuthenticationTokens{}, domain.ErrUserNotActive
	}
	valid, err := s.verifier.VerifyCredential(ctx, user.CredentialHash, credential)
	if err != nil {
		return domain.AuthenticationTokens{}, fmt.Errorf("verify credential: %w", err)
	}
	if !valid {
		return domain.AuthenticationTokens{}, domain.ErrAuthentication
	}
	tokens, err := s.tokens.IssueTokens(ctx, tenant, *user)
	if err != nil {
		return domain.AuthenticationTokens{}, fmt.Errorf("issue tokens: %w", err)
	}
	occurredAt := s.now()
	if err := s.repository.RecordLogin(ctx, user.ID, occurredAt); err != nil {
		return domain.AuthenticationTokens{}, fmt.Errorf("record login: %w", err)
	}
	if err := s.events.PublishUserAuthenticated(ctx, *user, occurredAt); err != nil {
		return domain.AuthenticationTokens{}, fmt.Errorf("publish user authenticated: %w", err)
	}
	return tokens, nil
}
