package domain

import (
	"errors"
	"strings"
	"time"
)

type TenantStatus string

const (
	TenantStatusActive    TenantStatus = "ACTIVE"
	TenantStatusSuspended TenantStatus = "SUSPENDED"
	TenantStatusDeleted   TenantStatus = "DELETED"
)

type UserStatus string

const (
	UserStatusActive                UserStatus = "ACTIVE"
	UserStatusDisabled              UserStatus = "DISABLED"
	UserStatusPasswordResetRequired UserStatus = "PASSWORD_RESET_REQUIRED"
)

type TenantConfig struct {
	DefaultRegion        string
	MaxUsers             int
	AllowedAuthProviders []string
}

type Tenant struct {
	ID        string
	Name      string
	Status    TenantStatus
	Config    TenantConfig
	CreatedAt time.Time
	UpdatedAt time.Time
}

type User struct {
	ID             string
	TenantID       string
	PrincipalName  string
	CredentialHash string
	Status         UserStatus
	Roles          []string
	CreatedAt      time.Time
	LastLoginAt    *time.Time
}

type AuthenticationTokens struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int
}

type RefreshToken struct {
	ID        string
	UserID    string
	TenantID  string
	TokenHash string
	FamilyID  string
	ExpiresAt time.Time
	Revoked   bool
	UsedAt    *time.Time
	CreatedAt time.Time
}

var (
	ErrInvalidTenantConfig = errors.New("invalid tenant configuration")
	ErrTenantSuspended     = errors.New("tenant suspended")
	ErrTenantConflict      = errors.New("tenant already active")
	ErrAuthentication      = errors.New("authentication failed")
	ErrUserNotActive       = errors.New("user is not active")
	ErrNotFound            = errors.New("not found")
)

func (c TenantConfig) Validate() error {
	if c.MaxUsers <= 0 {
		return ErrInvalidTenantConfig
	}
	for _, provider := range c.AllowedAuthProviders {
		if strings.EqualFold(provider, "email") {
			return nil
		}
	}
	return ErrInvalidTenantConfig
}
