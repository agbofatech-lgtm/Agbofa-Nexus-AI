package autonomy

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
)

const (
	StatusPending          = "PENDING"
	StatusRunning          = "RUNNING"
	StatusWaitingApproval  = "WAITING_APPROVAL"
	StatusSucceeded        = "SUCCEEDED"
	StatusFailed           = "FAILED"
	StatusCancelled        = "CANCELLED"
	StatusTimedOut         = "TIMED_OUT"
	StatusBlocked          = "BLOCKED"
	VerdictAllow           = "ALLOW"
	VerdictDeny            = "DENY"
	VerdictApproval        = "REQUIRE_HUMAN_APPROVAL"
	VerdictBlocked         = "BLOCKED"
	VerdictThrottled       = "THROTTLED"
)

var ForbiddenTools = []string{
	"raw_oauth_token", "direct_database", "shell_exec", "direct_social_api",
	"bypass_policy", "bypass_approval", "bypass_truth", "bypass_compliance", "bypass_brand", "bypass_phase04",
}

type Phase04Schedule func(tenant, actor, contentID, body string, brand bool) (jobID string, err error)

type Plane struct {
	mu            sync.Mutex
	Production    bool
	maxConcurrent int
	maxDepth      int
	budget        int
	ratePerMin    int
	enabled       map[string]map[string]bool
	kill          map[string]string
	level         map[string]int
	execs         map[string]*Execution
	idem          map[string]string
	approvals     map[string]*Approval
	memories      []Memory
	spend         map[string]int
	rate          map[string][]time.Time
	running       map[string]int
	Phase04       Phase04Schedule
	Truth         func(string) (bool, error)    // Truth engine for Phase 08
	Compliance    func(string) (bool, error)    // Compliance engine for Phase 08
}

type Execution struct {
	ID, WorkflowID, AgentID, TenantID, ActorID, CorrelationID, Status, Error string
	Start, End                                                                time.Time
	Result                                                                    map[string]any
	Policy                                                                    []DecisionRecord
	ToolCalls                                                                 []map[string]any
	Depth                                                                     int
}

type DecisionRecord struct {
	Verdict, Code, Reason string
	At                    time.Time
}

type Approval struct {
	ID, TenantID, ExecutionID, Action, Target, Risk, Requester, AgentID, Fingerprint, Decision string
	Expires                                                                                      time.Time
}

type Memory struct {
	ID, TenantID, AgentID, Text string
	Deleted                     bool
}

func NewPlane() *Plane {
	return &Plane{
		Production:    false,
		maxConcurrent: 2,
		maxDepth:      1,
		budget:        100000,
		ratePerMin:    20,
		enabled:       map[string]map[string]bool{},
		kill:          map[string]string{},
		level:         map[string]int{},
		execs:         map[string]*Execution{},
		idem:          map[string]string{},
		approvals:     map[string]*Approval{},
		spend:         map[string]int{},
		rate:          map[string][]time.Time{},
		running:       map[string]int{},
		Truth:         DevelopmentTruth{}.Verify,
		Compliance:    DevelopmentCompliance{}.Check,
	}
}

func newID() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	return fmt.Sprintf("%x", b[:])
}

func fp(action, target string) string {
	sum := sha256.Sum256([]byte(action + "|" + target))
	return hex.EncodeToString(sum[:16])
}

