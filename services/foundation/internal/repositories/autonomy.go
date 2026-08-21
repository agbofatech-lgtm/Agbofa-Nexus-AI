package repositories

import (
	"context"
	"encoding/json"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/autonomy"
	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/jackc/pgx/v5"
)

type AutonomyStore struct{ db DB }

func NewAutonomyStore(db DB) *AutonomyStore { return &AutonomyStore{db: db} }

func (s *AutonomyStore) inTenant(ctx context.Context, tenantID string, fn func(DB) error) error {
	if tenantID == "" {
		return fn(s.db)
	}
	if p, ok := s.db.(*database.Pool); ok {
		return p.InTenantTx(ctx, tenantID, func(tx pgx.Tx) error { return fn(tx) })
	}
	return fn(s.db)
}

type AutonomyConfig struct {
	TenantID, KillSwitch, KillBy, UpdatedBy string
	GlobalLevel                             int
	KillAt, UpdatedAt                       *time.Time
}

func (s *AutonomyStore) Ensure(ctx context.Context, tenantID, actor string) (AutonomyConfig, error) {
	cfg, err := s.GetConfig(ctx, tenantID)
	if err == nil {
		return cfg, nil
	}
	now := time.Now().UTC()
	err = s.inTenant(ctx, tenantID, func(db DB) error {
		_, e := db.Exec(ctx, `
INSERT INTO autonomy_configs (tenant_id, global_level, kill_switch, updated_at, updated_by)
VALUES ($1,0,'ARMED',now(),$2)
ON CONFLICT (tenant_id) DO NOTHING`, tenantID, actor)
		if e != nil {
			return mapDB(e)
		}
		for _, d := range autonomy.Domains {
			_, e = db.Exec(ctx, `
INSERT INTO autonomy_domains (tenant_id, domain, level, approval_requirement)
VALUES ($1,$2,$3,$4)
ON CONFLICT (tenant_id, domain) DO NOTHING`,
				tenantID, d, autonomy.DefaultDomainLevel(d), "RISK_BASED")
			if e != nil {
				return mapDB(e)
			}
		}
		return nil
	})
	if err != nil {
		return AutonomyConfig{}, err
	}
	cfg, err = s.GetConfig(ctx, tenantID)
	if err != nil {
		return AutonomyConfig{TenantID: tenantID, KillSwitch: autonomy.KillArmed, GlobalLevel: 0, UpdatedBy: actor, UpdatedAt: &now}, nil
	}
	return cfg, nil
}

func (s *AutonomyStore) GetConfig(ctx context.Context, tenantID string) (AutonomyConfig, error) {
	var c AutonomyConfig
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		return db.QueryRow(ctx, `
SELECT tenant_id::text, global_level, kill_switch, kill_switch_by, kill_switch_at, updated_at, updated_by
FROM autonomy_configs WHERE tenant_id::text = $1`, tenantID).Scan(
			&c.TenantID, &c.GlobalLevel, &c.KillSwitch, &c.KillBy, &c.KillAt, &c.UpdatedAt, &c.UpdatedBy)
	})
	return c, mapDB(err)
}

type DomainRow struct {
	Domain, Requirement, Restrictions string
	Level                             int
}

func (s *AutonomyStore) ListDomains(ctx context.Context, tenantID string) ([]DomainRow, error) {
	var out []DomainRow
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		rows, err := db.Query(ctx, `SELECT domain, level, approval_requirement, restrictions FROM autonomy_domains WHERE tenant_id::text = $1 ORDER BY domain`, tenantID)
		if err != nil {
			return mapDB(err)
		}
		defer rows.Close()
		for rows.Next() {
			var d DomainRow
			if err := rows.Scan(&d.Domain, &d.Level, &d.Requirement, &d.Restrictions); err != nil {
				return err
			}
			out = append(out, d)
		}
		return rows.Err()
	})
	return out, err
}

func (s *AutonomyStore) SetLevel(ctx context.Context, tenantID, actor, domain string, level int) error {
	return s.inTenant(ctx, tenantID, func(db DB) error {
		if domain == "" || domain == "GLOBAL" {
			_, err := db.Exec(ctx, `UPDATE autonomy_configs SET global_level=$2, updated_at=now(), updated_by=$3 WHERE tenant_id::text=$1`, tenantID, level, actor)
			return mapDB(err)
		}
		_, err := db.Exec(ctx, `
INSERT INTO autonomy_domains (tenant_id, domain, level) VALUES ($1,$2,$3)
ON CONFLICT (tenant_id, domain) DO UPDATE SET level=EXCLUDED.level, updated_at=now()`, tenantID, domain, level)
		return mapDB(err)
	})
}

