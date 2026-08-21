package autonomy

import (
	"errors"
	"strings"
	"testing"
)

func TestTruthSafeFixture(t *testing.T) {
	ok, err := DevelopmentTruth{}.Verify(TruthSafeFixture)
	if err != nil || !ok {
		t.Fatalf("safe fixture must pass: %v %v", ok, err)
	}
}

func TestTruthKnownFalse(t *testing.T) {
	ok, err := DevelopmentTruth{}.Verify("the earth is flat")
	if err != nil || ok {
		t.Fatalf("known false must be false,nil got %v %v", ok, err)
	}
}

func TestTruthEmptyAndWhitespaceUnavailable(t *testing.T) {
	for _, in := range []string{"", "   ", "\n\t"} {
		ok, err := DevelopmentTruth{}.Verify(in)
		if ok || !errors.Is(err, ErrTruthUnavailable) {
			t.Fatalf("%q: want false+unavailable got %v %v", in, ok, err)
		}
	}
}

func TestTruthUnknownIsNotTrue(t *testing.T) {
	ok, err := DevelopmentTruth{}.Verify("unverified claim about tomorrow")
	if ok || !errors.Is(err, ErrTruthUnavailable) {
		t.Fatalf("unknown must not be true: %v %v", ok, err)
	}
}

func TestTruthDeterministic(t *testing.T) {
	a, ea := DevelopmentTruth{}.Verify(TruthSafeFixture)
	b, eb := DevelopmentTruth{}.Verify(TruthSafeFixture)
	if a != b || (ea == nil) != (eb == nil) {
		t.Fatal("not deterministic")
	}
}

func TestTruthNilEngine(t *testing.T) {
	var eng TruthEngine
	if eng != nil {
		t.Fatal("nil engine")
	}
	p := NewPlane()
	if p.Truth == nil {
		t.Fatal("NewPlane must install a development truth engine")
	}
}

func TestTruthDoesNotClaimInternetVerification(t *testing.T) {
	if !strings.Contains(DevelopmentTruth{}.Kind(), "DEVELOPMENT") {
		t.Fatal("must disclose development engine")
	}
}
