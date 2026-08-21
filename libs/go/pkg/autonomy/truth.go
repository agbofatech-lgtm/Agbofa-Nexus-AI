package autonomy

import (
	"errors"
	"strings"
)

// TruthEngine is the Phase 08 verification contract.
//
//	true, nil   = verification passed
//	false, nil  = verification failed (known false / denied)
//	false, err  = verification unavailable / unknown / malformed
//
// UNKNOWN ≠ TRUE. Callers MUST NOT treat (false, error) as verified.
type TruthEngine interface {
	Verify(text string) (bool, error)
}

// DevelopmentTruth is a deterministic DEVELOPMENT / TEST rule engine.
// It is not internet verification, source corroboration, or LLM fact-checking.
type DevelopmentTruth struct{}

const TruthSafeFixture = "DEV_TRUTH_FIXTURE: local observation"

var (
	ErrTruthUnavailable = errors.New("TRUTH_UNAVAILABLE")
	truthDenied         = []string{"the earth is flat", "2+2=5", "known-false:"}
)

func (DevelopmentTruth) Kind() string { return "DEVELOPMENT_RULE_ENGINE" }

func (DevelopmentTruth) Verify(text string) (bool, error) {
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return false, ErrTruthUnavailable
	}
	lower := strings.ToLower(trimmed)
	for _, d := range truthDenied {
		if strings.Contains(lower, d) {
			return false, nil
		}
	}
	if trimmed == TruthSafeFixture {
		return true, nil
	}
	return false, ErrTruthUnavailable
}
