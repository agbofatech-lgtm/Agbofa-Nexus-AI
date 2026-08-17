package domain

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
)

var (
	ErrSourceNotVerified      = errors.New("source has not been verified")
	ErrClaimNotFound          = errors.New("story claim not found")
	ErrTruthStoryNotFound     = errors.New("truth story not found")
	ErrMisinfoReportNotFound  = errors.New("misinformation report not found")
	ErrInvalidTruthTransition = errors.New("invalid truth state transition")
	ErrProvenanceTampering    = errors.New("provenance ledger record tampering detected")
	ErrDownstreamBoundary     = errors.New("prohibited cross-boundary operation")
)

type SourceReliabilityRepo interface {
	SaveSourceReliability(s SourceReliability) error
	GetSourceReliability(id string) (*SourceReliability, error)
}

type ClaimRepo interface {
	SaveClaim(c StoryClaim) error
	GetClaim(id string) (*StoryClaim, error)
	ListClaimsByStory(storyID string) ([]StoryClaim, error)
}

type TruthStoryRepo interface {
	SaveTruthStory(s TruthStory) error
	GetTruthStory(id string) (*TruthStory, error)
}

type MisinfoRepo interface {
	SaveMisinfoReport(m MisinfoReport) error
	GetMisinfoReport(storyID string) (*MisinfoReport, error)
}

type ProvenanceLedgerRepo interface {
	AppendRecord(rec ProvenanceRecord) error
	GetStoryAuditTrail(storyID string) ([]ProvenanceRecord, error)
	GetMerkleRoot(tenantID string) (string, error)
}

type TruthGraphAdapter interface {
	InitializeTruthNode(tenantID, storyID, truthState string, confidence float64) (*TruthGraphNodeRef, error)
}

type TruthStatePolicy struct{}

func (p TruthStatePolicy) ValidateTransition(from, to TruthState) error {
	if from == to {
		return nil
	}
	if to == TruthStateRejected {
		return nil
	}

	valid := map[TruthState]map[TruthState]bool{
		TruthStateSubmitted: {
			TruthStateInReview: true,
		},
		TruthStateInReview: {
			TruthStateVerified: true,
			TruthStateDisputed: true,
		},
		TruthStateDisputed: {
			TruthStateInReview: true,
		},
		TruthStateVerified: {
			TruthStateDisputed: true,
		},
	}

	allowed, exists := valid[from][to]
	if !exists || !allowed {
		return fmt.Errorf("%w: cannot transition from %s to %s", ErrInvalidTruthTransition, from, to)
	}
	return nil
}

type ConfidencePolicy struct{}

func (p ConfidencePolicy) CalculateConfidence(sourceScore, claimSupportRatio float64, misinfoFlagged bool) (float64, ConfidenceTier) {
	if misinfoFlagged {
		return 0.15, ConfidenceTierMisinformation
	}
	score := (sourceScore * 0.4) + (claimSupportRatio * 0.6)
	if score > 1.0 {
		score = 1.0
	} else if score < 0.0 {
		score = 0.0
	}

	var tier ConfidenceTier
	switch {
	case score >= 0.85:
		tier = ConfidenceTierVerifiedTruth
	case score >= 0.60:
		tier = ConfidenceTierProvisional
	default:
		tier = ConfidenceTierDoubtful
	}
	return score, tier
}

func GenerateProvenanceHash(tenantID, storyID, claimID, action, actor string, ts int64) string {
	raw := fmt.Sprintf("%s:%s:%s:%s:%s:%d", tenantID, storyID, claimID, action, actor, ts)
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}
