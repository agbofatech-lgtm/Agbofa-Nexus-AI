package database

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/config"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Pool is a production PostgreSQL connection pool.
type Pool struct {
	inner        *pgxpool.Pool
	queryTimeout time.Duration
}

func Open(ctx context.Context, cfg config.DatabaseConfig) (*Pool, error) {
	if cfg.URL.Empty() {
		return nil, fmt.Errorf("%w: database url is required", ErrInvalidConfig)
	}
	if cfg.MaxConns <= 0 {
		return nil, fmt.Errorf("%w: max conns must be positive", ErrInvalidConfig)
	}
	if cfg.MinConns < 0 || cfg.MinConns > cfg.MaxConns {
		return nil, fmt.Errorf("%w: min conns out of range", ErrInvalidConfig)
	}
	timeout := cfg.QueryTimeout
	if timeout <= 0 {
		timeout = 5 * time.Second
	}

	pcfg, err := pgxpool.ParseConfig(cfg.URL.Reveal())
	if err != nil {
		return nil, fmt.Errorf("%w: parse database url", ErrInvalidConfig)
	}
	pcfg.MaxConns = int32(cfg.MaxConns)
	pcfg.MinConns = int32(cfg.MinConns)
	pcfg.MaxConnIdleTime = 5 * time.Minute
	pcfg.HealthCheckPeriod = 30 * time.Second
	if pcfg.ConnConfig.ConnectTimeout == 0 {
		pcfg.ConnConfig.ConnectTimeout = 5 * time.Second
	}

	inner, err := pgxpool.NewWithConfig(ctx, pcfg)
	if err != nil {
		return nil, fmt.Errorf("%w: open pool", ErrUnavailable)
	}
	if err := inner.Ping(ctx); err != nil {
		inner.Close()
		return nil, fmt.Errorf("%w: ping", ErrUnavailable)
	}
	return &Pool{inner: inner, queryTimeout: timeout}, nil
}

func (p *Pool) Close() {
	if p != nil && p.inner != nil {
		p.inner.Close()
	}
}

func (p *Pool) Ping(ctx context.Context) error {
	ctx, cancel := p.withTimeout(ctx)
	defer cancel()
	if err := p.inner.Ping(ctx); err != nil {
		return fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	return nil
}

func (p *Pool) Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	ctx, cancel := p.withTimeout(ctx)
	defer cancel()
	tag, err := p.inner.Exec(ctx, sql, args...)
	return tag, MapError(err)
}

func (p *Pool) Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
	ctx, cancel := p.withTimeout(ctx)
	defer cancel()
	rows, err := p.inner.Query(ctx, sql, args...)
	return rows, MapError(err)
}

func (p *Pool) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	ctx, cancel := p.withTimeout(ctx)
	defer cancel()
	return cancellableRow{row: p.inner.QueryRow(ctx, sql, args...), cancel: cancel}
}

func (p *Pool) Begin(ctx context.Context) (pgx.Tx, error) {
	tx, err := p.inner.Begin(ctx)
	return tx, MapError(err)
}

func (p *Pool) InTx(ctx context.Context, fn func(tx pgx.Tx) error) error {
	tx, err := p.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if err := fn(tx); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return MapError(err)
	}
	return nil
}

// InTenantTx starts a transaction and sets transaction-local app.current_tenant.
func (p *Pool) InTenantTx(ctx context.Context, tenantID string, fn func(tx pgx.Tx) error) error {
	if tenantID == "" {
		return fmt.Errorf("%w: tenant id required", ErrConstraint)
	}
	return p.InTx(ctx, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, "SELECT set_config('app.current_tenant', $1, true)", tenantID); err != nil {
			return MapError(err)
		}
		return fn(tx)
	})
}

func (p *Pool) Inner() *pgxpool.Pool { return p.inner }

func (p *Pool) withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	if p.queryTimeout <= 0 {
		return context.WithCancel(ctx)
	}
	if deadline, ok := ctx.Deadline(); ok && time.Until(deadline) <= p.queryTimeout {
		return context.WithCancel(ctx)
	}
	return context.WithTimeout(ctx, p.queryTimeout)
}

type cancellableRow struct {
	row    pgx.Row
	cancel context.CancelFunc
}

func (r cancellableRow) Scan(dest ...any) error {
	defer r.cancel()
	return MapError(r.row.Scan(dest...))
}

func MapError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
		return fmt.Errorf("%w: %v", ErrCanceled, err)
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505":
			return fmt.Errorf("%w: %s", ErrDuplicate, pgErr.ConstraintName)
		case "23503", "23502", "23514":
			return fmt.Errorf("%w: %s", ErrConstraint, pgErr.ConstraintName)
		}
	}
	return err
}
