package autonomy

import "strings"

// Maturity is computed. CERTIFIED is never assigned by this registry.
const (
	MaturityDeclared    = "DECLARED"
	MaturityImplemented = "IMPLEMENTED"
	MaturityExecutable  = "EXECUTABLE"
	MaturityCertified   = "CERTIFIED"
)

type AgentSpec struct {
	ID, Name, Purpose, Category string
	Capabilities, Tools, Permissions []string
	RiskLevel                   string
	ModelProvider               string
	ExecutionPolicy             string
	ApprovalRequired            bool
	Implementation              string
	Certified                   bool
	Enabled                     bool
}

type ToolSpec struct {
	ID, Name, Description, Version, RiskLevel string
	Permissions, SideEffects                  []string
	ApprovalRequired, AuditRequired           bool
	TimeoutMs, RatePerMinute                  int
	Implemented, Phase04Only                  bool
}

func CanonicalAgents() []AgentSpec {
	a := func(id, name, cat, purpose, impl string, tools []string, risk string, approval bool, perms []string) AgentSpec {
		return AgentSpec{
			ID: id, Name: name, Purpose: purpose, Category: cat,
			Capabilities: tools, Tools: tools, Permissions: perms,
			RiskLevel: risk, ModelProvider: "registry:estimated",
			ExecutionPolicy: map[bool]string{true: "APPROVAL_GATED", false: "BOUNDED_LOW_RISK"}[approval],
			ApprovalRequired: approval, Implementation: impl, Certified: false, Enabled: false,
		}
	}
	return []AgentSpec{
		a("AGT-001", "Trend Intelligence Agent", "content", "Detect trends.", MaturityDeclared, nil, "LOW", false, []string{"read:sources"}),
		a("AGT-002", "Content Strategist Agent", "content", "Propose strategy.", MaturityDeclared, nil, "LOW", false, []string{"read:content"}),
		a("AGT-003", "Research Agent", "content", "Analyze an approved story brief.", MaturityImplemented, []string{"analyze_story"}, "LOW", false, []string{"invoke:analyze_story"}),
		a("AGT-004", "Writer Agent", "content", "Draft via LLM gateway port.", MaturityImplemented, []string{"generate_content"}, "MEDIUM", false, []string{"invoke:generate_content"}),
		a("AGT-005", "Editor Agent", "content", "Edit drafts.", MaturityDeclared, nil, "LOW", false, []string{"read:content"}),
		a("AGT-006", "Headline & Hook Agent", "content", "Propose headlines.", MaturityDeclared, nil, "LOW", false, []string{"invoke:generate_content"}),
		a("AGT-007", "Visual Content Agent", "content", "Visual treatments.", MaturityDeclared, nil, "MEDIUM", false, []string{"read:content"}),
		a("AGT-008", "Fact-Checker Agent", "verification", "Truth port (fail-closed).", MaturityImplemented, []string{"validate_facts"}, "LOW", false, []string{"invoke:validate_facts"}),
		a("AGT-009", "Plagiarism & Originality Agent", "verification", "Originality.", MaturityDeclared, nil, "LOW", false, []string{"read:content"}),
		a("AGT-010", "Quality Assurance Agent", "verification", "QA.", MaturityDeclared, nil, "LOW", false, []string{"read:content"}),
		a("AGT-011", "Content Safety Agent", "verification", "Compliance port (fail-closed).", MaturityImplemented, []string{"check_compliance"}, "LOW", false, []string{"invoke:check_compliance"}),
		a("AGT-012", "Bias Detection Agent", "verification", "Bias review.", MaturityDeclared, nil, "LOW", false, []string{"read:content"}),
		a("AGT-013", "Platform Adaptation Agent", "distribution", "Adapt copy. Does not publish.", MaturityImplemented, []string{"adapt_content", "check_brand"}, "LOW", false, []string{"invoke:adapt_content"}),
		a("AGT-014", "Publishing & Scheduling Agent", "distribution", "Phase 04 only.", MaturityImplemented, []string{"schedule_content", "publish_content", "check_brand"}, "HIGH", true, []string{"invoke:publish_content"}),
		a("AGT-015", "SEO & Discovery Agent", "distribution", "SEO.", MaturityDeclared, nil, "LOW", false, []string{"read:content"}),
		a("AGT-016", "Community Engagement Agent", "distribution", "Community.", MaturityDeclared, nil, "MEDIUM", true, []string{"read:content"}),
		a("AGT-017", "Performance Analyst Agent", "analytics", "Analytics port (fail-closed).", MaturityImplemented, []string{"read_analytics"}, "LOW", false, []string{"invoke:read_analytics"}),
		a("AGT-018", "Content Optimisation Agent", "analytics", "Optimisation.", MaturityDeclared, nil, "LOW", false, []string{"read:analytics"}),
		a("AGT-019", "Audience Intelligence Agent", "analytics", "Audience.", MaturityDeclared, nil, "LOW", false, []string{"read:analytics"}),
		a("AGT-020", "Competitive Intelligence Agent", "analytics", "Competitors.", MaturityDeclared, nil, "LOW", false, []string{"read:analytics"}),
		a("AGT-021", "Advertising Optimisation Agent", "monetisation", "Paid ads.", MaturityDeclared, nil, "HIGH", true, []string{"invoke:paid_growth"}),
		a("AGT-022", "Affiliate & Commerce Agent", "monetisation", "Affiliate.", MaturityDeclared, nil, "HIGH", true, []string{"invoke:paid_growth"}),
		a("AGT-023", "Sponsorship & Partnership Agent", "monetisation", "Sponsorships.", MaturityDeclared, nil, "HIGH", true, []string{"invoke:paid_growth"}),
		a("AGT-024", "Subscription & Paywall Agent", "monetisation", "Paywall.", MaturityDeclared, nil, "HIGH", true, []string{"invoke:paid_growth"}),
		a("AGT-025", "Orchestrator Agent", "platform", "Workflow only; cannot publish directly.", MaturityImplemented, []string{"analyze_story", "generate_content", "validate_facts", "check_compliance", "check_brand", "adapt_content"}, "MEDIUM", true, []string{"invoke:analyze_story"}),
		a("AGT-026", "Agent Monitor & Guardian", "platform", "Observe. No side effects.", MaturityImplemented, nil, "LOW", false, []string{"read:autonomy"}),
		a("AGT-027", "Platform Health Agent", "platform", "Observe health. No side effects.", MaturityImplemented, nil, "LOW", false, []string{"read:autonomy"}),
		a("AGT-028", "Compliance & Ethics Agent", "platform", "Compliance port.", MaturityImplemented, []string{"check_compliance"}, "LOW", false, []string{"invoke:check_compliance"}),
	}
}

