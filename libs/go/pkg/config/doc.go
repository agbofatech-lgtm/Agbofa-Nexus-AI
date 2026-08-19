// Package config implements the Agbofa Nexus AI PROD-00 configuration and
// secret-management foundation.
//
// Runtime configuration is typed, environment-separated, and fail-closed.
// Secrets are never stored as ordinary strings in loggable structures and must
// not appear in errors, snapshots, or formatted output.
//
// Secret backends:
//
//   - env: process environment (SecretProvider)
//   - file: filesystem / mounted secret files (SecretProvider)
//   - aws_secrets_manager, vault: reserved managed providers; selecting them
//     without a wired implementation refuses startup (no simulated secrets)
//
// This package does not contact AWS, Vault, PostgreSQL, or JWT infrastructure.
// It only loads and validates configuration so later Phase 01 units can start
// safely.
package config
