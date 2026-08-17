package infrastructure

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/agbofa/nexus/services/monetization/internal/application"
	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

var _ application.ReaderValidator = (*PostgresReaderValidator)(nil)

// PostgresReaderValidator implements application.ReaderValidator, integrating with IMP-019
// reader profiles via the shared reader_id/tenant_id identity contract without duplicating profile tables.
// Cross-tenant reader validation strictly fails closed.
type PostgresReaderValidator struct {
	mu           sync.RWMutex
	dbURL        string
	db           *sql.DB
	validReaders map[string]bool // in-memory fallback: key = tenantID:readerID
}

// NewPostgresReaderValidator creates a new PostgresReaderValidator.
func NewPostgresReaderValidator(dbURL string) *PostgresReaderValidator {
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	var db *sql.DB
	if dbURL != "" {
		var err error
		db, err = sql.Open("postgres", dbURL)
		if err != nil {
			log.Printf("WARN [PostgresReaderValidator]: invalid DATABASE_URL: %v", err)
			db = nil
		}
	}
	return &PostgresReaderValidator{
		dbURL:        dbURL,
		db:           db,
		validReaders: make(map[string]bool),
	}
}

// RegisterReaderForTest registers a valid (tenantID, readerID) pair in-memory for unit testing.
func (v *PostgresReaderValidator) RegisterReaderForTest(tenantID, readerID string) {
	v.mu.Lock()
	defer v.mu.Unlock()
	v.validReaders[fmt.Sprintf("%s:%s", tenantID, readerID)] = true
}

// ValidateReaderIdentity verifies that readerID exists within tenantID in the IMP-019 reader_profiles table.
// Fails closed on any cross-tenant mismatch or missing reader.
func (v *PostgresReaderValidator) ValidateReaderIdentity(ctx context.Context, tenantID, readerID string) error {
	if tenantID == "" || readerID == "" {
		return domain.ErrCrossTenantViolation
	}

	if v.db != nil {
		tx, err := v.db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		defer func() { _ = tx.Rollback() }()

		if err := setTenantRLS(ctx, tx, tenantID); err != nil {
			return err
		}

		query := `SELECT 1 FROM reader_profiles WHERE tenant_id = $1 AND reader_id = $2`
		var exists int
		err = tx.QueryRowContext(ctx, query, tenantID, readerID).Scan(&exists)
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("reader identity validation failed: reader not found in tenant context")
		} else if err != nil {
			return fmt.Errorf("ValidateReaderIdentity SQL error: %w", err)
		}
		_ = tx.Commit()
		return nil
	}

	v.mu.RLock()
	defer v.mu.RUnlock()
	key := fmt.Sprintf("%s:%s", tenantID, readerID)
	if !v.validReaders[key] {
		return errors.New("reader identity validation failed: reader not found in tenant context")
	}
	return nil
}
