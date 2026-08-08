package application_test

import (
	"context"
	"testing"

	"github.com/agbofa/nexus/services/compliance/internal/application"
)

func TestPrivacySafetyPolicyService_Checks(t *testing.T) {
	auditRepo := newInMemAuditRepo()
	provider := &mockLLMProvider{id: "ai-safe", name: "SafeReviewer", content: "SAFE"}

	svc := application.NewPrivacySafetyPolicyService(auditRepo, provider, nil)

	priv, err := svc.EvaluatePrivacyAndPII(context.Background(), "tenant-1", "pkg-200", "Clean article text without any PII")
	if err != nil || !priv.Passed || priv.PIIDetected {
		t.Fatalf("expected privacy check to pass, got err=%v priv=%v", err, priv)
	}

	privPII, _ := svc.EvaluatePrivacyAndPII(context.Background(), "tenant-1", "pkg-201", "Text with SSN: 000-00-0000")
	if privPII.Passed || !privPII.PIIDetected {
		t.Fatalf("expected privacy check to fail on SSN PII")
	}

	safe, err := svc.EvaluateAISafetyAndEthics(context.Background(), "tenant-1", "pkg-200", "Clean article", false)
	if err != nil || !safe.Passed {
		t.Fatalf("expected safety check to pass, got err=%v safe=%v", err, safe)
	}

	safeMisinfo, _ := svc.EvaluateAISafetyAndEthics(context.Background(), "tenant-1", "pkg-202", "Article with misinfo flag", true)
	if safeMisinfo.Passed {
		t.Fatalf("expected safety check to fail on inherited misinfo flag")
	}

	pol, err := svc.EvaluatePlatformPolicyCompliance(context.Background(), "tenant-1", "pkg-200", []string{"TWITTER"}, "short post")
	if err != nil || !pol.Passed {
		t.Fatalf("expected platform policy check to pass, got err=%v pol=%v", err, pol)
	}
}
