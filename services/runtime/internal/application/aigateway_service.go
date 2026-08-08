package application

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/runtime/internal/domain"
)

var (
	ErrTenantQuotaExceeded = errors.New("tenant token quota exceeded")
	ErrModelUnauthorized   = errors.New("model not permitted by tenant policy")
)

type AuditLogger interface {
	LogEvent(ctx context.Context, tenantID, action, resource, details string) error
}

type TokenQuotaManager interface {
	ConsumeTokens(ctx context.Context, tenantID string, tokens int) error
	GetRemainingQuota(ctx context.Context, tenantID string) (int, error)
}

type AIGatewayService struct {
	router       *llm.FallbackRouter
	models       domain.ModelRegistryRepo
	prompts      domain.PromptRepo
	quota        TokenQuotaManager
	audit        AuditLogger
	defaultLimit int
}

func NewAIGatewayService(
	providers []llm.Provider,
	models domain.ModelRegistryRepo,
	prompts domain.PromptRepo,
	quota TokenQuotaManager,
	audit AuditLogger,
) *AIGatewayService {
	return &AIGatewayService{
		router:       llm.NewFallbackRouter(providers),
		models:       models,
		prompts:      prompts,
		quota:        quota,
		audit:        audit,
		defaultLimit: 100000,
	}
}

func (s *AIGatewayService) RegisterModelEndpoint(ctx context.Context, model domain.ModelEndpointEntity) error {
	if err := s.models.RegisterModel(model); err != nil {
		return err
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, "system", "register_model", model.ModelID, "registered endpoint "+model.ProviderID)
	}
	return nil
}

func (s *AIGatewayService) ListModels(ctx context.Context, activeOnly bool) ([]domain.ModelEndpointEntity, error) {
	return s.models.ListModels(activeOnly)
}

func (s *AIGatewayService) SavePromptTemplate(ctx context.Context, tmpl domain.PromptTemplateEntity) error {
	if tmpl.CreatedAt.IsZero() {
		tmpl.CreatedAt = time.Now()
	}
	if err := s.prompts.SavePrompt(tmpl); err != nil {
		return err
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, "system", "save_prompt", tmpl.ID+":"+tmpl.Version, "saved prompt template")
	}
	return nil
}

func (s *AIGatewayService) GetPromptTemplate(ctx context.Context, id, version string) (*domain.PromptTemplateEntity, error) {
	return s.prompts.GetPrompt(id, version)
}

func (s *AIGatewayService) InvokeModel(
	ctx context.Context,
	req llm.CompletionRequest,
	policy domain.AIGatewayPolicy,
	route llm.ModelRoutePolicy,
) (llm.CompletionResponse, error) {
	if !policy.AllowsModel(req.Model) {
		if s.audit != nil {
			_ = s.audit.LogEvent(ctx, req.TenantID, "invoke_model_unauthorized", req.Model, "model not allowed")
		}
		return llm.CompletionResponse{}, ErrModelUnauthorized
	}
	if s.quota != nil {
		remaining, err := s.quota.GetRemainingQuota(ctx, req.TenantID)
		if err == nil && remaining <= 0 {
			if s.audit != nil {
				_ = s.audit.LogEvent(ctx, req.TenantID, "invoke_model_quota_exceeded", req.Model, "token quota exhausted")
			}
			return llm.CompletionResponse{}, ErrTenantQuotaExceeded
		}
	}
	resp, err := s.router.Route(ctx, req, route)
	if err != nil {
		if s.audit != nil {
			_ = s.audit.LogEvent(ctx, req.TenantID, "invoke_model_error", req.Model, err.Error())
		}
		return llm.CompletionResponse{}, fmt.Errorf("model routing failed: %w", err)
	}
	if s.quota != nil {
		_ = s.quota.ConsumeTokens(ctx, req.TenantID, resp.TotalTokens)
	}
	if s.audit != nil {
		_ = s.audit.LogEvent(ctx, req.TenantID, "invoke_model_success", req.Model, fmt.Sprintf("tokens=%d latency=%s", resp.TotalTokens, resp.Latency))
	}
	return resp, nil
}
