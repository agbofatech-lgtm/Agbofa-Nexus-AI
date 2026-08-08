package application

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/compliance/internal/domain"
)

type PrivacySafetyPolicyService struct {
	auditRepo domain.ComplianceAuditRepository
	aiProvider llm.Provider
	audit      AuditLogger
}

func NewPrivacySafetyPolicyService(
	auditRepo domain.ComplianceAuditRepository,
	aiProvider llm.Provider,
	audit AuditLogger,
) *PrivacySafetyPolicyService {
	return &PrivacySafetyPolicyService{
		auditRepo:  auditRepo,
		aiProvider: aiProvider,
		audit:      audit,
	}
}

func (s *PrivacySafetyPolicyService) EvaluatePrivacyAndPII(
	ctx context.Context,
	tenantID, packageID, content string,
) (domain.PrivacyResult, error) {
	passed := true
	score := 0.96
	piiDetected := false

	if s.aiProvider != nil {
		req := llm.CompletionRequest{
			TenantID: tenantID,
			Model:    "pii-detector-v1",
			Messages: []llm.Message{
				{Role: "system", Content: "Check for unmasked personally identifiable information (PII). Reply PII_DETECTED if found."},
				{Role: "user", Content: content},
			},
		}
		resp, err := s.aiProvider.Generate(ctx, req)
		if err == nil && strings.Contains(strings.ToUpper(resp.Content), "PII_DETECTED") {
			passed = false
			score = 0.20
			piiDetected = true
		}
	}

	if strings.Contains(content, "SSN:") || strings.Contains(content, "CONFIDENTIAL_PII") {
		passed = false
		score = 0.15
		piiDetected = true
	}

	res := domain.PrivacyResult{
		Passed:      passed,
		Score:       score,
		PIIDetected: piiDetected,
	}

	ts := time.Now().Unix()
	hash := domain.GenerateComplianceHash(tenantID, packageID, "PRIVACY_PII_CHECK", fmt.Sprintf("%v", passed), "SVC-061", ts)
	if s.auditRepo != nil {
		_ = s.auditRepo.AppendRecord(domain.ComplianceAuditRecord{
			RecordID:          fmt.Sprintf("aud-priv-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			PackageID:         packageID,
			CheckType:         "PRIVACY_PII_CHECK",
			ResultStatus:      fmt.Sprintf("PASSED=%v PII=%v", passed, piiDetected),
			Actor:             "SVC-061",
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	return res, nil
}

func (s *PrivacySafetyPolicyService) EvaluateAISafetyAndEthics(
	ctx context.Context,
	tenantID, packageID, content string,
	misinfoFlagInherited bool,
) (domain.AISafetyResult, error) {
	passed := true
	score := 0.95

	if misinfoFlagInherited {
		passed = false
		score = 0.10
	} else if s.aiProvider != nil {
		req := llm.CompletionRequest{
			TenantID: tenantID,
			Model:    "ai-safety-reviewer-v1",
			Messages: []llm.Message{
				{Role: "system", Content: "Check AI safety/ethics compliance. Reply UNSAFE if ethical/safety violation detected."},
				{Role: "user", Content: content},
			},
		}
		resp, err := s.aiProvider.Generate(ctx, req)
		if err == nil && strings.Contains(strings.ToUpper(resp.Content), "UNSAFE") {
			passed = false
			score = 0.25
		}
	}

	res := domain.AISafetyResult{
		Passed:               passed,
		Score:                score,
		MisinfoFlagInherited: misinfoFlagInherited,
	}

	ts := time.Now().Unix()
	hash := domain.GenerateComplianceHash(tenantID, packageID, "AI_SAFETY_REVIEW", fmt.Sprintf("%v", passed), "SVC-062", ts)
	if s.auditRepo != nil {
		_ = s.auditRepo.AppendRecord(domain.ComplianceAuditRecord{
			RecordID:          fmt.Sprintf("aud-safe-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			PackageID:         packageID,
			CheckType:         "AI_SAFETY_REVIEW",
			ResultStatus:      fmt.Sprintf("PASSED=%v MISINFO=%v", passed, misinfoFlagInherited),
			Actor:             "SVC-062",
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	return res, nil
}

func (s *PrivacySafetyPolicyService) EvaluatePlatformPolicyCompliance(
	ctx context.Context,
	tenantID, packageID string,
	targetChannels []string,
	content string,
) (domain.PlatformPolicyResult, error) {
	passed := true
	score := 0.95
	var violations []string

	for _, ch := range targetChannels {
		if ch == "TWITTER" && len(content) > 28000 {
			violations = append(violations, "channel_length_exceeded_"+ch)
			passed = false
			score = 0.65
		}
	}

	res := domain.PlatformPolicyResult{
		Passed:            passed,
		Score:             score,
		ChannelViolations: violations,
	}

	ts := time.Now().Unix()
	hash := domain.GenerateComplianceHash(tenantID, packageID, "PLATFORM_POLICY", fmt.Sprintf("%v", passed), "SVC-063", ts)
	if s.auditRepo != nil {
		_ = s.auditRepo.AppendRecord(domain.ComplianceAuditRecord{
			RecordID:          fmt.Sprintf("aud-pol-%d", time.Now().UnixNano()),
			TenantID:          tenantID,
			PackageID:         packageID,
			CheckType:         "PLATFORM_POLICY",
			ResultStatus:      fmt.Sprintf("PASSED=%v", passed),
			Actor:             "SVC-063",
			CryptographicHash: hash,
			Timestamp:         time.Now(),
		})
	}

	return res, nil
}
