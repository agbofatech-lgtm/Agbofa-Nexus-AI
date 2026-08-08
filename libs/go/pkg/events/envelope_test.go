package events

import (
	"errors"
	"testing"
	"time"
)

func TestEnvelopeValidateRequiresCoreFields(t *testing.T) {
	if err := (Envelope{}).Validate(); !errors.Is(err, ErrInvalidEnvelope) {
		t.Fatalf("expected invalid envelope error, got %v", err)
	}
}

func TestEnvelopeValidateAcceptsCompleteEnvelope(t *testing.T) {
	envelope := Envelope{EventID: "evt", EventType: "Example", Source: "test", CorrelationID: "corr", OccurredAt: time.Now(), Payload: []byte("{}")}
	if err := envelope.Validate(); err != nil {
		t.Fatalf("expected envelope to validate, got %v", err)
	}
}
