package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
	"github.com/agbofa/nexus/libs/go/pkg/llm"
)

type AIHTTP struct {
	Gateway *llm.Gateway
}

func (h AIHTTP) Complete(w http.ResponseWriter, r *http.Request) {
	if h.Gateway == nil {
		writeErr(w, http.StatusServiceUnavailable, "ai_unavailable")
		return
	}
	var req struct {
		Model       string        `json:"model"`
		Messages    []llm.Message `json:"messages"`
		MaxTokens   int           `json:"max_tokens"`
		Temperature float64       `json:"temperature"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	principal, _ := authz.PrincipalFrom(r.Context())
	res, err := h.Gateway.Complete(r.Context(), llm.Request{
		Model:         req.Model,
		Messages:      req.Messages,
		MaxTokens:     req.MaxTokens,
		Temperature:   req.Temperature,
		CorrelationID: r.Header.Get("X-Correlation-ID"),
		TenantID:      principal.TenantID,
		SubjectID:     principal.SubjectID,
	})
	if err != nil {
		writeErr(w, statusForAI(err), "ai_error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"provider":      res.Provider,
		"model":         res.Model,
		"text":          res.Text,
		"finish_reason": res.FinishReason,
		"usage":         res.Usage,
		"cost":          res.Cost,
		"request_id":    res.RequestID,
	})
}

func (h AIHTTP) Health(w http.ResponseWriter, r *http.Request) {
	if h.Gateway == nil {
		writeJSON(w, http.StatusOK, map[string]any{"providers": []any{}})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"providers": h.Gateway.Health(r.Context()), "models": h.Gateway.Models()})
}

func statusForAI(err error) int {
	switch {
	case errors.Is(err, llm.ErrInvalidRequest), errors.Is(err, llm.ErrUnknownModel):
		return http.StatusBadRequest
	case errors.Is(err, llm.ErrMissingCredential), errors.Is(err, llm.ErrProviderUnavailable):
		return http.StatusServiceUnavailable
	case errors.Is(err, llm.ErrProviderUnauthorized):
		return http.StatusBadGateway
	case errors.Is(err, llm.ErrProviderRateLimited):
		return http.StatusTooManyRequests
	case errors.Is(err, llm.ErrProviderTimeout):
		return http.StatusGatewayTimeout
	default:
		return http.StatusBadGateway
	}
}
