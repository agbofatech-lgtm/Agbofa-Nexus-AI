package database

import (
	"context"
	"errors"
	"io/fs"
	"testing"
	"testing/fstest"

	"github.com/agbofa/nexus/libs/go/pkg/config"
)

func TestOpenRejectsInvalidConfig(t *testing.T) {
	_, err := Open(context.Background(), config.DatabaseConfig{})
	if !errors.Is(err, ErrInvalidConfig) {
		t.Fatalf("expected invalid config, got %v", err)
	}
}

func TestLoadMigrationsOrdersVersions(t *testing.T) {
	fsys := fstest.MapFS{
		"20260808100000_authorization_policies.up.sql":   {Data: []byte("SELECT 2")},
		"20260808100000_authorization_policies.down.sql": {Data: []byte("SELECT 2d")},
		"20260807120000_foundation_schema.up.sql":        {Data: []byte("SELECT 1")},
		"20260807120000_foundation_schema.down.sql":      {Data: []byte("SELECT 1d")},
		"readme.txt": {Data: []byte("ignore")},
	}
	files, err := loadMigrations(fsys)
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if len(files) != 2 {
		t.Fatalf("got %d migrations", len(files))
	}
	if files[0].Version != 20260807120000 || files[1].Version != 20260808100000 {
		t.Fatalf("unexpected order: %+v", files)
	}
}

func TestLoadMigrationsRequiresUp(t *testing.T) {
	fsys := fstest.MapFS{
		"1_broken.down.sql": {Data: []byte("SELECT 1")},
	}
	if _, err := loadMigrations(fs.FS(fsys)); err == nil {
		t.Fatal("expected missing up script")
	}
}

func TestWithTenantRoundTrip(t *testing.T) {
	ctx := WithTenant(context.Background(), "tenant-a")
	got, ok := TenantFromContext(ctx)
	if !ok || got != "tenant-a" {
		t.Fatalf("got %q %v", got, ok)
	}
	if _, ok := TenantFromContext(context.Background()); ok {
		t.Fatal("empty context must not have tenant")
	}
}
