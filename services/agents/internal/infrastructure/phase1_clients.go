package infrastructure

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type Phase1GRPCClients struct {
	mu        sync.RWMutex
	endpoints map[string]string
	conns     map[string]*grpc.ClientConn
}

func NewPhase1GRPCClients(endpoints map[string]string) *Phase1GRPCClients {
	if endpoints == nil {
		endpoints = make(map[string]string)
	}
	defaults := map[string]string{
		"content-factory": "CONTENT_FACTORY_GRPC_ADDR",
		"compliance":      "COMPLIANCE_GRPC_ADDR",
		"distribution":    "DISTRIBUTION_GRPC_ADDR",
		"analytics":       "ANALYTICS_GRPC_ADDR",
		"operations":      "OPERATIONS_GRPC_ADDR",
	}
	for svc, envKey := range defaults {
		if _, ok := endpoints[svc]; !ok {
			addr := os.Getenv(envKey)
			if addr == "" {
				addr = "localhost:9090"
			}
			endpoints[svc] = addr
		}
	}
	return &Phase1GRPCClients{
		endpoints: endpoints,
		conns:     make(map[string]*grpc.ClientConn),
	}
}

func (c *Phase1GRPCClients) getConn(ctx context.Context, service string) (*grpc.ClientConn, error) {
	c.mu.RLock()
	conn, ok := c.conns[service]
	c.mu.RUnlock()
	if ok && conn != nil {
		return conn, nil
	}

	c.mu.Lock()
	defer c.mu.Unlock()
	if conn, ok := c.conns[service]; ok && conn != nil {
		return conn, nil
	}

	addr, exists := c.endpoints[service]
	if !exists || addr == "" {
		return nil, fmt.Errorf("no endpoint configured for service %s: %w", service, domain.ErrServiceUnavailable)
	}

	dialCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	newConn, err := grpc.DialContext(dialCtx, addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
	)
	if err != nil {
		log.Printf("ERROR [Phase1GRPCClients]: failed to dial service %s at %s: %v", service, addr, err)
		return nil, fmt.Errorf("connection to %s failed: %w", service, domain.ErrServiceUnavailable)
	}

	c.conns[service] = newConn
	return newConn, nil
}

func (c *Phase1GRPCClients) RouteToContentFactory(ctx context.Context, tenantID, storyID string, metadata map[string]string) error {
	if tenantID == "" || storyID == "" {
		return domain.ErrCrossTenantViolation
	}

	reqCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	conn, err := c.getConn(reqCtx, "content-factory")
	if err != nil {
		return err
	}

	type factoryReq struct {
		TenantID string            `json:"tenant_id"`
		StoryID  string            `json:"story_id"`
		Metadata map[string]string `json:"metadata"`
	}
	reqBytes, _ := json.Marshal(factoryReq{TenantID: tenantID, StoryID: storyID, Metadata: metadata})
	var respBytes []byte

	err = conn.Invoke(reqCtx, "/content_factory.v1.ContentFactoryService/IngestStory", reqBytes, &respBytes)
	if err != nil {
		log.Printf("ERROR [Phase1GRPCClients]: RouteToContentFactory RPC failed: %v", err)
		return fmt.Errorf("RouteToContentFactory failed: %w", domain.ErrUpstreamError)
	}
	return nil
}

func (c *Phase1GRPCClients) CheckCompliance(ctx context.Context, tenantID, contentID string) (bool, string, error) {
	if tenantID == "" || contentID == "" {
		return false, "", domain.ErrCrossTenantViolation
	}

	reqCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	conn, err := c.getConn(reqCtx, "compliance")
	if err != nil {
		return false, "", err
	}

	type compReq struct {
		TenantID  string `json:"tenant_id"`
		ContentID string `json:"content_id"`
	}
	reqBytes, _ := json.Marshal(compReq{TenantID: tenantID, ContentID: contentID})

	type compResp struct {
		Cleared bool   `json:"cleared"`
		Reason  string `json:"reason"`
	}
	var respBytes []byte
	err = conn.Invoke(reqCtx, "/compliance.v1.ComplianceService/CheckCompliance", reqBytes, &respBytes)
	if err != nil {
		log.Printf("ERROR [Phase1GRPCClients]: CheckCompliance RPC failed: %v", err)
		return false, "", fmt.Errorf("CheckCompliance failed: %w", domain.ErrUpstreamError)
	}

	var resp compResp
	if err := json.Unmarshal(respBytes, &resp); err != nil {
		return false, "", fmt.Errorf("failed to decode compliance response: %w", err)
	}
	return resp.Cleared, resp.Reason, nil
}

