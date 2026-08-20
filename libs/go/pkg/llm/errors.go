package llm

import "errors"

var (
	ErrInvalidRequest        = errors.New("llm: invalid request")
	ErrUnknownModel          = errors.New("llm: unknown model")
	ErrUnknownProvider       = errors.New("llm: unknown provider")
	ErrProviderUnavailable   = errors.New("llm: provider unavailable")
	ErrProviderUnauthorized  = errors.New("llm: provider unauthorized")
	ErrProviderRateLimited   = errors.New("llm: provider rate limited")
	ErrProviderTimeout       = errors.New("llm: provider timeout")
	ErrProviderFailed        = errors.New("llm: provider failed")
	ErrSimulatedForbidden    = errors.New("llm: simulated providers cannot serve production requests")
	ErrMissingCredential     = errors.New("llm: provider credential is not configured")
	ErrInvalidResponse       = errors.New("llm: provider response is invalid")
)
