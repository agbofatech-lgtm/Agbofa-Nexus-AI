package auth

import "testing"

func TestPasswordHashAndVerify(t *testing.T) {
	hash, err := HashPassword("correct horse battery staple")
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	if err := VerifyPassword(hash, "correct horse battery staple"); err != nil {
		t.Fatalf("verify: %v", err)
	}
	if err := VerifyPassword(hash, "wrong"); err != ErrPasswordMismatch {
		t.Fatalf("expected mismatch, got %v", err)
	}
}

func TestPasswordRejectsEmpty(t *testing.T) {
	if _, err := HashPassword(""); err == nil {
		t.Fatal("expected error")
	}
}
