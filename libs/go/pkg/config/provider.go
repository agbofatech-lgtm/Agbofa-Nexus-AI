package config

import (
	"context"
	"fmt"
	"os"
	"strings"
)

// SecretProvider resolves named secrets. Implementations must not log values.
type SecretProvider interface {
	Name() string
	Get(ctx context.Context, name string) (Secret, error)
}

// LookupFunc is an environment lookup, typically os.LookupEnv.
type LookupFunc func(key string) (string, bool)

// FileReader reads secret files. The default is os.ReadFile.
type FileReader func(name string) ([]byte, error)

// ProviderOptions configure factory construction.
type ProviderOptions struct {
	Kind   string
	Lookup LookupFunc
	Dir    string
	Read   FileReader
}

// NewSecretProvider constructs a provider. Unwired managed backends fail closed.
func NewSecretProvider(opts ProviderOptions) (SecretProvider, error) {
	kind := strings.ToLower(strings.TrimSpace(opts.Kind))
	if kind == "" {
		kind = "env"
	}
	switch kind {
	case "env", "environment":
		return NewEnvProvider(opts.Lookup), nil
	case "file":
		return NewFileProvider(opts.Dir, opts.Read), nil
	case "static":
		return nil, fmt.Errorf("%w: static provider cannot be selected from runtime configuration", ErrUnknownProvider)
	case "aws_secrets_manager", "aws", "secretsmanager":
		return nil, fmt.Errorf("%w: aws_secrets_manager is reserved and not wired; refusing simulated secrets", ErrProviderUnavailable)
	case "vault", "hashicorp_vault":
		return nil, fmt.Errorf("%w: vault is reserved and not wired; refusing simulated secrets", ErrProviderUnavailable)
	default:
		return nil, fmt.Errorf("%w: %s", ErrUnknownProvider, kind)
	}
}

// EnvProvider reads secrets from process environment variables.
//
// Name "database/url" maps to AGBOFA_SECRET_DATABASE_URL.
type EnvProvider struct {
	lookup LookupFunc
}

func NewEnvProvider(lookup LookupFunc) *EnvProvider {
	if lookup == nil {
		lookup = os.LookupEnv
	}
	return &EnvProvider{lookup: lookup}
}

func (p *EnvProvider) Name() string { return "env" }

func (p *EnvProvider) Get(_ context.Context, name string) (Secret, error) {
	key := envSecretKey(name)
	value, ok := p.lookup(key)
	if !ok || strings.TrimSpace(value) == "" {
		return Secret{}, fmt.Errorf("%w: %s", ErrSecretNotFound, name)
	}
	return NewSecret(name, value), nil
}

func envSecretKey(name string) string {
	normalized := strings.ToUpper(name)
	normalized = strings.NewReplacer("/", "_", "-", "_", ".", "_").Replace(normalized)
	return "AGBOFA_SECRET_" + normalized
}

// StaticProvider is a test-only in-memory provider. It must not be selected
// via production environment configuration.
type StaticProvider struct {
	values map[string]string
}

func NewStaticProvider(values map[string]string) *StaticProvider {
	copied := make(map[string]string, len(values))
	for k, v := range values {
		copied[k] = v
	}
	return &StaticProvider{values: copied}
}

func (p *StaticProvider) Name() string { return "static" }

func (p *StaticProvider) Get(_ context.Context, name string) (Secret, error) {
	value, ok := p.values[name]
	if !ok || strings.TrimSpace(value) == "" {
		return Secret{}, fmt.Errorf("%w: %s", ErrSecretNotFound, name)
	}
	return NewSecret(name, value), nil
}
