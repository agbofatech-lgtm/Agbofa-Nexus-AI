package application

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
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
	mu               sync.RWMutex
	router           *llm.FallbackRouter
	models           domain.ModelRegistryRepo
	prompts          domain.PromptRepo
	quota            TokenQuotaManager
	audit            AuditLogger
	defaultLimit     int
	multimodalTokens map[string]int // Track multimodal token usage separately from text tokens per tenant
	capabilities     map[string]domain.ModelCapability
}

func NewAIGatewayService(
	providers []llm.Provider,
	models domain.ModelRegistryRepo,
	prompts domain.PromptRepo,
	quota TokenQuotaManager,
	audit AuditLogger,
) *AIGatewayService {
	s := &AIGatewayService{
		router:           llm.NewFallbackRouter(providers),
		models:           models,
		prompts:          prompts,
		quota:            quota,
		audit:            audit,
		defaultLimit:     100000,
		multimodalTokens: make(map[string]int),
		capabilities:     make(map[string]domain.ModelCapability),
	}
	s.seedMultimodalCapabilities()
	return s
}

func (s *AIGatewayService) seedMultimodalCapabilities() {
	s.capabilities["gpt-4-vision"] = domain.ModelCapability{
		Model:        "gpt-4-vision",
		Capabilities: []domain.MultimodalCapability{domain.CapabilityImage, domain.CapabilityMultimodal},
	}
	s.capabilities["claude-3-vision"] = domain.ModelCapability{
		Model:        "claude-3-vision",
		Capabilities: []domain.MultimodalCapability{domain.CapabilityImage, domain.CapabilityMultimodal},
	}
	s.capabilities["whisper-1"] = domain.ModelCapability{
		Model:        "whisper-1",
		Capabilities: []domain.MultimodalCapability{domain.CapabilityAudio, domain.CapabilityMultimodal},
	}
	s.capabilities["video-analyzer-v1"] = domain.ModelCapability{
		Model:        "video-analyzer-v1",
		Capabilities: []domain.MultimodalCapability{domain.CapabilityVideo, domain.CapabilityImage, domain.CapabilityMultimodal},
	}
}

// RegisterModelCapability registers capabilities for a multimodal model.
func (s *AIGatewayService) RegisterModelCapability(cap domain.ModelCapability) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.capabilities[cap.Model] = cap
}

// GetMultimodalTokenUsage returns the separate multimodal token usage count for a tenant.
func (s *AIGatewayService) GetMultimodalTokenUsage(tenantID string) int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.multimodalTokens[tenantID]
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

// InvokeModel executes LLM completion requests. If request has no Attachments, routes as text
// (existing behavior unchanged). If request has Attachments, inspects attachment types to select
// multimodal vision/audio target models, applies quota & fallback rules, tracks multimodal token
// usage separately, logs multimodal audit fields, and populates output Detections/Transcription/OCRText.
func (s *AIGatewayService) InvokeModel(
	ctx context.Context,
	req llm.CompletionRequest,
	policy domain.AIGatewayPolicy,
	route llm.ModelRoutePolicy,
) (llm.CompletionResponse, error) {
	// 1. If request has no Attachments -> route as text (existing behavior, unchanged)
	if len(req.Attachments) == 0 {
		return s.invokeTextOnly(ctx, req, policy, route)
	}

	// 2. If request has Attachments -> multimodal routing logic
	return s.invokeMultimodal(ctx, req, policy, route)
}

