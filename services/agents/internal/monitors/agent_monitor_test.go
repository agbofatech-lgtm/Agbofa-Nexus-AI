package monitors

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type mockClient struct {
	signals []domain.MonitorSignal
	err     error
}

func (m *mockClient) FetchSignals(ctx context.Context, tenantID string, platform domain.PlatformSource, keywords []string) ([]domain.MonitorSignal, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.signals, nil
}

type mockRateLimiter struct {
	allow     bool
	remaining int
	err       error
}

func (m *mockRateLimiter) Allow(ctx context.Context, platform domain.PlatformSource, tenantID string) (bool, error) {
	return m.allow, m.err
}

func (m *mockRateLimiter) Remaining(ctx context.Context, platform domain.PlatformSource, tenantID string) (int, error) {
	return m.remaining, m.err
}

func TestPlatformMonitorAgentScanSuccess(t *testing.T) {
	tenantID := "tenant-alpha"
	client := &mockClient{
		signals: []domain.MonitorSignal{
			{SignalID: "sig-1", TenantID: tenantID, Author: "@news", Content: "Test content"},
		},
	}
	limiter := &mockRateLimiter{allow: true, remaining: 999}

	agent := NewTwitterMonitor(tenantID, client, limiter)
	signals, err := agent.Scan(context.Background(), tenantID, []string{"ai"})
	if err != nil {
		t.Fatalf("expected successful scan, got %v", err)
	}
	if len(signals) != 1 || signals[0].SignalID != "sig-1" {
		t.Fatalf("unexpected signals result: %v", signals)
	}
}

func TestPlatformMonitorAgentCrossTenantViolation(t *testing.T) {
	tenantID := "tenant-alpha"
	client := &mockClient{}
	limiter := &mockRateLimiter{allow: true, remaining: 999}

	agent := NewTwitterMonitor(tenantID, client, limiter)
	_, err := agent.Scan(context.Background(), "tenant-beta", []string{"ai"})
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}
}

func TestPlatformMonitorAgentRateLimitExceeded(t *testing.T) {
	tenantID := "tenant-alpha"
	client := &mockClient{}
	limiter := &mockRateLimiter{allow: false, remaining: 0}

	agent := NewFacebookMonitor(tenantID, client, limiter)
	_, err := agent.Scan(context.Background(), tenantID, []string{"tech"})
	if !errors.Is(err, domain.ErrRateLimitExceeded) {
		t.Fatalf("expected ErrRateLimitExceeded, got %v", err)
	}
}

func TestCreateAllMonitorsCount(t *testing.T) {
	tenantID := "tenant-alpha"
	client := &mockClient{}
	limiter := &mockRateLimiter{allow: true, remaining: 100}

	all := CreateAllMonitors(tenantID, client, limiter)
	if len(all) != 8 {
		t.Fatalf("expected 8 monitors (AGT-001 through AGT-008), got %d", len(all))
	}
	expectedIDs := []string{"AGT-001", "AGT-002", "AGT-003", "AGT-004", "AGT-005", "AGT-006", "AGT-007", "AGT-008"}
	for _, id := range expectedIDs {
		if _, ok := all[id]; !ok {
			t.Fatalf("expected agent id %s in monitor registry", id)
		}
	}
}
