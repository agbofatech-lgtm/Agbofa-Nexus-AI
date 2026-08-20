package social

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

type JobStatus string

const (
	StatusDraft         JobStatus = "DRAFT"
	StatusQueued        JobStatus = "QUEUED"
	StatusScheduled     JobStatus = "SCHEDULED"
	StatusProcessing    JobStatus = "PROCESSING"
	StatusPublished     JobStatus = "PUBLISHED"
	StatusFailed        JobStatus = "FAILED"
	StatusRetrying      JobStatus = "RETRYING"
	StatusCancelled     JobStatus = "CANCELLED"
	StatusExpired       JobStatus = "EXPIRED"
	StatusRequiresReauth JobStatus = "REQUIRES_REAUTH"
)

type FailureClass string

const (
	FailPermanent       FailureClass = "PERMANENT"
	FailTransient       FailureClass = "TRANSIENT"
	FailAuthentication  FailureClass = "AUTHENTICATION"
	FailAuthorization   FailureClass = "AUTHORIZATION"
	FailRateLimit       FailureClass = "RATE_LIMIT"
	FailInvalidContent  FailureClass = "INVALID_CONTENT"
	FailCapability      FailureClass = "CAPABILITY"
	FailNetwork         FailureClass = "NETWORK"
	FailPlatform        FailureClass = "PLATFORM"
	FailUnknown         FailureClass = "UNKNOWN"
)

type Job struct {
	ID             string
	TenantID       string
	ActorID        string
	AccountID      string
	Platform       Platform
	ContentID      string
	ContentVersion string
	IdempotencyKey string
	Status         JobStatus
	ScheduledAt    *time.Time
	RetryCount     int
	BrandApplied   bool
}

func IdempotencyKey(tenantID, contentID, version, accountID string, platform Platform, scheduled string) string {
	sum := sha256.Sum256([]byte(fmt.Sprintf("%s|%s|%s|%s|%s|%s", tenantID, contentID, version, accountID, platform, scheduled)))
	return hex.EncodeToString(sum[:])
}

func CanTransition(from, to JobStatus) bool {
	legal := map[JobStatus][]JobStatus{
		StatusDraft:          {StatusQueued, StatusScheduled, StatusCancelled},
		StatusScheduled:      {StatusQueued, StatusCancelled, StatusExpired},
		StatusQueued:         {StatusProcessing, StatusCancelled},
		StatusProcessing:     {StatusPublished, StatusFailed, StatusRetrying, StatusRequiresReauth},
		StatusRetrying:       {StatusQueued, StatusFailed, StatusCancelled},
		StatusFailed:         {StatusRetrying, StatusCancelled},
		StatusRequiresReauth: {StatusRetrying, StatusCancelled},
		StatusPublished:      {},
		StatusCancelled:      {},
		StatusExpired:        {},
	}
	for _, allowed := range legal[from] {
		if allowed == to {
			return true
		}
	}
	return false
}

func Transition(from, to JobStatus) error {
	if !CanTransition(from, to) {
		return fmt.Errorf("%w: %s -> %s", ErrIllegalTransition, from, to)
	}
	return nil
}

func ClassifyHTTP(status int) FailureClass {
	switch {
	case status == 401 || status == 403:
		return FailAuthentication
	case status == 429:
		return FailRateLimit
	case status >= 500:
		return FailTransient
	case status >= 400:
		return FailPermanent
	default:
		return FailUnknown
	}
}

func Retryable(class FailureClass) bool {
	return class == FailTransient || class == FailNetwork || class == FailRateLimit
}

func NextBackoff(retries int, retryAfter time.Duration) time.Duration {
	if retryAfter > 0 {
		return retryAfter
	}
	if retries < 1 {
		retries = 1
	}
	d := time.Duration(retries*retries) * time.Second
	if d > 5*time.Minute {
		return 5 * time.Minute
	}
	return d
}