func (s *AutonomyStore) SetKill(ctx context.Context, tenantID, actor, state string) error {
	return s.inTenant(ctx, tenantID, func(db DB) error {
		_, err := db.Exec(ctx, `
UPDATE autonomy_configs SET kill_switch=$2, kill_switch_by=$3, kill_switch_at=now(), updated_at=now(), updated_by=$3
WHERE tenant_id::text=$1`, tenantID, state, actor)
		return mapDB(err)
	})
}

func (s *AutonomyStore) DomainLevel(ctx context.Context, tenantID, domain string) (int, string, error) {
	var level int
	var kill string
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		_ = db.QueryRow(ctx, `SELECT kill_switch FROM autonomy_configs WHERE tenant_id::text=$1`, tenantID).Scan(&kill)
		if kill == "" {
			kill = autonomy.KillArmed
		}
		qerr := db.QueryRow(ctx, `SELECT level FROM autonomy_domains WHERE tenant_id::text=$1 AND domain=$2`, tenantID, domain).Scan(&level)
		if qerr != nil {
			level = autonomy.DefaultDomainLevel(domain)
		}
		return nil
	})
	return level, kill, err
}

func (s *AutonomyStore) CreatePolicy(ctx context.Context, tenantID, actor, name, domain, trigger, risk, req string) (string, error) {
	id, err := newID()
	if err != nil {
		return "", err
	}
	err = s.inTenant(ctx, tenantID, func(db DB) error {
		_, e := db.Exec(ctx, `
INSERT INTO approval_policies (id, tenant_id, name, domain, trigger, risk, requirement, created_by)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, id, tenantID, name, domain, trigger, risk, req, actor)
		return mapDB(e)
	})
	return id, err
}

func (s *AutonomyStore) ListPolicies(ctx context.Context, tenantID string) ([]map[string]any, error) {
	var out []map[string]any
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		rows, err := db.Query(ctx, `SELECT id::text, name, domain, trigger, risk, requirement, created_by, created_at FROM approval_policies WHERE tenant_id::text=$1 ORDER BY created_at DESC`, tenantID)
		if err != nil {
			return mapDB(err)
		}
		defer rows.Close()
		for rows.Next() {
			var id, name, domain, trigger, risk, req, by string
			var at time.Time
			if err := rows.Scan(&id, &name, &domain, &trigger, &risk, &req, &by, &at); err != nil {
				return err
			}
			out = append(out, map[string]any{"id": id, "name": name, "domain": domain, "trigger": trigger, "risk": risk, "requirement": req, "created_by": by, "created_at": at})
		}
		return rows.Err()
	})
	return out, err
}

func (s *AutonomyStore) CreateTicket(ctx context.Context, tenantID, actor, action, domain, resource, risk, corr string, exp time.Time) (string, error) {
	id, err := newID()
	if err != nil {
		return "", err
	}
	err = s.inTenant(ctx, tenantID, func(db DB) error {
		_, e := db.Exec(ctx, `
INSERT INTO approval_tickets (id, tenant_id, requester_id, action, domain, resource, risk, status, correlation_id, expires_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, id, tenantID, actor, action, domain, resource, risk, autonomy.TicketAwait, corr, exp)
		return mapDB(e)
	})
	return id, err
}

type Ticket struct {
	ID, TenantID, Requester, Action, Domain, Resource, Risk, Status, Approver string
}

func (s *AutonomyStore) GetTicket(ctx context.Context, tenantID, id string) (Ticket, error) {
	var t Ticket
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		return db.QueryRow(ctx, `
SELECT id::text, tenant_id::text, requester_id, action, domain, resource, risk, status, approver_id
FROM approval_tickets WHERE tenant_id::text=$1 AND id=$2`, tenantID, id).Scan(
			&t.ID, &t.TenantID, &t.Requester, &t.Action, &t.Domain, &t.Resource, &t.Risk, &t.Status, &t.Approver)
	})
	return t, mapDB(err)
}

