package domain

import "testing"

func TestTenantConfigValidateRequiresPositiveMaxUsers(t *testing.T) {
	config := TenantConfig{MaxUsers: 0, AllowedAuthProviders: []string{"email"}}
	if err := config.Validate(); err != ErrInvalidTenantConfig {
		t.Fatalf("expected invalid tenant config, got %v", err)
	}
}

func TestTenantConfigValidateRequiresEmailProvider(t *testing.T) {
	config := TenantConfig{MaxUsers: 1, AllowedAuthProviders: []string{"sso"}}
	if err := config.Validate(); err != ErrInvalidTenantConfig {
		t.Fatalf("expected invalid tenant config, got %v", err)
	}
}

func TestTenantConfigValidateAcceptsEmailProvider(t *testing.T) {
	config := TenantConfig{MaxUsers: 1, AllowedAuthProviders: []string{"sso", "email"}}
	if err := config.Validate(); err != nil {
		t.Fatalf("expected config to be valid, got %v", err)
	}
}
