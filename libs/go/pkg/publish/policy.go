package publish

import (
	"context"
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
	"github.com/agbofa/nexus/libs/go/pkg/social"
)

type GateInput struct {
	Principal      authz.Principal
	ContentID      string
	ContentVersion string
	Body           string
	BrandApplied   bool
	ConnectionID   string
	ConnectionTenant string
	ConnectionStatus string
	Platform       string
	ScheduledAt    *time.Time
	Now            time.Time
}

type GateResult struct {
	OK     bool
	Code   string
	Reason string
}

func Validate(in GateInput) GateResult {
	if in.Principal.SubjectID == "" || in.Principal.TenantID == "" {
		return GateResult{Code: "PUBLISH_PERMISSION_DENIED", Reason: "missing authenticated subject"}
	}
	dec := authz.Decide(authz.Request{
		SubjectID: in.Principal.SubjectID, TenantID: in.Principal.TenantID,
		ResourceTenant: in.Principal.TenantID, Roles: in.Principal.Roles,
		Resource: "content", Action: "create",
	})
	if !dec.Allowed {
		return GateResult{Code: "PUBLISH_PERMISSION_DENIED", Reason: dec.Reason}
	}
	if in.ConnectionID == "" || in.ConnectionTenant != in.Principal.TenantID {
		return GateResult{Code: "TENANT_ACCESS_DENIED", Reason: "connection does not belong to tenant"}
	}
	if strings.EqualFold(in.ConnectionStatus, "DISCONNECTED") || strings.EqualFold(in.ConnectionStatus, "REVOKED") {
		return GateResult{Code: "CONNECTION_REAUTH_REQUIRED", Reason: "connection is not active"}
	}
	if strings.TrimSpace(in.ContentID) == "" || strings.TrimSpace(in.ContentVersion) == "" {
		return GateResult{Code: "INVALID_CONTENT", Reason: "content id and version required"}
	}
	if !in.BrandApplied {
		return GateResult{Code: "BRAND_VALIDATION_FAILED", Reason: social.ErrBrandingRequired.Error()}
	}
	spec, ok := social.Lookup(in.Platform)
	if !ok {
		return GateResult{Code: "PLATFORM_NOT_SUPPORTED", Reason: "unknown platform"}
	}
	if spec.MaxText > 0 && utf8.RuneCountInString(in.Body) > spec.MaxText+len(social.BrandMark)+8 {
		return GateResult{Code: "INVALID_CONTENT", Reason: "text exceeds platform limit"}
	}
	if in.ScheduledAt != nil && !in.ScheduledAt.After(in.Now.Add(-time.Minute)) {
		return GateResult{Code: "SCHEDULE_INVALID", Reason: "scheduled time must be in the future"}
	}
	return GateResult{OK: true, Code: "OK"}
}

type ErrorClass string

const (
	ClassRetryable    ErrorClass = "RETRYABLE"
	ClassPermanent    ErrorClass = "PERMANENT"
	ClassReauth       ErrorClass = "REAUTH"
	ClassRateLimited  ErrorClass = "RATE_LIMITED"
)

func Classify(err error, httpStatus int) ErrorClass {
	if httpStatus == 429 {
		return ClassRateLimited
	}
	if errors.Is(err, social.ErrReauthRequired) || httpStatus == 401 || httpStatus == 403 {
		return ClassReauth
	}
	if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
		return ClassRetryable
	}
	c := social.ClassifyHTTP(httpStatus)
	if social.Retryable(c) {
		return ClassRetryable
	}
	if c == social.FailAuthentication {
		return ClassReauth
	}
	if errors.Is(err, social.ErrBrandingRequired) || errors.Is(err, social.ErrInvalidContent) || errors.Is(err, social.ErrCapabilityUnsupported) {
		return ClassPermanent
	}
	return ClassPermanent
}

func Backoff(attempt int, retryAfter time.Duration) time.Duration {
	if retryAfter > 0 {
		return retryAfter
	}
	if attempt < 1 {
		attempt = 1
	}
	d := time.Duration(30*(1<<(attempt-1))) * time.Second
	if d > 15*time.Minute {
		return 15 * time.Minute
	}
	return d
}
