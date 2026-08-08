package application_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/runtime/internal/application"
	"github.com/agbofa/nexus/services/runtime/internal/domain"
)

type mockProvider struct {
	id      string
	name    string
	content string
}

func (m *mockProvider) ID() string   { return m.id }
func (m *mockProvider) Name() string { return m.name }
func (m *mockProvider) Generate(ctx context.Context, req llm.CompletionRequest) (llm.CompletionResponse, error) {
	return llm.CompletionResponse{
		ProviderID:       m.id,
		Model:            req.Model,
		Content:          m.content,
		PromptTokens:     10,
		CompletionTokens: 5,
		TotalTokens:      15,
		Latency:          10 * time.Millisecond,
	}, nil
}

type inMemModelRepo struct {
	models map[string]domain.ModelEndpointEntity
}

func newInMemModelRepo() *inMemModelRepo {
	return &inMemModelRepo{models: make(map[string]domain.ModelEndpointEntity)}
}

func (r *inMemModelRepo) FindModel(id string) (*domain.ModelEndpointEntity, error) {
	m, ok := r.models[id]
	if !ok {
		return nil, domain.ErrModelNotAvailable
	}
	return &m, nil
}

func (r *inMemModelRepo) ListModels(activeOnly bool) ([]domain.ModelEndpointEntity, error) {
	var list []domain.ModelEndpointEntity
	for _, m := range r.models {
		if activeOnly && !m.Active {
			continue
		}
		list = append(list, m)
	}
	return list, nil
}

func (r *inMemModelRepo) RegisterModel(m domain.ModelEndpointEntity) error {
	r.models[m.ModelID] = m
	return nil
}

type inMemPromptRepo struct {
	prompts map[string]domain.PromptTemplateEntity
}

func newInMemPromptRepo() *inMemPromptRepo {
	return &inMemPromptRepo{prompts: make(map[string]domain.PromptTemplateEntity)}
}

func (r *inMemPromptRepo) GetPrompt(id, version string) (*domain.PromptTemplateEntity, error) {
	p, ok := r.prompts[id+":"+version]
	if !ok {
		return nil, domain.ErrPromptVersionMissing
	}
	return &p, nil
}

func (r *inMemPromptRepo) SavePrompt(p domain.PromptTemplateEntity) error {
	r.prompts[p.ID+":"+p.Version] = p
	return nil
}

type mockQuotaMgr struct {
	remaining int
}

func (m *mockQuotaMgr) ConsumeTokens(ctx context.Context, tenantID string, tokens int) error {
	m.remaining -= tokens
	return nil
}

func (m *mockQuotaMgr) GetRemainingQuota(ctx context.Context, tenantID string) (int, error) {
	return m.remaining, nil
}

type mockAudit struct {
	logs []string
}

func (a *mockAudit) LogEvent(ctx context.Context, tenantID, action, resource, details string) error {
	a.logs = append(a.logs, action+":"+resource)
	return nil
}

func TestAIGatewayService_Flow(t *testing.T) {
	provider := &mockProvider{id: "openai", name: "OpenAI", content: "response text"}
	models := newInMemModelRepo()
	prompts := newInMemPromptRepo()
	quota := &mockQuotaMgr{remaining: 100}
	audit := &mockAudit{}

	svc := application.NewAIGatewayService([]llm.Provider{provider}, models, prompts, quota, audit)

	if err := svc.RegisterModelEndpoint(context.Background(), domain.ModelEndpointEntity{
		ModelID:    "gpt-4",
		ProviderID: "openai",
		Active:     true,
	}); err != nil {
		t.Fatalf("failed to register model: %v", err)
	}

	resp, err := svc.InvokeModel(
		context.Background(),
		llm.CompletionRequest{TenantID: "tenant-1", Model: "gpt-4"},
		domain.AIGatewayPolicy{AllowedModels: []string{"gpt-4"}},
		llm.ModelRoutePolicy{PrimaryProvider: "openai"},
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Content != "response text" {
		t.Fatalf("unexpected content: %s", resp.Content)
	}
	if quota.remaining != 85 {
		t.Fatalf("expected remaining quota 85, got %d", quota.remaining)
	}
}

func TestAIGatewayService_UnauthorizedModel(t *testing.T) {
	provider := &mockProvider{id: "openai", name: "OpenAI"}
	models := newInMemModelRepo()
	prompts := newInMemPromptRepo()
	svc := application.NewAIGatewayService([]llm.Provider{provider}, models, prompts, nil, nil)

	_, err := svc.InvokeModel(
		context.Background(),
		llm.CompletionRequest{TenantID: "tenant-1", Model: "gpt-4"},
		domain.AIGatewayPolicy{AllowedModels: []string{"claude-3"}},
		llm.ModelRoutePolicy{PrimaryProvider: "openai"},
	)
	if !errors.Is(err, application.ErrModelUnauthorized) {
		t.Fatalf("expected ErrModelUnauthorized, got %v", err)
	}
}