func (s *AutonomyStore) DecideTicket(ctx context.Context, tenantID, id, actor, status, reason string) error {
	return s.inTenant(ctx, tenantID, func(db DB) error {
		tag, err := db.Exec(ctx, `
UPDATE approval_tickets SET status=$4, approver_id=$3, reason=$5, decided_at=now()
WHERE tenant_id::text=$1 AND id=$2 AND status=$6`, tenantID, id, actor, status, reason, autonomy.TicketAwait)
		if err != nil {
			return mapDB(err)
		}
		if tag.RowsAffected() == 0 {
			return database.ErrNotFound
		}
		return nil
	})
}

func (s *AutonomyStore) SaveRun(ctx context.Context, tenantID, actor, objective, strategy, fp, snapshot string) (string, bool, error) {
	id, err := newID()
	if err != nil {
		return "", false, err
	}
	var created bool
	err = s.inTenant(ctx, tenantID, func(db DB) error {
		var existing string
		qerr := db.QueryRow(ctx, `SELECT id::text FROM autonomy_runs WHERE tenant_id::text=$1 AND fingerprint=$2`, tenantID, fp).Scan(&existing)
		if qerr == nil && existing != "" {
			id = existing
			created = false
			return nil
		}
		_, e := db.Exec(ctx, `
INSERT INTO autonomy_runs (id, tenant_id, actor_id, objective, strategy, fingerprint, status, execution_reality, snapshot)
VALUES ($1,$2,$3,$4,$5,$6,'SIMULATION','SIMULATION',$7)`, id, tenantID, actor, objective, strategy, fp, snapshot)
		created = e == nil
		return mapDB(e)
	})
	return id, created, err
}

func (s *AutonomyStore) ListRuns(ctx context.Context, tenantID string) ([]map[string]any, error) {
	var out []map[string]any
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		rows, err := db.Query(ctx, `SELECT id::text, objective, strategy, fingerprint, status, execution_reality, snapshot, created_at FROM autonomy_runs WHERE tenant_id::text=$1 ORDER BY created_at DESC LIMIT 50`, tenantID)
		if err != nil {
			return mapDB(err)
		}
		defer rows.Close()
		for rows.Next() {
			var id, obj, stg, fp, status, reality, snap string
			var at time.Time
			if err := rows.Scan(&id, &obj, &stg, &fp, &status, &reality, &snap, &at); err != nil {
				return err
			}
			var parsed any
			_ = json.Unmarshal([]byte(snap), &parsed)
			out = append(out, map[string]any{"id": id, "objective": obj, "strategy": stg, "fingerprint": fp, "status": status, "execution_reality": reality, "result": parsed, "created_at": at})
		}
		return rows.Err()
	})
	return out, err
}

func (s *AutonomyStore) CreateMemory(ctx context.Context, tenantID, actor, insight, evidence, source, class, conf string) (string, error) {
	id, err := newID()
	if err != nil {
		return "", err
	}
	err = s.inTenant(ctx, tenantID, func(db DB) error {
		_, e := db.Exec(ctx, `
INSERT INTO governed_memories (id, tenant_id, actor_id, insight, evidence, source, classification, confidence)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, id, tenantID, actor, insight, evidence, source, class, conf)
		return mapDB(e)
	})
	return id, err
}

func (s *AutonomyStore) ListMemories(ctx context.Context, tenantID string) ([]map[string]any, error) {
	var out []map[string]any
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		rows, err := db.Query(ctx, `SELECT id::text, actor_id, insight, evidence, source, classification, confidence, created_at FROM governed_memories WHERE tenant_id::text=$1 ORDER BY created_at DESC LIMIT 100`, tenantID)
		if err != nil {
			return mapDB(err)
		}
		defer rows.Close()
		for rows.Next() {
			var id, actor, insight, ev, src, class, conf string
			var at time.Time
			if err := rows.Scan(&id, &actor, &insight, &ev, &src, &class, &conf, &at); err != nil {
				return err
			}
			out = append(out, map[string]any{"id": id, "actor_id": actor, "insight": insight, "evidence": ev, "source": src, "classification": class, "confidence": conf, "created_at": at, "execution_reality": "REAL"})
		}
		return rows.Err()
	})
	return out, err
}

func (s *AutonomyStore) CreateScenario(ctx context.Context, tenantID, actor, name, assumptions, projection string) (string, error) {
	id, err := newID()
	if err != nil {
		return "", err
	}
	err = s.inTenant(ctx, tenantID, func(db DB) error {
		_, e := db.Exec(ctx, `INSERT INTO scenario_records (id, tenant_id, actor_id, name, assumptions, projection) VALUES ($1,$2,$3,$4,$5,$6)`, id, tenantID, actor, name, assumptions, projection)
		return mapDB(e)
	})
	return id, err
}

func (s *AutonomyStore) ListScenarios(ctx context.Context, tenantID string) ([]map[string]any, error) {
	var out []map[string]any
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		rows, err := db.Query(ctx, `SELECT id::text, name, assumptions, projection, created_at FROM scenario_records WHERE tenant_id::text=$1 ORDER BY created_at DESC LIMIT 50`, tenantID)
		if err != nil {
			return mapDB(err)
		}
		defer rows.Close()
		for rows.Next() {
			var id, name, a, p string
			var at time.Time
			if err := rows.Scan(&id, &name, &a, &p, &at); err != nil {
				return err
			}
			var assumptions, projection any
			_ = json.Unmarshal([]byte(a), &assumptions)
			_ = json.Unmarshal([]byte(p), &projection)
			out = append(out, map[string]any{"id": id, "name": name, "assumptions": assumptions, "projection": projection, "kind": "PROJECTED", "execution_reality": "SIMULATION", "created_at": at})
		}
		return rows.Err()
	})
	return out, err
}

func (s *AutonomyStore) RecordUsage(ctx context.Context, tenantID, subject, provider, model, task, corr string, prompt, completion int, micros int64, source string) error {
	id, err := newID()
	if err != nil {
		return err
	}
	return s.inTenant(ctx, tenantID, func(db DB) error {
		_, e := db.Exec(ctx, `
INSERT INTO ai_usage_ledger (id, tenant_id, subject_id, provider, model, task, prompt_tokens, completion_tokens, estimated_micros, cost_source, correlation_id)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, id, tenantID, subject, provider, model, task, prompt, completion, micros, source, corr)
		return mapDB(e)
	})
}

