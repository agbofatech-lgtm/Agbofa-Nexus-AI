package application

import "context"

// UnlimitedQuotaManager never exhausts quota (development only).
type UnlimitedQuotaManager struct{}

func NewUnlimitedQuotaManager() *UnlimitedQuotaManager {
return &UnlimitedQuotaManager{}
}

func (m *UnlimitedQuotaManager) ConsumeTokens(ctx context.Context, tenantID string, tokens int) error {
return nil
}

func (m *UnlimitedQuotaManager) GetRemainingQuota(ctx context.Context, tenantID string) (int, error) {
return 1000000, nil
}

// NoopAuditLogger drops audit logs (development only).
type NoopAuditLogger struct{}

func NewNoopAuditLogger() *NoopAuditLogger {
return &NoopAuditLogger{}
}

func (l *NoopAuditLogger) LogEvent(ctx context.Context, tenantID, action, resource, details string) error {
return nil
}
