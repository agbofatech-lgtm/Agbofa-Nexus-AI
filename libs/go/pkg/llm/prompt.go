package llm

import (
	"context"
	"errors"
	"fmt"
	"strings"
)

var (
	ErrPromptNotFound         = errors.New("prompt template not found")
	ErrMissingPromptVariable  = errors.New("missing required prompt variable")
	ErrPromptSafetyViolation  = errors.New("prompt safety policy check failed")
)

type SafetyPolicy struct {
	MaxInputLength    int
	DisallowInjection bool
}

type PromptTemplate struct {
	ID                string
	Name              string
	Version           string
	TemplateString    string
	RequiredVariables []string
	SafetyPolicy      SafetyPolicy
	Tags              []string
}

type PromptRegistry interface {
	GetPrompt(ctx context.Context, id string, version string) (*PromptTemplate, error)
	RegisterPrompt(ctx context.Context, template PromptTemplate) error
	RenderPrompt(ctx context.Context, id string, version string, vars map[string]string) (string, error)
}

type InMemoryPromptRegistry struct {
	templates map[string]*PromptTemplate
}

func NewInMemoryPromptRegistry() *InMemoryPromptRegistry {
	return &InMemoryPromptRegistry{
		templates: make(map[string]*PromptTemplate),
	}
}

func promptKey(id, version string) string {
	return id + ":" + version
}

func (r *InMemoryPromptRegistry) RegisterPrompt(ctx context.Context, template PromptTemplate) error {
	key := promptKey(template.ID, template.Version)
	tCopy := template
	r.templates[key] = &tCopy
	return nil
}

func (r *InMemoryPromptRegistry) GetPrompt(ctx context.Context, id string, version string) (*PromptTemplate, error) {
	key := promptKey(id, version)
	t, ok := r.templates[key]
	if !ok {
		return nil, fmt.Errorf("%w: %s version %s", ErrPromptNotFound, id, version)
	}
	return t, nil
}

func (r *InMemoryPromptRegistry) RenderPrompt(ctx context.Context, id string, version string, vars map[string]string) (string, error) {
	tmpl, err := r.GetPrompt(ctx, id, version)
	if err != nil {
		return "", err
	}
	for _, reqVar := range tmpl.RequiredVariables {
		if _, ok := vars[reqVar]; !ok {
			return "", fmt.Errorf("%w: %s", ErrMissingPromptVariable, reqVar)
		}
	}
	out := tmpl.TemplateString
	for k, v := range vars {
		if tmpl.SafetyPolicy.DisallowInjection && (strings.Contains(strings.ToLower(v), "ignore previous instructions") || strings.Contains(strings.ToLower(v), "system:")) {
			return "", ErrPromptSafetyViolation
		}
		if tmpl.SafetyPolicy.MaxInputLength > 0 && len(v) > tmpl.SafetyPolicy.MaxInputLength {
			return "", ErrPromptSafetyViolation
		}
		out = strings.ReplaceAll(out, "{{"+k+"}}", v)
	}
	return out, nil
}
