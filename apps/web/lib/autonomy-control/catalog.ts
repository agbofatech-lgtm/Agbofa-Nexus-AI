import type { AgentSpec, JsonSchema, ToolSpec } from "./types.ts";

const io: JsonSchema = {
  type: "object",
  required: ["tenant_id"],
  properties: { tenant_id: { type: "string" }, text: { type: "string" } },
};

const DECLARED: AgentSpec["implementation"] = "DECLARED";
const IMPLEMENTED: AgentSpec["implementation"] = "IMPLEMENTED";

function agent(
  id: string,
  name: string,
  category: string,
  purpose: string,
  implementation: AgentSpec["implementation"],
  tools: string[],
  riskLevel: AgentSpec["riskLevel"],
  approvalRequired: boolean,
  permissions: string[],
): AgentSpec {
  return {
    id,
    name,
    purpose,
    category,
    capabilities: tools.length ? tools : ["none_implemented"],
    tools,
    permissions,
    riskLevel,
    inputSchema: io,
    outputSchema: io,
    modelProvider: "registry:estimated",
    executionPolicy: approvalRequired ? "APPROVAL_GATED" : "BOUNDED_LOW_RISK",
    approvalRequired,
    tenantScope: "caller",
    enabled: false,
    implementation,
    certified: false,
  };
}

/** Canonical 28-agent catalog. Declared ≠ executable. Certified is never auto-assigned. */
export function canonicalAgents(): AgentSpec[] {
  return [
    agent("AGT-001", "Trend Intelligence Agent", "content", "Detect trends from approved sources.", DECLARED, [], "LOW", false, ["read:sources"]),
    agent("AGT-002", "Content Strategist Agent", "content", "Propose content strategy.", DECLARED, [], "LOW", false, ["read:content"]),
    agent("AGT-003", "Research Agent", "content", "Analyze an approved story brief.", IMPLEMENTED, ["analyze_story"], "LOW", false, ["invoke:analyze_story"]),
    agent("AGT-004", "Writer Agent", "content", "Draft content via the LLM gateway port.", IMPLEMENTED, ["generate_content"], "MEDIUM", false, ["invoke:generate_content"]),
    agent("AGT-005", "Editor Agent", "content", "Edit drafts.", DECLARED, [], "LOW", false, ["read:content"]),
    agent("AGT-006", "Headline & Hook Agent", "content", "Propose headlines.", DECLARED, [], "LOW", false, ["invoke:generate_content"]),
    agent("AGT-007", "Visual Content Agent", "content", "Propose visual treatments.", DECLARED, [], "MEDIUM", false, ["read:content"]),
    agent("AGT-008", "Fact-Checker Agent", "verification", "Run truth validation through the Truth port (fail-closed).", IMPLEMENTED, ["validate_facts"], "LOW", false, ["invoke:validate_facts"]),
    agent("AGT-009", "Plagiarism & Originality Agent", "verification", "Originality checks.", DECLARED, [], "LOW", false, ["read:content"]),
    agent("AGT-010", "Quality Assurance Agent", "verification", "QA review.", DECLARED, [], "LOW", false, ["read:content"]),
    agent("AGT-011", "Content Safety Agent", "verification", "Compliance check through the Compliance port (fail-closed).", IMPLEMENTED, ["check_compliance"], "LOW", false, ["invoke:check_compliance"]),
    agent("AGT-012", "Bias Detection Agent", "verification", "Bias review.", DECLARED, [], "LOW", false, ["read:content"]),
    agent("AGT-013", "Platform Adaptation Agent", "distribution", "Adapt copy for a platform without publishing.", IMPLEMENTED, ["adapt_content", "check_brand"], "LOW", false, ["invoke:adapt_content", "invoke:check_brand"]),
    agent("AGT-014", "Publishing & Scheduling Agent", "distribution", "Schedule or publish ONLY through Phase 04.", IMPLEMENTED, ["schedule_content", "publish_content", "check_brand"], "HIGH", true, ["invoke:schedule_content", "invoke:publish_content"]),
    agent("AGT-015", "SEO & Discovery Agent", "distribution", "SEO recommendations.", DECLARED, [], "LOW", false, ["read:content"]),
    agent("AGT-016", "Community Engagement Agent", "distribution", "Community replies.", DECLARED, [], "MEDIUM", true, ["read:content"]),
    agent("AGT-017", "Performance Analyst Agent", "analytics", "Read analytics through the Analytics port (fail-closed).", IMPLEMENTED, ["read_analytics"], "LOW", false, ["invoke:read_analytics"]),
    agent("AGT-018", "Content Optimisation Agent", "analytics", "Optimisation recommendations.", DECLARED, [], "LOW", false, ["read:analytics"]),
    agent("AGT-019", "Audience Intelligence Agent", "analytics", "Audience insights.", DECLARED, [], "LOW", false, ["read:analytics"]),
    agent("AGT-020", "Competitive Intelligence Agent", "analytics", "Competitor observations.", DECLARED, [], "LOW", false, ["read:analytics"]),
    agent("AGT-021", "Advertising Optimisation Agent", "monetisation", "Paid ads — high risk.", DECLARED, [], "HIGH", true, ["invoke:paid_growth"]),
    agent("AGT-022", "Affiliate & Commerce Agent", "monetisation", "Affiliate — high risk.", DECLARED, [], "HIGH", true, ["invoke:paid_growth"]),
    agent("AGT-023", "Sponsorship & Partnership Agent", "monetisation", "Sponsorships — high risk.", DECLARED, [], "HIGH", true, ["invoke:paid_growth"]),
    agent("AGT-024", "Subscription & Paywall Agent", "monetisation", "Paywall — high risk.", DECLARED, [], "HIGH", true, ["invoke:paid_growth"]),
    agent("AGT-025", "Orchestrator Agent", "platform", "Drive the controlled workflow; cannot publish directly.", IMPLEMENTED, ["analyze_story", "generate_content", "validate_facts", "check_compliance", "check_brand", "adapt_content"], "MEDIUM", true, ["invoke:analyze_story", "invoke:generate_content", "invoke:validate_facts", "invoke:check_compliance", "invoke:check_brand", "invoke:adapt_content"]),
    agent("AGT-026", "Agent Monitor & Guardian", "platform", "Observe execution posture. No side effects.", IMPLEMENTED, [], "LOW", false, ["read:autonomy"]),
    agent("AGT-027", "Platform Health Agent", "platform", "Observe platform health. No side effects.", IMPLEMENTED, [], "LOW", false, ["read:autonomy"]),
    agent("AGT-028", "Compliance & Ethics Agent", "platform", "Compliance review through the Compliance port.", IMPLEMENTED, ["check_compliance"], "LOW", false, ["invoke:check_compliance"]),
  ];
}

