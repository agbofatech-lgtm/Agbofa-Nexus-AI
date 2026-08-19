package config

import (
	"errors"
	"fmt"
)

var (
	ErrMissingRequired      = errors.New("missing required configuration")
	ErrMalformed            = errors.New("malformed configuration")
	ErrInvalidSecret        = errors.New("invalid secret configuration")
	ErrUnknownEnvironment   = errors.New("unknown environment")
	ErrUnknownProvider      = errors.New("unknown secret provider")
	ErrProviderUnavailable  = errors.New("secret provider is not available")
	ErrSecretNotFound       = errors.New("secret not found")
	ErrUnsafeConfiguration  = errors.New("unsafe configuration")
	ErrJWTKeyNotUsable      = errors.New("jwt key is not usable")
	ErrJWTSigningKeyMissing = errors.New("jwt signing key is missing")
)

// Error is a safe configuration failure. Error() never includes secret values.
type Error struct {
	Code    string
	Field   string
	Message string
	Env     Environment
	cause   error
}

func (e *Error) Error() string {
	if e == nil {
		return "configuration error"
	}
	env := string(e.Env)
	if env == "" {
		env = "unspecified"
	}
	return fmt.Sprintf("configuration error [%s] env=%s field=%s: %s", e.Code, env, e.Field, e.Message)
}

func (e *Error) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.cause
}

func configErr(code, field, message string, env Environment, cause error) *Error {
	return &Error{Code: code, Field: field, Message: message, Env: env, cause: cause}
}

func missing(field string, env Environment) *Error {
	return configErr("missing_required", field, "required value is not set", env, ErrMissingRequired)
}

func malformed(field, message string, env Environment) *Error {
	return configErr("malformed", field, message, env, ErrMalformed)
}

func invalidSecret(field, message string, env Environment) *Error {
	return configErr("invalid_secret", field, message, env, ErrInvalidSecret)
}

func unsafe(field, message string, env Environment) *Error {
	return configErr("unsafe", field, message, env, ErrUnsafeConfiguration)
}
