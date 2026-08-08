package domain

import (
	"errors"
	"fmt"
)

var (
	ErrSourceNotFound        = errors.New("source entity not found")
	ErrIngestJobNotFound     = errors.New("ingestion job not found")
	ErrCandidateNotFound     = errors.New("story candidate not found")
	ErrStoryNotFound         = errors.New("origination story not found")
	ErrInvalidStateTransition = errors.New("invalid story state transition")
	ErrSourceInactive        = errors.New("source entity is inactive")
	ErrDownstreamBoundary    = errors.New("prohibited cross-boundary operation")
)

type SourceRepo interface {
	SaveSource(src SourceEntity) error
	FindSource(id string) (*SourceEntity, error)
	ListSources(tenantID string, activeOnly bool) ([]SourceEntity, error)
}

type IngestRepo interface {
	SaveIngestJob(job IngestJob) error
	GetIngestJob(id string) (*IngestJob, error)
}

type StoryCandidateRepo interface {
	SaveCandidate(c StoryCandidate) error
	GetCandidate(id string) (*StoryCandidate, error)
}

type OriginationStoryRepo interface {
	SaveStory(story OriginationStory) error
	GetStory(id string) (*OriginationStory, error)
}

type StoryGraphAdapter interface {
	InitializeOriginationNode(tenantID, storyID, title, sourceID string) (*GraphNodeRef, error)
}

type StoryStatePolicy struct{}

func (p StoryStatePolicy) ValidateTransition(from, to StoryState) error {
	if from == to {
		return nil
	}
	if to == StoryStateRejected {
		return nil
	}
	if from == StoryStateSubmittedForVerification {
		return fmt.Errorf("%w: story is already submitted for verification", ErrInvalidStateTransition)
	}

	valid := map[StoryState]map[StoryState]bool{
		StoryStateIngested: {
			StoryStateDetected: true,
		},
		StoryStateDetected: {
			StoryStateIdeaGenerated: true,
			StoryStatePitched:       true,
		},
		StoryStateIdeaGenerated: {
			StoryStatePitched: true,
		},
		StoryStatePitched: {
			StoryStateSubmittedForVerification: true,
		},
	}

	allowed, exists := valid[from][to]
	if !exists || !allowed {
		return fmt.Errorf("%w: cannot transition from %s to %s", ErrInvalidStateTransition, from, to)
	}
	return nil
}