func (s *AutonomyStore) ListUsage(ctx context.Context, tenantID string) ([]map[string]any, error) {
	var out []map[string]any
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		rows, err := db.Query(ctx, `
SELECT id::text, provider, model, task, prompt_tokens, completion_tokens, estimated_micros, cost_source, created_at
FROM ai_usage_ledger WHERE tenant_id::text=$1 ORDER BY created_at DESC LIMIT 100`, tenantID)
		if err != nil {
			return mapDB(err)
		}
		defer rows.Close()
		for rows.Next() {
			var id, provider, model, task, src string
			var p, c int
			var micros int64
			var at time.Time
			if err := rows.Scan(&id, &provider, &model, &task, &p, &c, &micros, &src, &at); err != nil {
				return err
			}
			out = append(out, map[string]any{
				"id": id, "provider": provider, "model": model, "task": task,
				"prompt_tokens": p, "completion_tokens": c, "estimated_micros": micros,
				"cost_source": src, "created_at": at,
			})
		}
		return rows.Err()
	})
	return out, err
}

func (s *AutonomyStore) Audit(ctx context.Context, tenantID, actor, action, resource, decision, reason, corr string) error {
	id, err := newID()
	if err != nil {
		return err
	}
	return s.inTenant(ctx, tenantID, func(db DB) error {
		_, e := db.Exec(ctx, `
INSERT INTO autonomy_audit (id, tenant_id, actor_id, action, resource, decision, reason, correlation_id)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, id, tenantID, actor, action, resource, decision, reason, corr)
		return mapDB(e)
	})
}

func (s *AutonomyStore) ListAudit(ctx context.Context, tenantID string) ([]map[string]any, error) {
	var out []map[string]any
	err := s.inTenant(ctx, tenantID, func(db DB) error {
		rows, err := db.Query(ctx, `SELECT id::text, actor_id, action, resource, decision, reason, correlation_id, created_at FROM autonomy_audit WHERE tenant_id::text=$1 ORDER BY created_at DESC LIMIT 100`, tenantID)
		if err != nil {
			return mapDB(err)
		}
		defer rows.Close()
		for rows.Next() {
			var id, actor, action, resource, decision, reason, corr string
			var at time.Time
			if err := rows.Scan(&id, &actor, &action, &resource, &decision, &reason, &corr, &at); err != nil {
				return err
			}
			out = append(out, map[string]any{"id": id, "actor_id": actor, "action": action, "resource": resource, "decision": decision, "reason": reason, "correlation_id": corr, "created_at": at})
		}
		return rows.Err()
	})
	return out, err
}
