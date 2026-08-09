package pipeline

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

// PipelineRepository manages persistence for pipeline states, audit logs, and feedback signals
// in PostgreSQL, enforcing multi-tenant Row-Level Security (RLS) by executing
// SET LOCAL app.current_tenant = $1 inside every transaction before any SQL query.
type PipelineRepository struct {
	db *sql.DB
}

// NewPipelineRepository initializes a new PipelineRepository instance.
func NewPipelineRepository(db *sql.DB) *PipelineRepository {
	return &PipelineRepository{db: db}
}

// SavePipelineState inserts or updates a pipeline state under strict RLS transaction isolation.
func (r *PipelineRepository) SavePipelineState(ctx context.Context, tenantID string, state *domain.PipelineState) error {
	if tenantID == "" || state == nil || state.TenantID == "" || tenantID != state.TenantID {
		return domain.ErrCrossTenantViolation
	}
	if r.db == nil {
		return errors.New("database connection is nil")
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Execute mandatory SET LOCAL app.current_tenant inside transaction before RLS-protected query
	if _, err := tx.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID); err != nil {
		return fmt.Errorf("failed to set RLS tenant context: %w", err)
	}

	query := `
		INSERT INTO pipeline_states (state_id, tenant_id, agent_id, current_stage, last_status, last_updated, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (state_id, tenant_id)
		DO UPDATE SET
			agent_id = EXCLUDED.agent_id,
			current_stage = EXCLUDED.current_stage,
			last_status = EXCLUDED.last_status,
			last_updated = EXCLUDED.last_updated;
	`
	_, err = tx.ExecContext(ctx, query,
		state.StateID,
		tenantID,
		state.AgentID,
		string(state.CurrentStage),
		string(state.LastStatus),
		state.LastUpdated,
		time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to save pipeline state: %w", err)
	}

	return tx.Commit()
}

// GetPipelineState retrieves a pipeline state by ID under strict RLS transaction isolation.
func (r *PipelineRepository) GetPipelineState(ctx context.Context, tenantID, stateID string) (*domain.PipelineState, error) {
	if tenantID == "" || stateID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if r.db == nil {
		return nil, errors.New("database connection is nil")
	}

	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID); err != nil {
		return nil, fmt.Errorf("failed to set RLS tenant context: %w", err)
	}

	query := `
		SELECT state_id, tenant_id, agent_id, current_stage, last_status, last_updated
		FROM pipeline_states
		WHERE state_id = $1 AND tenant_id = $2;
	`
	row := tx.QueryRowContext(ctx, query, stateID, tenantID)

	var state domain.PipelineState
	var stageStr, statusStr string
	if err := row.Scan(&state.StateID, &state.TenantID, &state.AgentID, &stageStr, &statusStr, &state.LastUpdated); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("pipeline state not found: %w", err)
		}
		return nil, fmt.Errorf("failed to query pipeline state: %w", err)
	}
	state.CurrentStage = domain.PipelineStage(stageStr)
	state.LastStatus = domain.PipelineStatus(statusStr)

	return &state, tx.Commit()
}

