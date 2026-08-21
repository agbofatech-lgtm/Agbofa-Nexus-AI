package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
	"github.com/agbofa/nexus/libs/go/pkg/autonomy"
	"github.com/agbofa/nexus/libs/go/pkg/llm"
	"github.com/agbofa/nexus/services/foundation/internal/repositories"
)

type AutonomyHTTP struct {
	Store    *repositories.AutonomyStore
	Registry *llm.Registry
}

func (h AutonomyHTTP) GetControl(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	if !autonomy.CanRead(p) {
		writeErr(w, http.StatusForbidden, "permission_denied")
		return
	}
	cfg, err := h.Store.Ensure(r.Context(), p.TenantID, p.SubjectID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "control_load")
		return
	}
	domains, _ := h.Store.ListDomains(r.Context(), p.TenantID)
	policies, _ := h.Store.ListPolicies(r.Context(), p.TenantID)
	audit, _ := h.Store.ListAudit(r.Context(), p.TenantID)
	writeJSON(w, http.StatusOK, map[string]any{
		"tenant_id":         cfg.TenantID,
		"global_level":      cfg.GlobalLevel,
		"kill_switch":       cfg.KillSwitch,
		"kill_switch_by":    cfg.KillBy,
		"kill_switch_at":    cfg.KillAt,
		"levels":            autonomy.Levels(),
		"domains":           domains,
		"approval_policies": policies,
		"audit":             audit,
		"execution_reality": "REAL",
		"note":              "Control state is persisted. Simulated runs never call providers.",
	})
}

func (h AutonomyHTTP) SetLevel(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	if !autonomy.CanMutateControl(p) {
		writeErr(w, http.StatusForbidden, "permission_denied")
		return
	}
	var req struct {
		Domain string `json:"domain"`
		Level  int    `json:"level"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	if req.Domain != "" && req.Domain != "GLOBAL" && autonomy.NormalizeDomain(req.Domain) == "" {
		writeErr(w, http.StatusBadRequest, "unknown_domain")
		return
	}
	_, _ = h.Store.Ensure(r.Context(), p.TenantID, p.SubjectID)
	if err := h.Store.SetLevel(r.Context(), p.TenantID, p.SubjectID, req.Domain, autonomy.ClampLevel(req.Level)); err != nil {
		writeErr(w, http.StatusInternalServerError, "persist_failed")
		return
	}
	_ = h.Store.Audit(r.Context(), p.TenantID, p.SubjectID, "SET_LEVEL", req.Domain, "OK", "", r.Header.Get("X-Correlation-ID"))
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "level": autonomy.ClampLevel(req.Level), "domain": req.Domain})
}

func (h AutonomyHTTP) KillSwitch(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	if !autonomy.CanMutateControl(p) {
		writeErr(w, http.StatusForbidden, "permission_denied")
		return
	}
	var req struct {
		Engage bool `json:"engage"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)
	state := autonomy.KillArmed
	if req.Engage {
		state = autonomy.KillEngaged
	}
	_, _ = h.Store.Ensure(r.Context(), p.TenantID, p.SubjectID)
	if err := h.Store.SetKill(r.Context(), p.TenantID, p.SubjectID, state); err != nil {
		writeErr(w, http.StatusInternalServerError, "persist_failed")
		return
	}
	_ = h.Store.Audit(r.Context(), p.TenantID, p.SubjectID, "KILL_SWITCH", state, "OK", "", r.Header.Get("X-Correlation-ID"))
	writeJSON(w, http.StatusOK, map[string]any{
		"kill_switch":       state,
		"execution_reality": "REAL",
		"note":              "Kill-switch is persisted and blocks autonomy dispatch and Phase 04 schedule for this tenant.",
	})
}

func (h AutonomyHTTP) CreatePolicy(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	if !autonomy.CanMutateControl(p) {
		writeErr(w, http.StatusForbidden, "permission_denied")
		return
	}
	var req struct {
		Name, Domain, Trigger, Risk, Requirement string
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Name) == "" {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	if autonomy.NormalizeDomain(req.Domain) == "" {
		writeErr(w, http.StatusBadRequest, "unknown_domain")
		return
	}
	id, err := h.Store.CreatePolicy(r.Context(), p.TenantID, p.SubjectID, req.Name, autonomy.NormalizeDomain(req.Domain), req.Trigger, firstNV(req.Risk, "HIGH"), firstNV(req.Requirement, "ALWAYS"))
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "persist_failed")
		return
	}
	_ = h.Store.Audit(r.Context(), p.TenantID, p.SubjectID, "CREATE_POLICY", id, "OK", req.Name, r.Header.Get("X-Correlation-ID"))
	writeJSON(w, http.StatusOK, map[string]any{"id": id, "tenant_id": p.TenantID})
}

