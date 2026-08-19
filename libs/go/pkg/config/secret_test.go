package config

import (
	"encoding/json"
	"fmt"
	"strings"
	"testing"
)

const leakedCredential = "super-secret-password-xyz"

func TestSecretNeverFormatsRawValue(t *testing.T) {
	secret := NewSecret("database/url", leakedCredential)
	representations := []string{
		secret.String(),
		secret.GoString(),
		fmt.Sprint(secret),
		fmt.Sprintf("%v", secret),
		fmt.Sprintf("%s", secret),
		fmt.Sprintf("%q", secret),
		fmt.Sprintf("%+v", secret),
		fmt.Sprintf("%#v", secret),
	}
	raw, err := json.Marshal(secret)
	if err != nil {
		t.Fatalf("json marshal: %v", err)
	}
	representations = append(representations, string(raw))
	text, err := secret.MarshalText()
	if err != nil {
		t.Fatalf("marshal text: %v", err)
	}
	representations = append(representations, string(text))

	for _, rep := range representations {
		if strings.Contains(rep, leakedCredential) {
			t.Fatalf("secret leaked via formatted output: %q", rep)
		}
		if !strings.Contains(rep, redacted) && !strings.Contains(rep, `"[REDACTED]"`) {
			t.Fatalf("expected redacted output, got %q", rep)
		}
	}
	if secret.Reveal() != leakedCredential {
		t.Fatalf("Reveal() must return the raw value to trusted callers")
	}
	if secret.Empty() {
		t.Fatal("expected non-empty secret")
	}
}

func TestSecretEqualUsesValueNotName(t *testing.T) {
	a := NewSecret("a", leakedCredential)
	b := NewSecret("b", leakedCredential)
	c := NewSecret("a", "other")
	if !a.Equal(b) {
		t.Fatal("equal values should compare equal")
	}
	if a.Equal(c) {
		t.Fatal("different values should not compare equal")
	}
}