// UpdatePipelineState updates an existing pipeline state under strict RLS transaction isolation.
func (r *PipelineRepository) UpdatePipelineState(ctx context.Context, tenantID string, state *domain.PipelineState) error {
	if tenantID == "" || state == nil || state.TenantID == "" || tenantID != state.TenantID {
		return domain.ErrCrossTenantViolation
	}
	if r.db == nil {
		return errors.New("database connection is nil")
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID); err != nil {
		return fmt.Errorf("failed to set RLS tenant context: %w", err)
	}

	query := `
		UPDATE pipeline_states
		SET agent_id = $3, current_stage = $4, last_status = $5, last_updated = $6
		WHERE state_id = $1 AND tenant_id = $2;
	`
	res, err := tx.ExecContext(ctx, query,
		state.StateID,
		tenantID,
		state.AgentID,
		string(state.CurrentStage),
		string(state.LastStatus),
		state.LastUpdated,
	)
	if err != nil {
		return fmt.Errorf("failed to update pipeline state: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil || rows == 0 {
		return fmt.Errorf("pipeline state not found or update rejected by RLS: %w", err)
	}

	return tx.Commit()
}

// DeletePipelineState removes a pipeline state under strict RLS transaction isolation.
func (r *PipelineRepository) DeletePipelineState(ctx context.Context, tenantID, stateID string) error {
	if tenantID == "" || stateID == "" {
		return domain.ErrCrossTenantViolation
	}
	if r.db == nil {
		return errors.New("database connection is nil")
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID); err != nil {
		return fmt.Errorf("failed to set RLS tenant context: %w", err)
	}

	query := `DELETE FROM pipeline_states WHERE state_id = $1 AND tenant_id = $2;`
	_, err = tx.ExecContext(ctx, query, stateID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete pipeline state: %w", err)
	}

	return tx.Commit()
}

// SaveAuditEntry inserts an audit log entry under strict RLS transaction isolation.
func (r *PipelineRepository) SaveAuditEntry(ctx context.Context, tenantID string, entry *domain.PipelineAuditEntry) error {
	if tenantID == "" || entry == nil || entry.TenantID == "" || tenantID != entry.TenantID {
		return domain.ErrCrossTenantViolation
	}
	if r.db == nil {
		return errors.New("database connection is nil")
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID); err != nil {
		return fmt.Errorf("failed to set RLS tenant context: %w", err)
	}

	query := `
		INSERT INTO pipeline_audit_log (audit_id, tenant_id, execution_id, agent_id, action, details, occurred_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7);
	`
	_, err = tx.ExecContext(ctx, query,
		entry.AuditID,
		tenantID,
		entry.ExecutionID,
		entry.AgentID,
		entry.Action,
		entry.Details,
		entry.OccurredAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert audit log entry: %w", err)
	}

	return tx.Commit()
}

// ListAuditEntries retrieves audit log entries for an execution under strict RLS transaction isolation.
func (r *PipelineRepository) ListAuditEntries(ctx context.Context, tenantID, executionID string) ([]domain.PipelineAuditEntry, error) {
	if tenantID == "" || executionID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if r.db == nil {
		return nil, errors.New("database connection is nil")
	}

	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID); err != nil {
		return nil, fmt.Errorf("failed to set RLS tenant context: %w", err)
	}

	query := `
		SELECT audit_id, tenant_id, execution_id, agent_id, action, details, occurred_at
		FROM pipeline_audit_log
		WHERE execution_id = $1 AND tenant_id = $2
		ORDER BY occurred_at DESC;
	`
	rows, err := tx.QueryContext(ctx, query, executionID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to query audit log entries: %w", err)
	}
	defer rows.Close()

	var entries []domain.PipelineAuditEntry
	for rows.Next() {
		var e domain.PipelineAuditEntry
		if err := rows.Scan(&e.AuditID, &e.TenantID, &e.ExecutionID, &e.AgentID, &e.Action, &e.Details, &e.OccurredAt); err != nil {
			return nil, fmt.Errorf("failed to scan audit entry: %w", err)
		}
		entries = append(entries, e)
	}

	return entries, tx.Commit()
}

// SaveFeedbackSignal inserts a feedback loop signal under strict RLS transaction isolation.
func (r *PipelineRepository) SaveFeedbackSignal(ctx context.Context, tenantID string, signal *domain.FeedbackSignal) error {
	if tenantID == "" || signal == nil || signal.TenantID == "" || tenantID != signal.TenantID {
		return domain.ErrCrossTenantViolation
	}
	if r.db == nil {
		return errors.New("database connection is nil")
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID); err != nil {
		return fmt.Errorf("failed to set RLS tenant context: %w", err)
	}

	query := `
		INSERT INTO feedback_loop_signals (signal_id, tenant_id, target_agent, score_delta, reason, generated_at)
		VALUES ($1, $2, $3, $4, $5, $6);
	`
	_, err = tx.ExecContext(ctx, query,
		signal.SignalID,
		tenantID,
		signal.TargetAgent,
		signal.ScoreDelta,
		signal.Reason,
		signal.GeneratedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert feedback signal: %w", err)
	}

	return tx.Commit()
}

// ListFeedbackSignals retrieves feedback signals for a target agent under strict RLS transaction isolation.
func (r *PipelineRepository) ListFeedbackSignals(ctx context.Context, tenantID, targetAgent string) ([]domain.FeedbackSignal, error) {
	if tenantID == "" || targetAgent == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if r.db == nil {
		return nil, errors.New("database connection is nil")
	}

	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID); err != nil {
		return nil, fmt.Errorf("failed to set RLS tenant context: %w", err)
	}

	query := `
		SELECT signal_id, tenant_id, target_agent, score_delta, reason, generated_at
		FROM feedback_loop_signals
		WHERE target_agent = $1 AND tenant_id = $2
		ORDER BY generated_at DESC;
	`
	rows, err := tx.QueryContext(ctx, query, targetAgent, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to query feedback signals: %w", err)
	}
	defer rows.Close()

	var signals []domain.FeedbackSignal
	for rows.Next() {
		var s domain.FeedbackSignal
		if err := rows.Scan(&s.SignalID, &s.TenantID, &s.TargetAgent, &s.ScoreDelta, &s.Reason, &s.GeneratedAt); err != nil {
			return nil, fmt.Errorf("failed to scan feedback signal: %w", err)
		}
		signals = append(signals, s)
	}

	return signals, tx.Commit()
}
