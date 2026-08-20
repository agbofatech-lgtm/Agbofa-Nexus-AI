package llm

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func mapHTTPStatus(status int) error {
	switch {
	case status >= 200 && status < 300:
		return nil
	case status == http.StatusUnauthorized || status == http.StatusForbidden:
		return ErrProviderUnauthorized
	case status == http.StatusTooManyRequests:
		return ErrProviderRateLimited
	case status == http.StatusRequestTimeout || status == http.StatusGatewayTimeout:
		return ErrProviderTimeout
	case status >= 500:
		return ErrProviderFailed
	default:
		return ErrProviderFailed
	}
}

func readLimited(r io.Reader, max int64) ([]byte, error) {
	return io.ReadAll(io.LimitReader(r, max))
}

func classifyTransport(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
		return ErrProviderTimeout
	}
	return ErrProviderFailed
}

func retryAfter(h http.Header) time.Duration {
	raw := strings.TrimSpace(h.Get("Retry-After"))
	if raw == "" {
		return 0
	}
	if seconds, err := strconv.Atoi(raw); err == nil && seconds > 0 {
		return time.Duration(seconds) * time.Second
	}
	return 0
}
