package autonomy

import (
	"errors"
	"regexp"
	"strings"
)

// ComplianceEngine is the Phase 08 policy-check contract.
//
//	true, nil   = passed the development rules
//	false, nil  = policy violation detected
//	false, err  = check unavailable / malformed
//
// UNKNOWN/ERROR ≠ COMPLIANT.
type ComplianceEngine interface {
	Check(text string) (bool, error)
}

// DevelopmentCompliance is a deterministic DEVELOPMENT / TEST policy engine.
// It is not legal compliance certification, complete privacy detection,
// comprehensive moderation, or jurisdiction-aware legal analysis.
//
// Supported detections: prohibited phrase list; simple email; US-SSN-like pattern.
// Known false positives: any string containing those patterns.
// Known false negatives / unsupported: phone, address, passport, national IDs, images, multilingual PII.
type DevelopmentCompliance struct{}

const ComplianceSafeFixture = "DEV_TRUTH_FIXTURE: local observation"

var (
	ErrComplianceUnavailable = errors.New("COMPLIANCE_UNAVAILABLE")
	complianceProhibited     = []string{"prohibited:unlicensed-medical-claim", "bypass compliance"}
	emailRE                  = regexp.MustCompile(`(?i)[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}`)
	ssnRE                    = regexp.MustCompile(`\b\d{3}-\d{2}-\d{4}\b`)
)

func (DevelopmentCompliance) Kind() string { return "DEVELOPMENT_POLICY_ENGINE" }

func (DevelopmentCompliance) Check(text string) (bool, error) {
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return false, ErrComplianceUnavailable
	}
	lower := strings.ToLower(trimmed)
	for _, p := range complianceProhibited {
		if strings.Contains(lower, p) {
			return false, nil
		}
	}
	if emailRE.MatchString(trimmed) || ssnRE.MatchString(trimmed) {
		return false, nil
	}
	return true, nil
}
