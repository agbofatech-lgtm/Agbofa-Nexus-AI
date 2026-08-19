package database

import "context"

type tenantCtxKey struct{}

// WithTenant attaches a trusted tenant ID to ctx. Callers must never pass a
// client-supplied tenant ID without prior authorization.
func WithTenant(ctx context.Context, tenantID string) context.Context {
	return context.WithValue(ctx, tenantCtxKey{}, tenantID)
}

func TenantFromContext(ctx context.Context) (string, bool) {
	value, ok := ctx.Value(tenantCtxKey{}).(string)
	if !ok || value == "" {
		return "", false
	}
	return value, true
}
