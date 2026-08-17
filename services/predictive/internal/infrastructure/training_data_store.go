package infrastructure

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/agbofa/nexus/services/predictive/internal/domain"
)

// PostgresTrainingDataStore implements application.TrainingDataStore for IMP-018,
// enforcing strict multi-tenant Row-Level Security (RLS) by executing
// SET LOCAL app.current_tenant = $1 inside every database transaction before any SQL query.
type PostgresTrainingDataStore struct {
	db *sql.DB
}

// NewPostgresTrainingDataStore initializes a new PostgresTrainingDataStore (BATCH 3 INFRASTRUCTURE).
func NewPostgresTrainingDataStore(db *sql.DB) *PostgresTrainingDataStore {
	return &PostgresTrainingDataStore{db: db}
}

// StoreTrainingData inserts a training example under strict RLS transaction isolation.
func (s *PostgresTrainingDataStore) StoreTrainingData(
	ctx context.Context,
	tenantID string,
	predictionType domain.PredictionType,
	features map[string]interface{},
	labels map[string]interface{},
) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	if s.db == nil {
		return errors.New("database connection is nil")
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID); err != nil {
		return fmt.Errorf("failed to set RLS tenant context: %w", err)
	}

	featBytes, _ := json.Marshal(features)
	lblBytes, _ := json.Marshal(labels)
	exampleID := fmt.Sprintf("ex-%s-%d", predictionType, time.Now().UnixNano())

	query := `
		INSERT INTO training_examples (example_id, tenant_id, prediction_type, features, labels, collected_at)
		VALUES ($1, $2, $3, $4, $5, $6);
	`
	_, err = tx.ExecContext(ctx, query,
		exampleID,
		tenantID,
		string(predictionType),
		string(featBytes),
		string(lblBytes),
		time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to insert training example: %w", err)
	}

	return tx.Commit()
}

// GetTrainingData retrieves training examples within a time range under strict RLS transaction isolation.
func (s *PostgresTrainingDataStore) GetTrainingData(
	ctx context.Context,
	tenantID string,
	predictionType domain.PredictionType,
	since time.Time,
	until time.Time,
) ([]*domain.TrainingExample, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if s.db == nil {
		return nil, errors.New("database connection is nil")
	}

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID); err != nil {
		return nil, fmt.Errorf("failed to set RLS tenant context: %w", err)
	}

	query := `
		SELECT example_id, tenant_id, prediction_type, features, labels, collected_at
		FROM training_examples
		WHERE prediction_type = $1 AND tenant_id = $2 AND collected_at >= $3 AND collected_at <= $4
		ORDER BY collected_at ASC;
	`
	rows, err := tx.QueryContext(ctx, query, string(predictionType), tenantID, since, until)
	if err != nil {
		return nil, fmt.Errorf("failed to query training examples: %w", err)
	}
	defer rows.Close()

	var examples []*domain.TrainingExample
	for rows.Next() {
		var ex domain.TrainingExample
		var ptStr, featStr, lblStr string
		if err := rows.Scan(&ex.ExampleID, &ex.TenantID, &ptStr, &featStr, &lblStr, &ex.RecordedAt); err != nil {
			return nil, fmt.Errorf("failed to scan training example: %w", err)
		}
		ex.PredictionType = domain.PredictionType(ptStr)
		ex.Features = make(map[string]interface{})
		ex.Labels = make(map[string]interface{})
		_ = json.Unmarshal([]byte(featStr), &ex.Features)
		_ = json.Unmarshal([]byte(lblStr), &ex.Labels)
		examples = append(examples, &ex)
	}

	return examples, tx.Commit()
}

// GetDataStats returns statistics on available training data under strict RLS transaction isolation.
func (s *PostgresTrainingDataStore) GetDataStats(
	ctx context.Context,
	tenantID string,
	predictionType domain.PredictionType,
) (*domain.DataStats, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if s.db == nil {
		return nil, errors.New("database connection is nil")
	}

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID); err != nil {
		return nil, fmt.Errorf("failed to set RLS tenant context: %w", err)
	}

	query := `
		SELECT COUNT(*), COALESCE(MIN(collected_at), now()), COALESCE(MAX(collected_at), now())
		FROM training_examples
		WHERE prediction_type = $1 AND tenant_id = $2;
	`
	row := tx.QueryRowContext(ctx, query, string(predictionType), tenantID)

	var stats domain.DataStats
	stats.PredictionType = predictionType
	if err := row.Scan(&stats.TotalExamples, &stats.FirstRecorded, &stats.LastRecorded); err != nil {
		return nil, fmt.Errorf("failed to query data stats: %w", err)
	}
	stats.FeatureStats = map[string]string{
		"data_density": "nominal",
		"status":       "RLS_SCOPED",
	}

	return &stats, tx.Commit()
}
