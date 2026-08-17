package domain

import (
	"errors"
	"fmt"
	"strings"
)

var (
	ErrUnauthorizedScopeDetected = errors.New("unauthorized implementation unit detected in codebase")
	ErrConstitutionViolation     = errors.New("engineering constitution boundary violation")
)

func ValidateConstitutionScope(authorizedUnit string, detectedUnits []string) error {
	for _, unit := range detectedUnits {
		if strings.HasPrefix(unit, "IMP-") {
			var n int
			if _, err := fmt.Sscanf(unit, "IMP-%03d", &n); err == nil {
				if n >= 7 {
					return fmt.Errorf("%w: %s is prohibited by IAG authorization rules", ErrUnauthorizedScopeDetected, unit)
				}
			}
		}
	}
	return nil
}

func VerifyPlaybookChecklist(playbook PlaybookChecklist, requiredItems []string) ([]string, bool) {
	var missing []string
	for _, req := range requiredItems {
		if !playbook.Items[req] {
			missing = append(missing, req)
		}
	}
	return missing, len(missing) == 0
}
