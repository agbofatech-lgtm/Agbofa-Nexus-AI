package autonomy

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
	"github.com/agbofa/nexus/libs/go/pkg/social"
)

// Levels 0–5 are governance postures. They never imply a provider was called.
const (
	LevelObserve       = 0 // OBSERVE
	LevelRecommend     = 1 // RECOMMEND
	LevelPrepare       = 2 // PREPARE
	LevelApprovalGated = 3 // APPROVAL-GATED
	LevelBounded       = 4 // BOUNDED
	LevelAutonomous    = 5 // AUTONOMOUS (still cannot self-approve high-risk)
)

const (
	DomainStrategy     = "STRATEGY"
	DomainContent      = "CONTENT"
	DomainDistribution = "DISTRIBUTION"
	DomainPublishing   = "PUBLISHING"
	DomainExperiments  = "EXPERIMENTS"
	DomainPaidGrowth   = "PAID_GROWTH"
)

const (
	KillArmed    = "ARMED"
	KillEngaged  = "ENGAGED"
	TicketAwait  = "AWAITING_APPROVAL"
	TicketOK     = "APPROVED"
	TicketReject = "REJECTED"
	TicketCancel = "CANCELLED"
	TicketExpire = "EXPIRED"
	RunSimulated = "SIMULATION"
	CostEstimated = "ESTIMATED"
	CostActual    = "ACTUAL"
	CostProjected = "PROJECTED"
)

var Domains = []string{
	DomainStrategy, DomainContent, DomainDistribution,
	DomainPublishing, DomainExperiments, DomainPaidGrowth,
}

type LevelInfo struct {
	Level       int
	Label       string
	Description string
	HumanRole   string
}

func Levels() []LevelInfo {
	return []LevelInfo{
		{0, "OBSERVE", "Read telemetry and posture. No recommendations applied. No actions.", "Human operates the system."},
		{1, "RECOMMEND", "May emit recommendations. Humans decide. No publish or spend.", "Human reviews every recommendation."},
		{2, "PREPARE", "May draft artifacts. Nothing leaves the tenant without a later gate.", "Human authorizes dispatch."},
		{3, "APPROVAL-GATED", "May queue high-impact work only as AWAITING_APPROVAL.", "Human approves or rejects."},
		{4, "BOUNDED", "Low-risk in-bounds steps may proceed. High-risk still needs approval.", "Human sets bounds and reviews exceptions."},
		{5, "AUTONOMOUS", "In-bounds work may proceed. High-risk, paid growth, publishing, and sensitive topics still require a human. Self-approval is forbidden.", "Human retains kill-switch and high-risk approval."},
	}
}

type Decision struct {
	Allowed        bool
	Awaiting       bool
	KillSwitch     bool
	Code           string
	Reason         string
	Domain         string
	Level          int
	Risk           string
	ExecutionClass string // SIMULATION | RECOMMENDATION | CONTROLLED | DENIED
}

func NormalizeDomain(d string) string {
	d = strings.ToUpper(strings.TrimSpace(d))
	switch d {
	case DomainStrategy, DomainContent, DomainDistribution, DomainPublishing, DomainExperiments, DomainPaidGrowth:
		return d
	default:
		return ""
	}
}

func ClampLevel(n int) int {
	if n < 0 {
		return 0
	}
	if n > 5 {
		return 5
	}
	return n
}

func HighRisk(domain, action string) bool {
	a := strings.ToLower(action)
	switch NormalizeDomain(domain) {
	case DomainPaidGrowth:
		return true
	case DomainPublishing:
		return strings.Contains(a, "publish") || strings.Contains(a, "distribute") || a == "execute"
	}
	if strings.Contains(a, "spend") || strings.Contains(a, "sensitive") || strings.Contains(a, "high-risk") || strings.Contains(a, "high_risk") {
		return true
	}
	return false
}

