package social

import "errors"

var (
	ErrUnknownPlatform      = errors.New("social: unknown platform")
	ErrCapabilityUnsupported = errors.New("social: CAPABILITY_NOT_SUPPORTED")
	ErrBrandingRequired     = errors.New("social: BRANDING_REQUIRED")
	ErrInvalidState         = errors.New("social: invalid oauth state")
	ErrExpiredState         = errors.New("social: expired oauth state")
	ErrReplayState          = errors.New("social: oauth state replay")
	ErrStateTenant          = errors.New("social: oauth state tenant mismatch")
	ErrStateUser            = errors.New("social: oauth state user mismatch")
	ErrMissingState         = errors.New("social: oauth state missing")
	ErrInvalidRedirect      = errors.New("social: redirect uri mismatch")
	ErrTokenUnavailable     = errors.New("social: provider credential unavailable")
	ErrReauthRequired       = errors.New("social: REAUTH_REQUIRED")
	ErrUnauthorizedPublish  = errors.New("social: unauthorized publish")
	ErrCrossTenant          = errors.New("social: cross-tenant access denied")
	ErrInvalidContent       = errors.New("social: INVALID_CONTENT")
	ErrIllegalTransition    = errors.New("social: illegal distribution transition")
	ErrDuplicateJob         = errors.New("social: duplicate distribution job")
	ErrNotRetryable         = errors.New("social: failure is not retryable")
	ErrSimulatedForbidden   = errors.New("social: simulated publication is forbidden")
)
