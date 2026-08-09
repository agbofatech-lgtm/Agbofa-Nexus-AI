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

type mockMultimodalProvider struct {
	id          string
	name        string
	failModel   string
	content     string
	lastModel   string
	lastMessage string
}

func (m *mockMultimodalProvider) ID() string   { return m.id }
func (m *mockMultimodalProvider) Name() string { return m.name }
func (m *mockMultimodalProvider) Generate(ctx context.Context, req llm.CompletionRequest) (llm.CompletionResponse, error) {
	m.lastModel = req.Model
	if len(req.Messages) > 0 {
		m.lastMessage = req.Messages[len(req.Messages)-1].Content
	}
	if req.Model == m.failModel {
		return llm.CompletionResponse{}, errors.New("simulated multimodal model error")
	}
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

func TestAIGatewayService_MultimodalRoutingImage(t *testing.T) {
	provider := &mockMultimodalProvider{id: "openai", name: "OpenAI", content: "Extracted news headline OCR"}
	models := newInMemModelRepo()
	prompts := newInMemPromptRepo()
	svc := application.NewAIGatewayService([]llm.Provider{provider}, models, prompts, nil, nil)

	req := llm.CompletionRequest{
		TenantID: "tenant-1",
		Attachments: []llm.MediaAttachment{
			{
				Type:        "image",
				Format:      "image/jpeg",
				Data:        []byte("fake-image-bytes-not-persisted"),
				Description: "Headline graphic",
			},
		},
	}

	resp, err := svc.InvokeModel(
		context.Background(),
		req,
		domain.AIGatewayPolicy{AllowedModels: []string{"*"}},
		llm.ModelRoutePolicy{PrimaryProvider: "openai"},
	)
	if err != nil {
		t.Fatalf("unexpected error on multimodal image invoke: %v", err)
	}
	if provider.lastModel != "gpt-4-vision" {
		t.Fatalf("expected routing to gpt-4-vision, got %s", provider.lastModel)
	}
	if resp.OCRText != "Extracted news headline OCR" {
		t.Fatalf("expected OCRText populated, got %s", resp.OCRText)
	}
	if len(resp.Detections) == 0 || resp.Detections[0].Label != "primary_subject" {
		t.Fatalf("expected Detections populated on image completion")
	}
	if tokens := svc.GetMultimodalTokenUsage("tenant-1"); tokens != 85 {
		t.Fatalf("expected 85 multimodal tokens tracked separately, got %d", tokens)
	}
}

func TestAIGatewayService_MultimodalRoutingAudio(t *testing.T) {
	provider := &mockMultimodalProvider{id: "openai", name: "OpenAI", content: "Full audio speech transcript"}
	models := newInMemModelRepo()
	prompts := newInMemPromptRepo()
	svc := application.NewAIGatewayService([]llm.Provider{provider}, models, prompts, nil, nil)

	req := llm.CompletionRequest{
		TenantID: "tenant-1",
		Attachments: []llm.MediaAttachment{
			{
				Type:   "audio",
				Format: "audio/mp3",
				URL:    "https://media.agbofa.ai/audio.mp3",
			},
		},
	}

	resp, err := svc.InvokeModel(
		context.Background(),
		req,
		domain.AIGatewayPolicy{AllowedModels: []string{"*"}},
		llm.ModelRoutePolicy{PrimaryProvider: "openai"},
	)
	if err != nil {
		t.Fatalf("unexpected error on multimodal audio invoke: %v", err)
	}
	if provider.lastModel != "whisper-1" {
		t.Fatalf("expected routing to whisper-1, got %s", provider.lastModel)
	}
	if resp.Transcription != "Full audio speech transcript" {
		t.Fatalf("expected Transcription populated, got %s", resp.Transcription)
	}
	if len(resp.Segments) == 0 || resp.Segments[0].SpeakerID != "spk_0" {
		t.Fatalf("expected Segments populated on audio completion")
	}
	if tokens := svc.GetMultimodalTokenUsage("tenant-1"); tokens != 30 {
		t.Fatalf("expected 30 multimodal tokens tracked, got %d", tokens)
	}
}

func TestAIGatewayService_MultimodalFallback(t *testing.T) {
	// Primary multimodal model gpt-4-vision fails; should fallback to text model gpt-4 with image description
	provider := &mockMultimodalProvider{id: "openai", name: "OpenAI", failModel: "gpt-4-vision", content: "Fallback text analysis"}
	models := newInMemModelRepo()
	prompts := newInMemPromptRepo()
	svc := application.NewAIGatewayService([]llm.Provider{provider}, models, prompts, nil, nil)

	req := llm.CompletionRequest{
		TenantID: "tenant-1",
		Attachments: []llm.MediaAttachment{
			{
				Type:        "image",
				Format:      "image/jpeg",
				Description: "Chart showing inflation drop",
			},
		},
	}

	_, err := svc.InvokeModel(
		context.Background(),
		req,
		domain.AIGatewayPolicy{AllowedModels: []string{"*"}},
		llm.ModelRoutePolicy{PrimaryProvider: "openai"},
	)
	if err != nil {
		t.Fatalf("unexpected error on image fallback: %v", err)
	}
	if provider.lastModel != "gpt-4" {
		t.Fatalf("expected fallback to text model gpt-4, got %s", provider.lastModel)
	}
	if !strings.Contains(provider.lastMessage, "Image description fallback: Chart showing inflation drop") {
		t.Fatalf("expected description appended to fallback text message, got %s", provider.lastMessage)
	}
}

func TestAIGatewayService_TextOnlyBackwardCompatibility(t *testing.T) {
	provider := &mockMultimodalProvider{id: "openai", name: "OpenAI", content: "Text only result"}
	models := newInMemModelRepo()
	prompts := newInMemPromptRepo()
	svc := application.NewAIGatewayService([]llm.Provider{provider}, models, prompts, nil, nil)

	req := llm.CompletionRequest{
		TenantID: "tenant-1",
		Model:    "gpt-4",
		Messages: []llm.Message{{Role: "user", Content: "Hello text world"}},
	}

	resp, err := svc.InvokeModel(
		context.Background(),
		req,
		domain.AIGatewayPolicy{AllowedModels: []string{"*"}},
		llm.ModelRoutePolicy{PrimaryProvider: "openai"},
	)
	if err != nil {
		t.Fatalf("unexpected error on text-only completion: %v", err)
	}
	if resp.Content != "Text only result" {
		t.Fatalf("unexpected text result: %s", resp.Content)
	}
	if tokens := svc.GetMultimodalTokenUsage("tenant-1"); tokens != 0 {
		t.Fatalf("expected 0 multimodal tokens consumed for text-only request, got %d", tokens)
	}
}
