package publish

import (
	"fmt"

	"github.com/agbofa/nexus/libs/go/pkg/social"
)

type Status string

const (
	StatusDraft             Status = "DRAFT"
	StatusPendingApproval   Status = "PENDING_APPROVAL"
	StatusApproved          Status = "APPROVED"
	StatusValidationFailed  Status = "VALIDATION_FAILED"
	StatusScheduled         Status = "SCHEDULED"
	StatusQueued            Status = "QUEUED"
	StatusPublishing        Status = "PUBLISHING"
	StatusPublished         Status = "PUBLISHED"
	StatusPendingVerify     Status = "PUBLISHED_PENDING_VERIFICATION"
	StatusRetryWaiting      Status = "RETRY_WAITING"
	StatusFailed            Status = "FAILED"
	StatusDeadLetter        Status = "DEAD_LETTER"
	StatusCancelled         Status = "CANCELLED"
	StatusReauthRequired    Status = "REAUTH_REQUIRED"
)

func CanTransition(from, to Status) bool {
	legal := map[Status][]Status{
		StatusDraft:            {StatusPendingApproval, StatusApproved, StatusCancelled},
		StatusPendingApproval:  {StatusApproved, StatusCancelled, StatusValidationFailed},
		StatusApproved:         {StatusScheduled, StatusQueued, StatusValidationFailed, StatusCancelled},
		StatusValidationFailed: {StatusDraft, StatusCancelled},
		StatusScheduled:        {StatusQueued, StatusCancelled},
		StatusQueued:           {StatusPublishing, StatusCancelled},
		StatusPublishing:       {StatusPublished, StatusPendingVerify, StatusRetryWaiting, StatusFailed, StatusReauthRequired, StatusDeadLetter},
		StatusPendingVerify:    {StatusPublished, StatusFailed},
		StatusRetryWaiting:     {StatusQueued, StatusDeadLetter, StatusCancelled},
		StatusFailed:           {StatusRetryWaiting, StatusCancelled, StatusDeadLetter},
		StatusReauthRequired:   {StatusRetryWaiting, StatusCancelled},
		StatusPublished:        {},
		StatusDeadLetter:       {},
		StatusCancelled:        {},
	}
	for _, allowed := range legal[from] {
		if allowed == to {
			return true
		}
	}
	return false
}

func Transition(from, to Status) error {
	if !CanTransition(from, to) {
		return fmt.Errorf("%w: %s -> %s", social.ErrIllegalTransition, from, to)
	}
	return nil
}

func ToSocial(s Status) social.JobStatus {
	switch s {
	case StatusQueued:
		return social.StatusQueued
	case StatusScheduled:
		return social.StatusScheduled
	case StatusPublishing:
		return social.StatusProcessing
	case StatusPublished, StatusPendingVerify:
		return social.StatusPublished
	case StatusFailed, StatusDeadLetter:
		return social.StatusFailed
	case StatusRetryWaiting:
		return social.StatusRetrying
	case StatusCancelled:
		return social.StatusCancelled
	case StatusReauthRequired:
		return social.StatusRequiresReauth
	default:
		return social.StatusDraft
	}
}