func CanonicalTools() []ToolSpec {
	t := func(id, name, desc, risk string, approval, implemented, phase04 bool) ToolSpec {
		return ToolSpec{
			ID:               id,
			Name:             name,
			Description:      desc,
			Version:          "1.0",
			RiskLevel:        risk,
			ApprovalRequired: approval,
			AuditRequired:    true,
			TimeoutMs:        8000,
			RatePerMinute:    20,
			Implemented:      implemented,
			Phase04Only:      phase04,
		}
	}
	return []ToolSpec{
		// Existing tools
		t("analyze_story", "Analyze story", "Local analysis. No network.", "LOW", false, true, false),
		t("generate_content", "Generate content", "LLM port. Estimated cost.", "MEDIUM", false, true, false),
		t("validate_facts", "Validate facts", "Truth port. Fail-closed.", "LOW", false, true, false),
		t("check_compliance", "Check compliance", "Compliance port. Fail-closed.", "LOW", false, true, false),
		t("adapt_content", "Adapt content", "Local adapt. Does not publish.", "LOW", false, true, false),
		t("check_brand", "Check brand", "Brand/provenance gate.", "LOW", false, true, false),
		t("schedule_content", "Schedule content", "Phase 04 only.", "HIGH", true, true, true),
		t("publish_content", "Publish content", "Phase 04 only. Never a social provider.", "HIGH", true, true, true),
		t("read_analytics", "Read analytics", "Analytics port. Fail-closed.", "LOW", false, true, false),
		t("search_news", "Search news", "Not implemented.", "LOW", false, false, false),
		t("read_source", "Read source", "Not implemented.", "LOW", false, false, false),

		// Add observe for safe testing (handled by runTool if we add the case; but we can keep it for completeness)
		t("observe", "Observe", "Read-only observation, no side effects.", "LOW", false, true, false),

		// Add forbidden tools so they are recognised and blocked by DecideAction
		t("raw_oauth_token", "Raw OAuth token", "Forbidden – exposes secrets.", "HIGH", false, true, false),
		t("direct_database", "Direct database access", "Forbidden – bypasses repository layer.", "HIGH", false, true, false),
		t("shell_exec", "Shell execution", "Forbidden – arbitrary command execution.", "HIGH", false, true, false),
		t("direct_social_api", "Direct social API", "Forbidden – bypasses Phase 04.", "HIGH", false, true, false),
		t("bypass_policy", "Bypass policy", "Forbidden – policy bypass.", "HIGH", false, true, false),
		t("bypass_approval", "Bypass approval", "Forbidden – approval bypass.", "HIGH", false, true, false),
		t("bypass_truth", "Bypass truth", "Forbidden – truth bypass.", "HIGH", false, true, false),
		t("bypass_compliance", "Bypass compliance", "Forbidden – compliance bypass.", "HIGH", false, true, false),
		t("bypass_brand", "Bypass brand", "Forbidden – brand bypass.", "HIGH", false, true, false),
		t("bypass_phase04", "Bypass Phase 04", "Forbidden – Phase 04 bypass.", "HIGH", false, true, false),
	}
}

func LookupAgent(id string) (AgentSpec, bool) {
	id = strings.ToUpper(strings.TrimSpace(id))
	for _, a := range CanonicalAgents() {
		if a.ID == id {
			return a, true
		}
	}
	return AgentSpec{}, false
}

func LookupTool(id string) (ToolSpec, bool) {
	id = strings.TrimSpace(id)
	for _, t := range CanonicalTools() {
		if t.ID == id {
			return t, true
		}
	}
	return ToolSpec{}, false
}