func (c *Phase1GRPCClients) ScheduleDistribution(ctx context.Context, tenantID, contentID string, platforms []string) error {
	if tenantID == "" || contentID == "" {
		return domain.ErrCrossTenantViolation
	}
	if len(platforms) == 0 {
		return fmt.Errorf("target platforms required")
	}

	reqCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	conn, err := c.getConn(reqCtx, "distribution")
	if err != nil {
		return err
	}

	type distReq struct {
		TenantID  string   `json:"tenant_id"`
		ContentID string   `json:"content_id"`
		Platforms []string `json:"platforms"`
	}
	reqBytes, _ := json.Marshal(distReq{TenantID: tenantID, ContentID: contentID, Platforms: platforms})
	var respBytes []byte
	err = conn.Invoke(reqCtx, "/distribution.v1.DistributionService/SchedulePublication", reqBytes, &respBytes)
	if err != nil {
		log.Printf("ERROR [Phase1GRPCClients]: ScheduleDistribution RPC failed: %v", err)
		return fmt.Errorf("ScheduleDistribution failed: %w", domain.ErrUpstreamError)
	}
	return nil
}

func (c *Phase1GRPCClients) CollectAnalytics(ctx context.Context, tenantID, contentID string) (map[string]interface{}, error) {
	if tenantID == "" || contentID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	reqCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	conn, err := c.getConn(reqCtx, "analytics")
	if err != nil {
		return nil, err
	}

	type anaReq struct {
		TenantID  string `json:"tenant_id"`
		ContentID string `json:"content_id"`
	}
	reqBytes, _ := json.Marshal(anaReq{TenantID: tenantID, ContentID: contentID})
	var respBytes []byte
	err = conn.Invoke(reqCtx, "/analytics.v1.AnalyticsService/GetPostMetrics", reqBytes, &respBytes)
	if err != nil {
		log.Printf("ERROR [Phase1GRPCClients]: CollectAnalytics RPC failed: %v", err)
		return nil, fmt.Errorf("CollectAnalytics failed: %w", domain.ErrUpstreamError)
	}

	var res map[string]interface{}
	if err := json.Unmarshal(respBytes, &res); err != nil {
		return nil, fmt.Errorf("failed to decode analytics metrics: %w", err)
	}
	return res, nil
}

func (c *Phase1GRPCClients) MonitorServiceHealth(ctx context.Context, serviceID string) (bool, error) {
	reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	services := []string{"content-factory", "compliance", "distribution", "analytics", "operations"}
	if serviceID != "all" && serviceID != "" {
		services = []string{serviceID}
	}

	allOK := true
	for _, svc := range services {
		conn, err := c.getConn(reqCtx, svc)
		if err != nil {
			log.Printf("WARN [Phase1GRPCClients]: health check failed for service %s: %v", svc, err)
			allOK = false
			continue
		}
		type healthReq struct {
			Service string `json:"service"`
		}
		type healthResp struct {
			Status string `json:"status"`
		}
		reqBytes, _ := json.Marshal(healthReq{Service: svc})
		var respBytes []byte
		err = conn.Invoke(reqCtx, "/grpc.health.v1.Health/Check", reqBytes, &respBytes)
		if err != nil {
			log.Printf("WARN [Phase1GRPCClients]: gRPC Health/Check RPC error for %s: %v", svc, err)
			allOK = false
		}
	}
	return allOK, nil
}

func (c *Phase1GRPCClients) CollectOptimizationSignals(ctx context.Context, tenantID string) ([]map[string]interface{}, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	reqCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	conn, err := c.getConn(reqCtx, "analytics")
	if err != nil {
		return nil, err
	}

	type sigReq struct {
		TenantID string `json:"tenant_id"`
	}
	reqBytes, _ := json.Marshal(sigReq{TenantID: tenantID})
	var respBytes []byte
	err = conn.Invoke(reqCtx, "/analytics.v1.AnalyticsService/GetOptimizationSignals", reqBytes, &respBytes)
	if err != nil {
		log.Printf("ERROR [Phase1GRPCClients]: CollectOptimizationSignals RPC failed: %v", err)
		return nil, fmt.Errorf("CollectOptimizationSignals failed: %w", domain.ErrUpstreamError)
	}

	var res []map[string]interface{}
	if err := json.Unmarshal(respBytes, &res); err != nil {
		return nil, fmt.Errorf("failed to decode optimization signals: %w", err)
	}
	return res, nil
}