export function canonicalTools(): ToolSpec[] {
  const base = (partial: Omit<ToolSpec, "version" | "tenantScope" | "auditRequired" | "outputSchema"> & { auditRequired?: boolean }): ToolSpec => ({
    version: "1.0",
    tenantScope: "caller",
    auditRequired: partial.auditRequired ?? true,
    outputSchema: io,
    ...partial,
  });
  return [
    base({ id: "analyze_story", name: "Analyze story", description: "Local analysis of supplied text. No network.", inputSchema: io, permissions: ["invoke:analyze_story"], riskLevel: "LOW", sideEffects: ["none"], approvalRequired: false, timeoutMs: 5000, rateLimitPerMinute: 30, implemented: true }),
    base({ id: "generate_content", name: "Generate content", description: "LLM gateway port. Estimated cost only unless provider usage is supplied.", inputSchema: io, permissions: ["invoke:generate_content"], riskLevel: "MEDIUM", sideEffects: ["llm"], approvalRequired: false, timeoutMs: 15000, rateLimitPerMinute: 10, implemented: true }),
    base({ id: "validate_facts", name: "Validate facts", description: "Truth port. Fail-closed if unwired.", inputSchema: io, permissions: ["invoke:validate_facts"], riskLevel: "LOW", sideEffects: ["none"], approvalRequired: false, timeoutMs: 5000, rateLimitPerMinute: 20, implemented: true }),
    base({ id: "check_compliance", name: "Check compliance", description: "Compliance port. Fail-closed if unwired.", inputSchema: io, permissions: ["invoke:check_compliance"], riskLevel: "LOW", sideEffects: ["none"], approvalRequired: false, timeoutMs: 5000, rateLimitPerMinute: 20, implemented: true }),
    base({ id: "adapt_content", name: "Adapt content", description: "Rewrite text locally for a platform. Does not publish.", inputSchema: io, permissions: ["invoke:adapt_content"], riskLevel: "LOW", sideEffects: ["none"], approvalRequired: false, timeoutMs: 5000, rateLimitPerMinute: 20, implemented: true }),
    base({ id: "check_brand", name: "Check brand", description: "Brand/provenance gate used by Phase 03/04.", inputSchema: io, permissions: ["invoke:check_brand"], riskLevel: "LOW", sideEffects: ["none"], approvalRequired: false, timeoutMs: 2000, rateLimitPerMinute: 40, implemented: true }),
    base({ id: "schedule_content", name: "Schedule content", description: "Phase 04 schedule port only.", inputSchema: io, permissions: ["invoke:schedule_content"], riskLevel: "HIGH", sideEffects: ["phase04_schedule"], approvalRequired: true, timeoutMs: 8000, rateLimitPerMinute: 5, implemented: true, phase04Only: true }),
    base({ id: "publish_content", name: "Publish content", description: "Phase 04 publish/schedule port only. Never calls a social provider.", inputSchema: io, permissions: ["invoke:publish_content"], riskLevel: "HIGH", sideEffects: ["phase04_publish"], approvalRequired: true, timeoutMs: 8000, rateLimitPerMinute: 5, implemented: true, phase04Only: true }),
    base({ id: "read_analytics", name: "Read analytics", description: "Analytics port. Fail-closed if unwired.", inputSchema: io, permissions: ["invoke:read_analytics"], riskLevel: "LOW", sideEffects: ["none"], approvalRequired: false, timeoutMs: 5000, rateLimitPerMinute: 20, implemented: true }),
    base({ id: "search_news", name: "Search news", description: "Not implemented — no news backend.", inputSchema: io, permissions: ["invoke:search_news"], riskLevel: "LOW", sideEffects: ["network"], approvalRequired: false, timeoutMs: 5000, rateLimitPerMinute: 5, implemented: false }),
    base({ id: "read_source", name: "Read source", description: "Not implemented — no source fetcher.", inputSchema: io, permissions: ["invoke:read_source"], riskLevel: "LOW", sideEffects: ["network"], approvalRequired: false, timeoutMs: 5000, rateLimitPerMinute: 5, implemented: false }),
  ];
}
