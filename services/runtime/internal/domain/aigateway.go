package domain

import (
	"errors"
	"strings"
)

var (
	ErrModelNotAvailable    = errors.New("requested model is inactive or unavailable")
	ErrUnauthorizedModel    = errors.New("tenant not authorized for requested model")
	ErrQuotaExceeded        = errors.New("tenant token quota exceeded")
	ErrPromptVersionMissing = errors.New("requested prompt template version not found")
)

type AIGatewayPolicy struct {
	TenantID           string
	MaxTokensPerMinute int
	AllowedModels      []string
}

func (p AIGatewayPolicy) AllowsModel(modelID string) bool {
	if len(p.AllowedModels) == 0 {
		return true
	}
	for _, m := range p.AllowedModels {
		if m == "*" || strings.EqualFold(m, modelID) {
			return true
		}
	}
	return false
}

type ModelRegistryRepo interface {
	FindModel(modelID string) (*ModelEndpointEntity, error)
	ListModels(activeOnly bool) ([]ModelEndpointEntity, error)
	RegisterModel(model ModelEndpointEntity) error
}

type PromptRepo interface {
	GetPrompt(id string, version string) (*PromptTemplateEntity, error)
	SavePrompt(prompt PromptTemplateEntity) error
}
