package autonomy

import (
	"errors"
	"strings"
	"testing"
)

func TestComplianceSafe(t *testing.T) {
	ok, err := DevelopmentCompliance{}.Check(ComplianceSafeFixture)
	if err != nil || !ok {
		t.Fatalf("%v %v", ok, err)
	}
}

func TestComplianceProhibited(t *testing.T) {
	ok, err := DevelopmentCompliance{}.Check("this is a prohibited:unlicensed-medical-claim")
	if err != nil || ok {
		t.Fatalf("want fail nil, got %v %v", ok, err)
	}
}

func TestCompliancePIIEmailAndSSN(t *testing.T) {
	ok, err := DevelopmentCompliance{}.Check("email me at person@example.com please")
	if err != nil || ok {
		t.Fatalf("email %v %v", ok, err)
	}
	ok, err = DevelopmentCompliance{}.Check("ssn 123-45-6789")
	if err != nil || ok {
		t.Fatalf("ssn %v %v", ok, err)
	}
}

func TestComplianceEmptyUnavailable(t *testing.T) {
	ok, err := DevelopmentCompliance{}.Check("  ")
	if ok || !errors.Is(err, ErrComplianceUnavailable) {
		t.Fatalf("%v %v", ok, err)
	}
}

func TestComplianceDeterministic(t *testing.T) {
	a, ea := DevelopmentCompliance{}.Check(ComplianceSafeFixture)
	b, eb := DevelopmentCompliance{}.Check(ComplianceSafeFixture)
	if a != b || (ea == nil) != (eb == nil) {
		t.Fatal("not deterministic")
	}
}

func TestComplianceKindDisclosesDevelopment(t *testing.T) {
	if !strings.Contains(DevelopmentCompliance{}.Kind(), "DEVELOPMENT") {
		t.Fatal(DevelopmentCompliance{}.Kind())
	}
}

func TestNewPlaneInstallsCompliance(t *testing.T) {
	if NewPlane().Compliance == nil {
		t.Fatal("NewPlane must install development compliance")
	}
}
