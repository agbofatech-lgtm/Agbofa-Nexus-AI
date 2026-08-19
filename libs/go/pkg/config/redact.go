package config

import (
	"regexp"
	"strings"
)

var (
	pemBlockPattern = regexp.MustCompile(`(?s)-----BEGIN [^-]*-----.*?-----END [^-]*-----`)
	urlUserinfo     = regexp.MustCompile(`(?i)(://[^:/?#\s]+):([^@/?#\s]+)@`)
	passwordAssign  = regexp.MustCompile(`(?i)(password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*([^\s,;]+)`)
	bearerPattern   = regexp.MustCompile(`(?i)(bearer\s+)[a-z0-9._\-+/=]+`)
)

// Redact removes credential-shaped material from diagnostic text.
func Redact(raw string) string {
	if raw == "" {
		return raw
	}
	out := pemBlockPattern.ReplaceAllString(raw, redacted+" PEM")
	out = urlUserinfo.ReplaceAllString(out, "${1}:"+redacted+"@")
	out = passwordAssign.ReplaceAllString(out, "${1}="+redacted)
	out = bearerPattern.ReplaceAllString(out, "${1}"+redacted)
	return out
}

// ContainsSecret reports whether haystack includes the raw secret value.
func ContainsSecret(haystack string, secret Secret) bool {
	if secret.Empty() || haystack == "" {
		return false
	}
	return strings.Contains(haystack, secret.Reveal())
}
