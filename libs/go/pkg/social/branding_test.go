package social

import (
	"strings"
	"testing"
)

func TestBrandingRequiredAndApplied(t *testing.T) {
	spec, _ := Lookup("x")
	_, err := Adapt(CanonicalContent{ID: "c1", Version: "v1", Body: "hello", BrandApplied: false}, spec)
	if err != ErrBrandingRequired {
		t.Fatalf("branding: %v", err)
	}
	pkg, err := Adapt(CanonicalContent{ID: "c1", Version: "v1", TenantID: "t", Body: "hello", BrandApplied: true}, spec)
	if err != nil {
		t.Fatal(err)
	}
	if !pkg.BrandApplied || pkg.Provenance["source_content_id"] != "c1" {
		t.Fatalf("pkg %+v", pkg)
	}
	if !containsBrand(pkg.Text) {
		t.Fatalf("missing brand mark: %q", pkg.Text)
	}
}

func TestIllegalTransitionAndIdempotency(t *testing.T) {
	if err := Transition(StatusPublished, StatusProcessing); err == nil {
		t.Fatal("published -> processing must be illegal")
	}
	if err := Transition(StatusDraft, StatusQueued); err != nil {
		t.Fatal(err)
	}
	a := IdempotencyKey("t", "c", "v", "acc", PlatformX, "2026-08-20T00:00:00Z")
	b := IdempotencyKey("t", "c", "v", "acc", PlatformX, "2026-08-20T00:00:00Z")
	if a != b || a == "" {
		t.Fatal("idempotency unstable")
	}
}

func containsBrand(s string) bool {
	return strings.Contains(s, "Agbofa Nexus AI")
}

func TestSnapshotRoundTrip(t *testing.T) {
	raw := EncodeSnapshot("hello — Agbofa Nexus AI", "https://example.invalid/v.mp4")
	text, media := ParseSnapshot(raw)
	if text != "hello — Agbofa Nexus AI" || media != "https://example.invalid/v.mp4" {
		t.Fatalf("%q %q", text, media)
	}
	plain, empty := ParseSnapshot("just text")
	if plain != "just text" || empty != "" {
		t.Fatal("plain snapshot")
	}
}