// Evaluate is the hard gate. Kill-switch and high-risk approval always win over level 5.
func Evaluate(kill string, domainLevel int, domain, action string) Decision {
	domain = NormalizeDomain(domain)
	d := Decision{Domain: domain, Level: ClampLevel(domainLevel), Risk: "LOW", ExecutionClass: "DENIED", Code: "DENIED"}
	if domain == "" {
		d.Reason = "unknown domain"
		return d
	}
	if strings.EqualFold(kill, KillEngaged) {
		d.KillSwitch = true
		d.Code = "KILL_SWITCH_ENGAGED"
		d.Reason = "human kill-switch is engaged; no autonomous or simulated dispatch"
		return d
	}
	if HighRisk(domain, action) {
		d.Risk = "HIGH"
	}
	switch d.Level {
	case LevelObserve:
		d.Code = "OBSERVE_ONLY"
		d.Reason = "level 0 observe; no action"
		return d
	case LevelRecommend:
		d.Code = "RECOMMENDATION"
		d.ExecutionClass = "RECOMMENDATION"
		d.Reason = "level 1 recommendation only"
		return d
	case LevelPrepare:
		if d.Risk == "HIGH" {
			d.Awaiting = true
			d.Code = TicketAwait
			d.Reason = "prepare cannot dispatch high-risk work"
			return d
		}
		d.Code = "PREPARE"
		d.ExecutionClass = "RECOMMENDATION"
		d.Reason = "level 2 prepare; no provider call"
		return d
	}
	if d.Risk == "HIGH" {
		d.Awaiting = true
		d.Code = TicketAwait
		d.Reason = "high-risk action requires human approval"
		return d
	}
	if d.Level >= LevelBounded {
		d.Allowed = true
		d.Code = "BOUNDED_ALLOW"
		d.ExecutionClass = "CONTROLLED"
		d.Reason = "in-bounds non-high-risk action"
		return d
	}
	d.Awaiting = true
	d.Code = TicketAwait
	d.Reason = "approval-gated domain"
	return d
}

func CanMutateControl(p authz.Principal) bool {
	dec := authz.Decide(authz.Request{
		SubjectID: p.SubjectID, TenantID: p.TenantID, ResourceTenant: p.TenantID,
		Roles: p.Roles, Resource: "autonomy", Action: "control",
	})
	return dec.Allowed
}

func CanRead(p authz.Principal) bool {
	dec := authz.Decide(authz.Request{
		SubjectID: p.SubjectID, TenantID: p.TenantID, ResourceTenant: p.TenantID,
		Roles: p.Roles, Resource: "autonomy", Action: "read",
	})
	return dec.Allowed
}

func CanWriteMemory(p authz.Principal) bool {
	dec := authz.Decide(authz.Request{
		SubjectID: p.SubjectID, TenantID: p.TenantID, ResourceTenant: p.TenantID,
		Roles: p.Roles, Resource: "memory", Action: "create",
	})
	return dec.Allowed
}

// ForbidPrivilegeUse rejects attempts to treat memory as RBAC/security policy.
func ForbidPrivilegeUse(intent string) error {
	s := strings.ToLower(intent)
	for _, needle := range []string{
		"grant role", "grant permission", "change rbac", "bypass approval",
		"bypass policy", "authorize publishing", "authorize spending",
		"system instruction", "kill switch disable",
	} {
		if strings.Contains(s, needle) {
			return fmt.Errorf("memory cannot %s", needle)
		}
	}
	return nil
}

func SimulateFingerprint(tenant, objective, strategy string) string {
	sum := sha256.Sum256([]byte(tenant + "|" + objective + "|" + strategy))
	return hex.EncodeToString(sum[:16])
}

func DefaultDomainLevel(domain string) int {
	switch NormalizeDomain(domain) {
	case DomainPublishing, DomainPaidGrowth:
		return LevelApprovalGated
	case DomainContent:
		return LevelRecommend
	default:
		return LevelObserve
	}
}

func BrandBlocksPublish(brandApplied bool) error {
	if !brandApplied {
		return social.ErrBrandingRequired
	}
	return nil
}

func TicketExpiry(now time.Time) time.Time {
	return now.UTC().Add(24 * time.Hour)
}