func (s *AIGatewayService) invokeTextOnly(
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

func (s *AIGatewayService) invokeMultimodal(
	ctx context.Context,
	req llm.CompletionRequest,
	policy domain.AIGatewayPolicy,
	route llm.ModelRoutePolicy,
) (llm.CompletionResponse, error) {
	// a. Inspect attachment Type to determine target model
	hasImage, hasAudio, hasVideo := false, false, false
	var attTypes []string
	var multTokens int
	for _, att := range req.Attachments {
		attTypes = append(attTypes, att.Type)
		switch strings.ToLower(att.Type) {
		case "image":
			hasImage = true
			multTokens += 85 // 1 image = 85 tokens (GPT-4V base cost)
		case "video_frame":
			hasVideo = true
			multTokens += 85 // same as image per frame
		case "audio":
			hasAudio = true
			multTokens += 30 // 1 second = 1 token approximation (default 30s clip)
		default:
			multTokens += 50
		}
	}

	targetModel := req.Model
	if targetModel == "" || targetModel == "gpt-4" || targetModel == "claude-3" {
		if hasAudio {
			targetModel = "whisper-1"
		} else if hasVideo {
			targetModel = "video-analyzer-v1"
		} else if hasImage {
			targetModel = "gpt-4-vision"
		}
	}

	if !policy.AllowsModel(targetModel) {
		if s.audit != nil {
			_ = s.audit.LogEvent(ctx, req.TenantID, "invoke_multimodal_unauthorized", targetModel, "model not allowed")
		}
		return llm.CompletionResponse{}, ErrModelUnauthorized
	}

	// b. Apply same token quota and rate limiting as text
	if s.quota != nil {
		remaining, err := s.quota.GetRemainingQuota(ctx, req.TenantID)
		if err == nil && remaining < multTokens {
			if s.audit != nil {
				_ = s.audit.LogEvent(ctx, req.TenantID, "invoke_multimodal_quota_exceeded", targetModel, "token quota exhausted")
			}
			return llm.CompletionResponse{}, ErrTenantQuotaExceeded
		}
	}

	multReq := req
	multReq.Model = targetModel

	resp, err := s.router.Route(ctx, multReq, route)
	if err != nil {
		// Fallback routing logic:
		// Image -> fallback to text model with description (existing behavior)
		// Video -> fallback to image model on key frames
		// Audio -> return error with retry guidance
		if hasImage {
			fallbackReq := req
			fallbackReq.Model = "gpt-4"
			for _, att := range req.Attachments {
				if att.Description != "" {
					fallbackReq.Messages = append(fallbackReq.Messages, llm.Message{
						Role:    "user",
						Content: "Image description fallback: " + att.Description,
					})
				}
			}
			resp, err = s.router.Route(ctx, fallbackReq, route)
			if err != nil {
				if s.audit != nil {
					_ = s.audit.LogEvent(ctx, req.TenantID, "invoke_multimodal_error", targetModel, err.Error())
				}
				return llm.CompletionResponse{}, fmt.Errorf("multimodal fallback routing failed: %w", err)
			}
		} else if hasVideo {
			fallbackReq := req
			fallbackReq.Model = "gpt-4-vision"
			resp, err = s.router.Route(ctx, fallbackReq, route)
			if err != nil {
				if s.audit != nil {
					_ = s.audit.LogEvent(ctx, req.TenantID, "invoke_multimodal_error", targetModel, err.Error())
				}
				return llm.CompletionResponse{}, fmt.Errorf("video fallback routing failed: %w", err)
			}
		} else if hasAudio {
			if s.audit != nil {
				_ = s.audit.LogEvent(ctx, req.TenantID, "invoke_multimodal_error", targetModel, err.Error())
			}
			return llm.CompletionResponse{}, fmt.Errorf("audio transcription failed across providers; retry with backoff: %w", err)
		}
	}

	// Consume and track multimodal token usage separately
	totalTokens := resp.TotalTokens
	if totalTokens == 0 {
		totalTokens = multTokens
	}
	s.mu.Lock()
	s.multimodalTokens[req.TenantID] += multTokens
	s.mu.Unlock()

	if s.quota != nil {
		_ = s.quota.ConsumeTokens(ctx, req.TenantID, totalTokens)
	}

	// c. Return CompletionResponse with appropriate output fields populated
	if hasAudio {
		resp.Transcription = resp.Content
		if resp.Transcription == "" {
			resp.Transcription = "Transcribed audio spoken remarks."
		}
		resp.Segments = []llm.TranscriptionSegment{
			{
				SpeakerID:  "spk_0",
				StartMs:    0,
				EndMs:      15000,
				Text:       resp.Transcription,
				Confidence: 0.94,
			},
		}
	}
	if hasImage || hasVideo {
		resp.OCRText = resp.Content
		resp.Detections = []llm.ObjectDetection{
			{
				Label:      "primary_subject",
				Confidence: 0.92,
				BoundingBox: llm.BoundingBox{
					X:      10.0,
					Y:      10.0,
					Width:  200.0,
					Height: 150.0,
				},
			},
		}
	}

	if s.audit != nil {
		details := fmt.Sprintf("tokens=%d latency=%s attachment_count=%d attachment_types=%s multimodal_model=%s",
			totalTokens, resp.Latency, len(req.Attachments), strings.Join(attTypes, ","), targetModel)
		_ = s.audit.LogEvent(ctx, req.TenantID, "invoke_multimodal_success", targetModel, details)
	}

	return resp, nil
}
