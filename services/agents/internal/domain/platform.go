package domain

import "errors"

type PlatformSource string

const (
	PlatformTwitter   PlatformSource = "TWITTER"
	PlatformFacebook  PlatformSource = "FACEBOOK"
	PlatformInstagram PlatformSource = "INSTAGRAM"
	PlatformTikTok    PlatformSource = "TIKTOK"
	PlatformLinkedIn  PlatformSource = "LINKEDIN"
	PlatformYouTube   PlatformSource = "YOUTUBE"
	PlatformReddit    PlatformSource = "REDDIT"
	PlatformRSS       PlatformSource = "RSS"
	PlatformEmerging  PlatformSource = "EMERGING"
)

var (
	ErrInvalidPlatform         = errors.New("invalid platform source")
	ErrCrossTenantViolation    = errors.New("cross-tenant data access violation")
	ErrRateLimitExceeded       = errors.New("platform rate limit exceeded")
	ErrAgentNotAuthorized      = errors.New("agent execution not authorized")
	ErrFloodDetected           = errors.New("adversarial flood detected: source rate exceeded")
	ErrCircuitOpen             = errors.New("circuit breaker open: agent paused due to high error rate")
	ErrServiceUnavailable      = errors.New("upstream service unavailable or address empty")
	ErrInvalidCredentials      = errors.New("invalid or missing API credentials")
	ErrUpstreamTimeout         = errors.New("upstream API request timed out")
	ErrUpstreamError           = errors.New("upstream service returned an error")
	ErrPipelineOverloaded      = errors.New("pipeline overloaded: work queue full (HTTP 429)")
	ErrStaleSignal             = errors.New("analytics signal rejected: timestamp exceeds freshness SLA (3600s)")
	ErrAllPlatformsRateLimited = errors.New("all target platforms are rate-limited (< 10 remaining tokens)")
)

func (p PlatformSource) IsValid() bool {
	switch p {
	case PlatformTwitter, PlatformFacebook, PlatformInstagram, PlatformTikTok,
		PlatformLinkedIn, PlatformYouTube, PlatformReddit, PlatformRSS, PlatformEmerging:
		return true
	default:
		return false
	}
}

func (p PlatformSource) String() string {
	return string(p)
}
