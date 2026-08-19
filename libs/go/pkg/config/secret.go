package config

import (
	"crypto/subtle"
	"encoding/json"
	"fmt"
)

const redacted = "[REDACTED]"

// Secret is opaque credential material. fmt, JSON, and text encoding never
// expose the raw value.
type Secret struct {
	name  string
	value []byte
}

// NewSecret constructs a named secret. The name may appear in diagnostics; the
// value must not.
func NewSecret(name string, value string) Secret {
	var copied []byte
	if value != "" {
		copied = make([]byte, len(value))
		copy(copied, value)
	}
	return Secret{name: name, value: copied}
}

func (s Secret) Name() string { return s.name }

func (s Secret) Empty() bool { return len(s.value) == 0 }

// Reveal returns the raw secret. Callers must not log, persist, or serialize
// the result outside a trusted cryptographic or connection boundary.
func (s Secret) Reveal() string { return string(s.value) }

func (s Secret) String() string { return redacted }

func (s Secret) GoString() string { return "config.Secret{name:" + quoteName(s.name) + ",value:" + redacted + "}" }

func (s Secret) MarshalText() ([]byte, error) { return []byte(redacted), nil }

func (s Secret) MarshalJSON() ([]byte, error) { return json.Marshal(redacted) }

func (s Secret) Format(f fmt.State, verb rune) {
	_, _ = f.Write([]byte(redacted))
}

func (s Secret) Equal(other Secret) bool {
	return subtle.ConstantTimeCompare(s.value, other.value) == 1
}

func quoteName(name string) string {
	if name == "" {
		return `""`
	}
	return `"` + name + `"`
}
