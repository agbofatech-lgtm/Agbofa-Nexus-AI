package infrastructure

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

// PostgresModelRepository implements application.ModelRepository for IMP-018,
// enforcing strict multi-tenant Row-Level Security (RLS) by executing
// SET LOCAL app.current_tenant = $1 inside every database transaction before any SQL query.
type PostgresModelRepository struct {
	db *sql.DB
}

// NewPostgresModelRepository initializes a new PostgresModelRepository (BATCH 3 INFRASTRUCTURE).
func NewPostgresModelRepository(db *sql.DB) *PostgresModelRepository {
	return &PostgresModelRepository{db: db}
}

// SaveModel inserts or updates a predictive model under strict RLS transaction isolation.
func (r *PostgresModelRepository) SaveModel(ctx context.Context, tenantID string, model *domain.Model) error {
	if tenantID == "" || model == nil || model.TenantID == "" || tenantID != model.TenantID {
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

	metaBytes, _ := json.Marshal(model.Metadata)
	status := "CANDIDATE"
	if st, ok := model.Metadata["status"]; ok && st != "" {
		status = st
	}

	query := `
		INSERT INTO prediction_models (model_id, tenant_id, prediction_type, version, status, accuracy, features, artifact_path, trained_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (model_id, tenant_id)
		DO UPDATE SET
			status = EXCLUDED.status,
			accuracy = EXCLUDED.accuracy,
			trained_at = EXCLUDED.trained_at;
	`
	_, err = tx.ExecContext(ctx, query,
		model.ModelID,
		tenantID,
		string(model.PredictionType),
		model.Version,
		status,
		0.85,
		string(metaBytes),
		"artifacts/"+model.ModelID+".bin",
		model.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to save prediction model: %w", err)
	}

	return tx.Commit()
}

// GetModel retrieves a model by version under strict RLS transaction isolation.
func (r *PostgresModelRepository) GetModel(ctx context.Context, tenantID string, predictionType domain.PredictionType, version string) (*domain.Model, error) {
	if tenantID == "" || version == "" {
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
		SELECT model_id, tenant_id, prediction_type, version, status, features, trained_at
		FROM prediction_models
		WHERE prediction_type = $1 AND version = $2 AND tenant_id = $3;
	`
	row := tx.QueryRowContext(ctx, query, string(predictionType), version, tenantID)

	var m domain.Model
	var predTypeStr, statusStr, featStr string
	if err := row.Scan(&m.ModelID, &m.TenantID, &predTypeStr, &m.Version, &statusStr, &featStr, &m.CreatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrModelNotFound
		}
		return nil, fmt.Errorf("failed to query model: %w", err)
	}
	m.PredictionType = domain.PredictionType(predTypeStr)
	m.Metadata = make(map[string]string)
	_ = json.Unmarshal([]byte(featStr), &m.Metadata)
	m.Metadata["status"] = statusStr

	return &m, tx.Commit()
}

// GetLatestModel retrieves the currently ACTIVE model for a prediction type under strict RLS transaction isolation.
func (r *PostgresModelRepository) GetLatestModel(ctx context.Context, tenantID string, predictionType domain.PredictionType) (*domain.Model, error) {
	if tenantID == "" {
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
		SELECT model_id, tenant_id, prediction_type, version, status, features, trained_at
		FROM prediction_models
		WHERE prediction_type = $1 AND status = 'ACTIVE' AND tenant_id = $2
		ORDER BY trained_at DESC LIMIT 1;
	`
	row := tx.QueryRowContext(ctx, query, string(predictionType), tenantID)

	var m domain.Model
	var predTypeStr, statusStr, featStr string
	if err := row.Scan(&m.ModelID, &m.TenantID, &predTypeStr, &m.Version, &statusStr, &featStr, &m.CreatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrModelNotFound
		}
		return nil, fmt.Errorf("failed to query latest active model: %w", err)
	}
	m.PredictionType = domain.PredictionType(predTypeStr)
	m.Metadata = make(map[string]string)
	_ = json.Unmarshal([]byte(featStr), &m.Metadata)
	m.Metadata["status"] = statusStr

	return &m, tx.Commit()
}

// ListModels returns metadata for all models of a prediction type under strict RLS transaction isolation.
func (r *PostgresModelRepository) ListModels(ctx context.Context, tenantID string, predictionType domain.PredictionType) ([]*domain.ModelMetadata, error) {
	if tenantID == "" {
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
		SELECT model_id, tenant_id, prediction_type, version, status, accuracy, trained_at
		FROM prediction_models
		WHERE prediction_type = $1 AND tenant_id = $2
		ORDER BY trained_at DESC;
	`
	rows, err := tx.QueryContext(ctx, query, string(predictionType), tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list models: %w", err)
	}
	defer rows.Close()

	var list []*domain.ModelMetadata
	for rows.Next() {
		var meta domain.ModelMetadata
		var ptStr string
		if err := rows.Scan(&meta.ModelID, &meta.TenantID, &ptStr, &meta.Version, &meta.Status, &meta.AccuracyMetric, &meta.TrainedAt); err != nil {
			return nil, fmt.Errorf("failed to scan model metadata: %w", err)
		}
		meta.PredictionType = domain.PredictionType(ptStr)
		list = append(list, &meta)
	}

	return list, tx.Commit()
}

// DeleteModel removes a model version under strict RLS transaction isolation.
func (r *PostgresModelRepository) DeleteModel(ctx context.Context, tenantID string, predictionType domain.PredictionType, version string) error {
	if tenantID == "" || version == "" {
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

	query := `DELETE FROM prediction_models WHERE prediction_type = $1 AND version = $2 AND tenant_id = $3;`
	_, err = tx.ExecContext(ctx, query, string(predictionType), version, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete model: %w", err)
	}

	return tx.Commit()
}
