package domain_test

import (
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/content-origination/internal/domain"
)

func TestStoryStatePolicy_ValidTransitions(t *testing.T) {
	policy := domain.StoryStatePolicy{}

	validPairs := [][2]domain.StoryState{
		{domain.StoryStateIngested, domain.StoryStateDetected},
		{domain.StoryStateDetected, domain.StoryStateIdeaGenerated},
		{domain.StoryStateDetected, domain.StoryStatePitched},
		{domain.StoryStateIdeaGenerated, domain.StoryStatePitched},
		{domain.StoryStatePitched, domain.StoryStateSubmittedForVerification},
		{domain.StoryStateIngested, domain.StoryStateRejected},
	}

	for _, pair := range validPairs {
		if err := policy.ValidateTransition(pair[0], pair[1]); err != nil {
			t.Fatalf("expected transition from %s to %s to be valid, got %v", pair[0], pair[1], err)
		}
	}
}

func TestStoryStatePolicy_InvalidTransitions(t *testing.T) {
	policy := domain.StoryStatePolicy{}

	invalidPairs := [][2]domain.StoryState{
		{domain.StoryStateIngested, domain.StoryStatePitched},
		{domain.StoryStateIdeaGenerated, domain.StoryStateIngested},
		{domain.StoryStateSubmittedForVerification, domain.StoryStatePitched},
	}

	for _, pair := range invalidPairs {
		if err := policy.ValidateTransition(pair[0], pair[1]); !errors.Is(err, domain.ErrInvalidStateTransition) {
			t.Fatalf("expected ErrInvalidStateTransition from %s to %s, got %v", pair[0], pair[1], err)
		}
	}
}
