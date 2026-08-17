package application

import (
	"context"
	"database/sql"
	"fmt"
)

// SetRLSTenantContext sets the PostgreSQL Row-Level Security session parameter
// app.current_tenant before executing database queries in this service.
//
// Authoritative RLS Policy:
//   USING (tenant_id = current_setting('app.current_tenant')::UUID)
func SetRLSTenantContext(ctx context.Context, exec interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}, tenantID string) error {
	if tenantID == "" {
		return fmt.Errorf("tenantID required for RLS app.current_tenant context")
	}
	_, err := exec.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID)
	if err != nil {
		return fmt.Errorf("failed to set RLS app.current_tenant context: %w", err)
	}
	return nil
}