func (p *Plane) Enable(tenant, agent string, actor authz.Principal) error {
	if actor.TenantID != tenant || !CanMutateControl(actor) {
		return fmt.Errorf("UNAUTHORIZED_AGENT")
	}
	if _, ok := LookupAgent(agent); !ok {
		return fmt.Errorf("INVALID_AGENT")
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.enabled[tenant] == nil {
		p.enabled[tenant] = map[string]bool{}
	}
	p.enabled[tenant][agent] = true
	return nil
}

func (p *Plane) SetKill(tenant string, actor authz.Principal, engaged bool) error {
	if actor.TenantID != tenant || !CanMutateControl(actor) {
		return fmt.Errorf("DENIED")
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	if engaged {
		p.kill[tenant] = KillEngaged
	} else {
		p.kill[tenant] = KillArmed
	}
	return nil
}

func (p *Plane) Resolve(agentID string, actor authz.Principal) (AgentSpec, string, error) {
	if actor.SubjectID == "" || actor.TenantID == "" {
		return AgentSpec{}, "", fmt.Errorf("DENIED")
	}
	spec, ok := LookupAgent(agentID)
	if !ok {
		return AgentSpec{}, "", fmt.Errorf("INVALID_AGENT")
	}
	if spec.Implementation != MaturityImplemented {
		return spec, MaturityDeclared, fmt.Errorf("INVALID_AGENT")
	}
	p.mu.Lock()
	on := p.enabled[actor.TenantID][agentID]
	p.mu.Unlock()
	if !on {
		return spec, MaturityImplemented, fmt.Errorf("DISABLED_AGENT")
	}
	if !CanRead(actor) && !CanMutateControl(actor) {
		dec := authz.Decide(authz.Request{SubjectID: actor.SubjectID, TenantID: actor.TenantID, ResourceTenant: actor.TenantID, Roles: actor.Roles, Resource: "content", Action: "create"})
		if !dec.Allowed {
			return spec, MaturityImplemented, fmt.Errorf("UNAUTHORIZED_AGENT")
		}
	}
	editorOK := false
	for _, r := range actor.Roles {
		switch authz.Canonical(r) {
		case authz.RoleTenantOwner, authz.RoleTenantAdmin, authz.RoleEditor:
			editorOK = true
		}
	}
	if !editorOK {
		return spec, MaturityImplemented, fmt.Errorf("UNAUTHORIZED_AGENT")
	}
	return spec, MaturityExecutable, nil
}

func (p *Plane) DecideAction(tenant string, actor authz.Principal, toolID, action, risk string, truth, compliance, brand bool, approvalID string, level int, kill string) DecisionRecord {
	rec := DecisionRecord{Verdict: VerdictDeny, Code: "DENIED", Reason: "denied", At: time.Now().UTC()}
	if strings.EqualFold(kill, KillEngaged) {
		rec.Verdict, rec.Code, rec.Reason = VerdictBlocked, "KILL_SWITCH_ENGAGED", "kill switch engaged"
		return rec
	}
	if actor.TenantID != tenant {
		rec.Code, rec.Reason = "TENANT_MISMATCH", "tenant mismatch"
		return rec
	}
	for _, f := range ForbiddenTools {
		if toolID == f {
			rec.Code, rec.Reason = "FORBIDDEN_TOOL", "prohibited tool"
			return rec
		}
	}
	if tool, ok := LookupTool(toolID); ok && !tool.Implemented {
		rec.Code = "UNKNOWN_TOOL"
		return rec
	}
	if _, ok := LookupTool(toolID); !ok && toolID != "" && action != "observe" && action != "execute" {
		rec.Code = "UNKNOWN_TOOL"
		return rec
	}
	p.mu.Lock()
	remain := p.budget - p.spend[tenant]
	p.mu.Unlock()
	if remain <= 0 {
		rec.Verdict, rec.Code = VerdictBlocked, "BUDGET_EXHAUSTED"
		return rec
	}
	if level <= 0 && action != "observe" {
		rec.Verdict, rec.Code = VerdictBlocked, "AUTONOMY_DISABLED"
		return rec
	}
	high := risk == "HIGH" || action == "publish" || toolID == "publish_content" || toolID == "schedule_content"
	if high {
		if !truth {
			rec.Code = "TRUTH_REQUIRED"
			return rec
		}
		if !compliance {
			rec.Code = "COMPLIANCE_REQUIRED"
			return rec
		}
		if !brand {
			rec.Code = "BRAND_REQUIRED"
			return rec
		}
		if !p.Production {
			rec.Verdict, rec.Code = VerdictBlocked, "PRODUCTION_AUTONOMY_DISABLED"
			return rec
		}
		if approvalID == "" {
			rec.Verdict, rec.Code, rec.Reason = VerdictApproval, "APPROVAL_REQUIRED", "human approval required"
			return rec
		}
	}
	rec.Verdict, rec.Code, rec.Reason = VerdictAllow, "ALLOW", "policy allow"
	return rec
}

type ExecRequest struct {
	AgentID, WorkflowID, CorrelationID, IdempotencyKey string
	Actor                                              authz.Principal
	Tools                                              []ToolStep
	Truth, Compliance, Brand                           bool
	Depth                                              int
}

type ToolStep struct {
	ToolID, ApprovalID string
	Input              map[string]any
}

func (p *Plane) Execute(req ExecRequest) *Execution {
	ex := &Execution{
		ID: newID(), WorkflowID: req.WorkflowID, AgentID: req.AgentID,
		TenantID: req.Actor.TenantID, ActorID: req.Actor.SubjectID,
		CorrelationID: req.CorrelationID, Status: StatusPending, Start: time.Now().UTC(),
	}
	if ex.WorkflowID == "" {
		ex.WorkflowID = newID()
	}
	if ex.CorrelationID == "" {
		ex.CorrelationID = newID()
	}
	if req.IdempotencyKey != "" {
		p.mu.Lock()
		if id, ok := p.idem[req.Actor.TenantID+":"+req.IdempotencyKey]; ok {
			prev := p.execs[id]
			p.mu.Unlock()
			if prev != nil {
				return prev
			}
		} else {
			p.mu.Unlock()
		}
	}
	if req.Depth > p.maxDepth {
		ex.Status, ex.Error = StatusBlocked, "RUNAWAY"
		return ex
	}
	if _, _, err := p.Resolve(req.AgentID, req.Actor); err != nil {
		ex.Status, ex.Error = StatusBlocked, err.Error()
		p.store(ex, req.IdempotencyKey)
		return ex
	}
	p.mu.Lock()
	if p.kill[req.Actor.TenantID] == KillEngaged {
		p.mu.Unlock()
		ex.Status, ex.Error = StatusBlocked, "KILL_SWITCH_ENGAGED"
		p.store(ex, req.IdempotencyKey)
		return ex
	}
	if p.running[req.Actor.TenantID] >= p.maxConcurrent {
		p.mu.Unlock()
		ex.Status, ex.Error = StatusBlocked, "CONCURRENCY_LIMIT"
		p.store(ex, req.IdempotencyKey)
		return ex
	}
	p.running[req.Actor.TenantID]++
	p.mu.Unlock()
	defer func() {
		p.mu.Lock()
		p.running[req.Actor.TenantID]--
		if p.running[req.Actor.TenantID] < 0 {
			p.running[req.Actor.TenantID] = 0
		}
		p.mu.Unlock()
	}()
	ex.Status = StatusRunning
	spec, _ := LookupAgent(req.AgentID)
	if len(spec.Tools) == 0 && len(req.Tools) == 0 {
		ex.Status = StatusSucceeded
		ex.Result = map[string]any{"observed": true, "provider_called": false, "production_autonomy": p.Production}
		ex.End = time.Now().UTC()
		p.store(ex, req.IdempotencyKey)
		return ex
	}
	level := 3
	kill := KillArmed
	p.mu.Lock()
	if v, ok := p.level[req.Actor.TenantID]; ok {
		level = v
	}
	if v, ok := p.kill[req.Actor.TenantID]; ok {
		kill = v
	}
	p.mu.Unlock()
	for _, step := range req.Tools {
		if forbidden(step.ToolID) {
			ex.Status, ex.Error = StatusFailed, "FORBIDDEN_TOOL"
			ex.End = time.Now().UTC()
			p.store(ex, req.IdempotencyKey)
			return ex
		}
		tool, ok := LookupTool(step.ToolID)
		if !ok {
			ex.Status, ex.Error = StatusFailed, "UNKNOWN_TOOL"
			ex.End = time.Now().UTC()
			p.store(ex, req.IdempotencyKey)
			return ex
		}
		granted := false
		for _, t := range spec.Tools {
			if t == step.ToolID {
				granted = true
			}
		}
		if !granted {
			ex.Status, ex.Error = StatusFailed, "UNAUTHORIZED_TOOL"
			ex.End = time.Now().UTC()
			p.store(ex, req.IdempotencyKey)
			return ex
		}
		if tid, _ := step.Input["tenant_id"].(string); tid != "" && tid != req.Actor.TenantID {
			ex.Status, ex.Error = StatusFailed, "WRONG_TENANT"
			ex.End = time.Now().UTC()
			p.store(ex, req.IdempotencyKey)
			return ex
		}
		text := contentText(step.Input)
		truthOK, truthCode := p.evalTruth(text)
		compOK, compCode := p.evalCompliance(text)
		if tool.RiskLevel == "HIGH" || step.ToolID == "publish_content" || step.ToolID == "schedule_content" {
			if !truthOK {
				ex.Status, ex.Error = StatusBlocked, truthCode
				ex.End = time.Now().UTC()
				p.store(ex, req.IdempotencyKey)
				return ex
			}
			if !compOK {
				ex.Status, ex.Error = StatusBlocked, compCode
				ex.End = time.Now().UTC()
				p.store(ex, req.IdempotencyKey)
				return ex
			}
		}
		dec := p.DecideAction(req.Actor.TenantID, req.Actor, step.ToolID, step.ToolID, tool.RiskLevel, truthOK, compOK, req.Brand, step.ApprovalID, level, kill)
		ex.Policy = append(ex.Policy, dec)
		if dec.Verdict == VerdictApproval {
			ap := &Approval{ID: newID(), TenantID: req.Actor.TenantID, ExecutionID: ex.ID, Action: step.ToolID, Target: fmt.Sprint(step.Input["content_id"]), Risk: tool.RiskLevel, Requester: req.Actor.SubjectID, AgentID: req.AgentID, Fingerprint: fp(step.ToolID, fmt.Sprint(step.Input["content_id"])), Decision: TicketAwait, Expires: time.Now().UTC().Add(24 * time.Hour)}
			p.mu.Lock()
			p.approvals[ap.ID] = ap
			p.mu.Unlock()
			ex.Status = StatusWaitingApproval
			ex.ToolCalls = append(ex.ToolCalls, map[string]any{"tool": step.ToolID, "approval_id": ap.ID})
			p.store(ex, req.IdempotencyKey)
			return ex
		}
		if dec.Verdict != VerdictAllow {
			if dec.Verdict == VerdictBlocked {
				ex.Status = StatusBlocked
			} else {
				ex.Status = StatusFailed
			}
			ex.Error = dec.Code
			ex.End = time.Now().UTC()
			p.store(ex, req.IdempotencyKey)
			return ex
		}
		out, err := p.runTool(step.ToolID, req.Actor, step.Input, req.Brand)
		call := map[string]any{"tool": step.ToolID, "output": out}
		if err != nil {
			ex.Status, ex.Error = StatusFailed, err.Error()
			ex.ToolCalls = append(ex.ToolCalls, call)
			ex.End = time.Now().UTC()
			p.store(ex, req.IdempotencyKey)
			return ex
		}
		ex.ToolCalls = append(ex.ToolCalls, call)
	}
	ex.Status = StatusSucceeded
	ex.Result = map[string]any{"provider_called": false, "production_autonomy": p.Production, "via": "phase07_control_plane"}
	ex.End = time.Now().UTC()
	p.store(ex, req.IdempotencyKey)
	return ex
}

func (p *Plane) runTool(id string, actor authz.Principal, in map[string]any, brand bool) (map[string]any, error) {
	switch id {
	case "analyze_story", "adapt_content":
		return map[string]any{"provider_called": false}, nil
	case "generate_content":
		p.mu.Lock()
		p.spend[actor.TenantID] += 8
		p.mu.Unlock()
		return map[string]any{"text": "DRAFT", "cost_source": "ESTIMATED", "provider_called": false}, nil
	case "validate_facts":
		ok, code := p.evalTruth(fmt.Sprint(in["text"]))
		if !ok {
			return nil, fmt.Errorf("%s", code)
		}
		return map[string]any{"passed": true, "engine": "DEVELOPMENT_RULE_ENGINE"}, nil
	case "check_compliance":
		ok, code := p.evalCompliance(fmt.Sprint(in["text"]))
		if !ok {
			return nil, fmt.Errorf("%s", code)
		}
		return map[string]any{"passed": true, "engine": "DEVELOPMENT_POLICY_ENGINE"}, nil
	case "check_brand":
		if !brand && !truthy(in["brand_identity_applied"]) {
			return nil, fmt.Errorf("BRAND_REQUIRED")
		}
		return map[string]any{"passed": true, "mark": "— Agbofa Nexus AI"}, nil
	case "read_analytics":
		return nil, fmt.Errorf("DENIED")
	case "publish_content", "schedule_content":
		if p.Phase04 == nil {
			return nil, fmt.Errorf("DENIED")
		}
		if !truthy(in["brand_identity_applied"]) {
			return nil, fmt.Errorf("BRAND_REQUIRED")
		}
		job, err := p.Phase04(actor.TenantID, actor.SubjectID, fmt.Sprint(in["content_id"]), fmt.Sprint(in["body"]), true)
		if err != nil {
			return nil, err
		}
		return map[string]any{"job_id": job, "via": "phase04", "provider_called": false}, nil
	default:
		return nil, fmt.Errorf("UNKNOWN_TOOL")
	}
}

func (p *Plane) Get(id string, actor authz.Principal) (*Execution, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	ex := p.execs[id]
	if ex == nil {
		return nil, fmt.Errorf("INVALID_EXECUTION")
	}
	if ex.TenantID != actor.TenantID {
		return nil, fmt.Errorf("TENANT_MISMATCH")
	}
	return ex, nil
}

func (p *Plane) store(ex *Execution, idem string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.execs[ex.ID] = ex
	if idem != "" {
		p.idem[ex.TenantID+":"+idem] = ex.ID
	}
}

func forbidden(id string) bool {
	for _, f := range ForbiddenTools {
		if f == id {
			return true
		}
	}
	return false
}

func truthy(v any) bool {
	b, ok := v.(bool)
	return ok && b
}

func UniqueAgentIDs() bool {
	seen := map[string]struct{}{}
	for _, a := range CanonicalAgents() {
		if _, ok := seen[a.ID]; ok {
			return false
		}
		seen[a.ID] = struct{}{}
	}
	return len(seen) == 28
}

func contentText(in map[string]any) string {
	if in == nil {
		return ""
	}
	if v, ok := in["body"]; ok && fmt.Sprint(v) != "" && fmt.Sprint(v) != "<nil>" {
		return fmt.Sprint(v)
	}
	return fmt.Sprint(in["text"])
}

func (p *Plane) evalTruth(text string) (bool, string) {
	if p.Truth == nil {
		return false, "TRUTH_UNAVAILABLE"
	}
	ok, err := p.Truth(text)
	if err != nil {
		return false, "TRUTH_UNAVAILABLE"
	}
	if !ok {
		return false, "TRUTH_FAILED"
	}
	return true, ""
}

func (p *Plane) evalCompliance(text string) (bool, string) {
	if p.Compliance == nil {
		return false, "COMPLIANCE_UNAVAILABLE"
	}
	ok, err := p.Compliance(text)
	if err != nil {
		return false, "COMPLIANCE_UNAVAILABLE"
	}
	if !ok {
		return false, "COMPLIANCE_FAILED"
	}
	return true, ""
}