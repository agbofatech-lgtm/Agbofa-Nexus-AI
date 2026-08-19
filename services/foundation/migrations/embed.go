package migrations

import "embed"

// Files contains ordered foundation SQL migrations.
//
//go:embed *.sql
var Files embed.FS
