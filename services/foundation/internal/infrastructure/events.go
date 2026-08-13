package infrastructure

import (
"context"
"time"

"github.com/agbofa/nexus/services/foundation/internal/domain"
)

// NoopEvents satisfies application.FoundationEventPublisher without I/O.
type NoopEvents struct{}

func (NoopEvents) PublishTenantProvisioned(context.Context, domain.Tenant) error { return nil }
func (NoopEvents) PublishUserCreated(context.Context, domain.User) error         { return nil }
func (NoopEvents) PublishUserAuthenticated(context.Context, domain.User, time.Time) error {
return nil
}