func (h AutonomyHTTP) RequestApproval(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	var req struct {
		Action, Domain, Resource string
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	domain := autonomy.NormalizeDomain(req.Domain)
	if domain == "" {
		writeErr(w, http.StatusBadRequest, "unknown_domain")
		return
	}
	level, kill, _ := h.Store.DomainLevel(r.Context(), p.TenantID, domain)
	dec := autonomy.Evaluate(kill, level, domain, req.Action)
	if dec.KillSwitch {
		writeErr(w, http.StatusLocked, "KILL_SWITCH_ENGAGED")
		return
	}
	id, err := h.Store.CreateTicket(r.Context(), p.TenantID, p.SubjectID, req.Action, domain, req.Resource, dec.Risk, r.Header.Get("X-Correlation-ID"), autonomy.TicketExpiry(time.Now()))
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "persist_failed")
		return
	}
	_ = h.Store.Audit(r.Context(), p.TenantID, p.SubjectID, "REQUEST_APPROVAL", id, autonomy.TicketAwait, req.Action, r.Header.Get("X-Correlation-ID"))
	writeJSON(w, http.StatusOK, map[string]any{"id": id, "status": autonomy.TicketAwait, "executed": false})
}

func (h AutonomyHTTP) DecideApproval(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	if !autonomy.CanMutateControl(p) {
		writeErr(w, http.StatusForbidden, "permission_denied")
		return
	}
	var req struct {
		ID, Status, Reason string
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ID == "" {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	st := strings.ToUpper(req.Status)
	switch st {
	case autonomy.TicketOK, autonomy.TicketReject, autonomy.TicketCancel:
	default:
		writeErr(w, http.StatusBadRequest, "invalid_status")
		return
	}
	ticket, err := h.Store.GetTicket(r.Context(), p.TenantID, req.ID)
	if err != nil {
		writeErr(w, http.StatusNotFound, "not_found")
		return
	}
	if ticket.Requester == p.SubjectID && ticket.Risk == "HIGH" && st == autonomy.TicketOK {
		writeErr(w, http.StatusForbidden, "self_approval_denied")
		return
	}
	if err := h.Store.DecideTicket(r.Context(), p.TenantID, req.ID, p.SubjectID, st, req.Reason); err != nil {
		writeErr(w, http.StatusConflict, "illegal_transition")
		return
	}
	_ = h.Store.Audit(r.Context(), p.TenantID, p.SubjectID, "DECIDE_APPROVAL", req.ID, st, req.Reason, r.Header.Get("X-Correlation-ID"))
	writeJSON(w, http.StatusOK, map[string]any{"id": req.ID, "status": st, "executed": false})
}

func (h AutonomyHTTP) SimulateRun(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	var req struct {
		Objective, Strategy, Domain string
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Objective) == "" {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	domain := autonomy.NormalizeDomain(firstNV(req.Domain, autonomy.DomainStrategy))
	level, kill, _ := h.Store.DomainLevel(r.Context(), p.TenantID, domain)
	dec := autonomy.Evaluate(kill, level, domain, "simulate")
	fp := autonomy.SimulateFingerprint(p.TenantID, req.Objective, req.Strategy)
	result := map[string]any{
		"kind":              "SIMULATION",
		"execution_reality": "SIMULATION",
		"objective":         req.Objective,
		"strategy":          req.Strategy,
		"domain":            domain,
		"policy":            dec,
		"fingerprint":       fp,
		"projected_actions": []string{"observe", "analyze", "recommend"},
		"projected_cost":    map[string]any{"source": "ESTIMATED", "note": "no provider billed"},
		"projected_result":  "deterministic simulation record",
		"confidence":        "LOW",
		"risks":             []string{"not a real campaign", "not a real publish", "not a real spend"},
		"provider_called":   false,
		"money_spent":       false,
		"content_published": false,
	}
	raw, _ := json.Marshal(result)
	id, created, err := h.Store.SaveRun(r.Context(), p.TenantID, p.SubjectID, req.Objective, req.Strategy, fp, string(raw))
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "persist_failed")
		return
	}
	_ = h.Store.Audit(r.Context(), p.TenantID, p.SubjectID, "SIMULATE_RUN", id, "SIMULATION", req.Objective, r.Header.Get("X-Correlation-ID"))
	writeJSON(w, http.StatusOK, map[string]any{"id": id, "created": created, "result": result})
}

func (h AutonomyHTTP) ListRuns(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	runs, err := h.Store.ListRuns(r.Context(), p.TenantID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "list_failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"runs": runs, "execution_reality": "SIMULATION"})
}

func (h AutonomyHTTP) CreateMemory(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	if !autonomy.CanWriteMemory(p) {
		writeErr(w, http.StatusForbidden, "permission_denied")
		return
	}
	var req struct {
		Insight, Evidence, Source, Classification, Confidence, Intent string
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Insight) == "" {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	if err := autonomy.ForbidPrivilegeUse(req.Insight + " " + req.Intent); err != nil {
		writeErr(w, http.StatusForbidden, "memory_privilege_denied")
		return
	}
	id, err := h.Store.CreateMemory(r.Context(), p.TenantID, p.SubjectID, req.Insight, req.Evidence, req.Source, firstNV(req.Classification, "OBSERVATION"), firstNV(req.Confidence, "LOW"))
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "persist_failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"id": id, "privileged": false})
}

func (h AutonomyHTTP) ListMemories(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	list, err := h.Store.ListMemories(r.Context(), p.TenantID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "list_failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"memories": list})
}

func (h AutonomyHTTP) ApplyMemoryAsPrivilege(w http.ResponseWriter, r *http.Request) {
	writeErr(w, http.StatusForbidden, "memory_privilege_denied")
}

func (h AutonomyHTTP) CreateScenario(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	var req struct {
		Name              string  `json:"name"`
		Frequency         float64 `json:"frequency"`
		Quality           float64 `json:"quality"`
		CostBias          float64 `json:"cost_bias"`
		Assumptions       []string
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Name) == "" {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	proj := autonomy.ProjectScenario(req.Frequency, req.Quality, req.CostBias)
	assumptions, _ := json.Marshal(append(req.Assumptions, "not historical actuals"))
	projection, _ := json.Marshal(proj)
	id, err := h.Store.CreateScenario(r.Context(), p.TenantID, p.SubjectID, req.Name, string(assumptions), string(projection))
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "persist_failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"id": id, "projection": proj, "kind": "PROJECTED"})
}

func (h AutonomyHTTP) ListScenarios(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	list, err := h.Store.ListScenarios(r.Context(), p.TenantID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "list_failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"scenarios": list})
}

func (h AutonomyHTTP) Usage(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	list, err := h.Store.ListUsage(r.Context(), p.TenantID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "list_failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"usage": list, "cost_source": "ESTIMATED", "note": "Estimated micros from the model registry. Not an invoice."})
}

func (h AutonomyHTTP) Routing(w http.ResponseWriter, r *http.Request) {
	p, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	_ = p
	var req struct {
		Mode string `json:"mode"`
		Task string `json:"task"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)
	reg := h.Registry
	if reg == nil {
		reg = llm.DefaultRegistry()
	}
	out := autonomy.RouteStrategy(req.Mode, reg)
	out["task"] = firstNV(req.Task, "generic")
	out["complexity"] = "MEDIUM"
	writeJSON(w, http.StatusOK, out)
}

func (h AutonomyHTTP) Strategies(w http.ResponseWriter, r *http.Request) {
	if _, ok := authz.PrincipalFrom(r.Context()); !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	reg := h.Registry
	if reg == nil {
		reg = llm.DefaultRegistry()
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"strategies": []any{
			autonomy.RouteStrategy("HIGH_QUALITY", reg),
			autonomy.RouteStrategy("BALANCED", reg),
			autonomy.RouteStrategy("LOW_COST", reg),
		},
		"execution_reality": "ESTIMATED",
	})
}
