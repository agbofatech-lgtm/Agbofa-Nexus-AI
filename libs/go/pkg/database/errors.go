package database

import "errors"

var (
	ErrNotFound      = errors.New("database: not found")
	ErrDuplicate     = errors.New("database: duplicate")
	ErrConstraint    = errors.New("database: constraint violation")
	ErrUnavailable   = errors.New("database: unavailable")
	ErrInvalidConfig = errors.New("database: invalid configuration")
	ErrCanceled      = errors.New("database: canceled")
)
