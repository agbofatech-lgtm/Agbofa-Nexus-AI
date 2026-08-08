package domain_test

import (
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/story-graph/internal/domain"
)

func TestValidateTenantIsolation(t *testing.T) {
	if err := domain.ValidateTenantIsolation("tenant-1", "tenant-1"); err != nil {
		t.Fatalf("expected same tenant to pass, got %v", err)
	}

	if err := domain.ValidateTenantIsolation("tenant-1", "tenant-2"); !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation, got %v", err)
	}
}

func TestValidateConfidenceThreshold(t *testing.T) {
	if err := domain.ValidateConfidenceThreshold(0.88, 0.80); err != nil {
		t.Fatalf("expected high confidence to pass, got %v", err)
	}

	if err := domain.ValidateConfidenceThreshold(0.65, 0.80); !errors.Is(err, domain.ErrLowConfidenceMutation) {
		t.Fatalf("expected ErrLowConfidenceMutation, got %v", err)
	}
}

func TestSchemaConstraintConstants(t *testing.T) {
	if domain.Neo4jConstraintStoryNode == "" || domain.Neo4jConstraintEntityNode == "" {
		t.Fatalf("expected schema constraint constants defined")
	}
}
