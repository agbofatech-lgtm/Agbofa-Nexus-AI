package database

import (
	"context"
	"fmt"
	"io/fs"
	"path"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

var migrationName = regexp.MustCompile(`^(\d+)_(.+)\.(up|down)\.sql$`)

type migrationFile struct {
	Version int64
	Name    string
	Up      string
	Down    string
}

// MigrateUp applies pending *.up.sql files in version order.
func MigrateUp(ctx context.Context, pool *Pool, fsys fs.FS) error {
	if err := ensureMigrationTable(ctx, pool); err != nil {
		return err
	}
	files, err := loadMigrations(fsys)
	if err != nil {
		return err
	}
	applied, err := appliedVersions(ctx, pool)
	if err != nil {
		return err
	}
	for _, file := range files {
		if applied[file.Version] {
			continue
		}
		if err := applySQL(ctx, pool, file.Up); err != nil {
			return fmt.Errorf("apply %d_%s: %w", file.Version, file.Name, err)
		}
		if _, err := pool.Exec(ctx, `INSERT INTO schema_migrations (version, name) VALUES ($1, $2)`, file.Version, file.Name); err != nil {
			return fmt.Errorf("record %d_%s: %w", file.Version, file.Name, err)
		}
	}
	return nil
}

// MigrateDown rolls back the latest applied migration.
func MigrateDown(ctx context.Context, pool *Pool, fsys fs.FS) error {
	files, err := loadMigrations(fsys)
	if err != nil {
		return err
	}
	current, err := CurrentVersion(ctx, pool)
	if err != nil {
		return err
	}
	if current == 0 {
		return nil
	}
	var target *migrationFile
	for i := range files {
		if files[i].Version == current {
			target = &files[i]
			break
		}
	}
	if target == nil {
		return fmt.Errorf("no migration file for version %d", current)
	}
	if strings.TrimSpace(target.Down) == "" {
		return fmt.Errorf("migration %d_%s has no down script", target.Version, target.Name)
	}
	if err := applySQL(ctx, pool, target.Down); err != nil {
		return fmt.Errorf("down %d_%s: %w", target.Version, target.Name, err)
	}
	_, err = pool.Exec(ctx, `DELETE FROM schema_migrations WHERE version = $1`, target.Version)
	return err
}

func CurrentVersion(ctx context.Context, pool *Pool) (int64, error) {
	if err := ensureMigrationTable(ctx, pool); err != nil {
		return 0, err
	}
	var version *int64
	if err := pool.QueryRow(ctx, `SELECT MAX(version) FROM schema_migrations`).Scan(&version); err != nil {
		return 0, err
	}
	if version == nil {
		return 0, nil
	}
	return *version, nil
}

func ensureMigrationTable(ctx context.Context, pool *Pool) error {
	_, err := pool.Exec(ctx, `
CREATE TABLE IF NOT EXISTS schema_migrations (
    version BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`)
	return err
}

func appliedVersions(ctx context.Context, pool *Pool) (map[int64]bool, error) {
	rows, err := pool.Query(ctx, `SELECT version FROM schema_migrations`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[int64]bool{}
	for rows.Next() {
		var version int64
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		out[version] = true
	}
	return out, rows.Err()
}

func applySQL(ctx context.Context, pool *Pool, script string) error {
	conn, err := pool.inner.Acquire(ctx)
	if err != nil {
		return MapError(err)
	}
	defer conn.Release()
	if _, err := conn.Exec(ctx, "BEGIN"); err != nil {
		return MapError(err)
	}
	if _, err := conn.Conn().PgConn().Exec(ctx, script).ReadAll(); err != nil {
		_, _ = conn.Exec(ctx, "ROLLBACK")
		return MapError(err)
	}
	if _, err := conn.Exec(ctx, "COMMIT"); err != nil {
		return MapError(err)
	}
	return nil
}

func loadMigrations(fsys fs.FS) ([]migrationFile, error) {
	entries := map[int64]*migrationFile{}
	err := fs.WalkDir(fsys, ".", func(name string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		base := path.Base(name)
		match := migrationName.FindStringSubmatch(base)
		if match == nil {
			return nil
		}
		version, err := strconv.ParseInt(match[1], 10, 64)
		if err != nil {
			return err
		}
		file := entries[version]
		if file == nil {
			file = &migrationFile{Version: version, Name: match[2]}
			entries[version] = file
		}
		body, err := fs.ReadFile(fsys, name)
		if err != nil {
			return err
		}
		switch match[3] {
		case "up":
			file.Up = string(body)
		case "down":
			file.Down = string(body)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	out := make([]migrationFile, 0, len(entries))
	for _, file := range entries {
		if strings.TrimSpace(file.Up) == "" {
			return nil, fmt.Errorf("migration %d_%s missing up script", file.Version, file.Name)
		}
		out = append(out, *file)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Version < out[j].Version })
	return out, nil
}
