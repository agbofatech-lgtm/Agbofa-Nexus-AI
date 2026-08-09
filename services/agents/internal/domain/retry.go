package domain

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
)

func IsRetryable(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, ErrInvalidCredentials) || errors.Is(err, ErrCrossTenantViolation) ||
		errors.Is(err, ErrAgentNotAuthorized) || errors.Is(err, ErrRateLimitExceeded) ||
		errors.Is(err, ErrFloodDetected) || errors.Is(err, ErrCircuitOpen) {
		return false
	}
	errStr := strings.ToLower(err.Error())
	if strings.Contains(errStr, "401") || strings.Contains(errStr, "403") ||
		strings.Contains(errStr, "unauthorized") || strings.Contains(errStr, "forbidden") {
		return false
	}

	if errors.Is(err, ErrUpstreamTimeout) || errors.Is(err, ErrServiceUnavailable) ||
		errors.Is(err, ErrUpstreamError) || errors.Is(err, context.DeadlineExceeded) {
		return true
	}
	if strings.Contains(errStr, "500") || strings.Contains(errStr, "502") ||
		strings.Contains(errStr, "503") || strings.Contains(errStr, "504") ||
		strings.Contains(errStr, "timeout") {
		return true
	}
	return false
}

func RetryWithBackoff(ctx context.Context, fn func() error) error {
	var lastErr error
	backoffs := []time.Duration{1 * time.Second, 2 * time.Second, 4 * time.Second}
	for attempt := 0; attempt < 3; attempt++ {
		lastErr = fn()
		if lastErr == nil {
			return nil
		}
		if !IsRetryable(lastErr) {
			return lastErr
		}
		if attempt < 2 {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(backoffs[attempt]):
			}
		}
	}
	return fmt.Errorf("exhausted 3 retry attempts: %w", lastErr)
}
