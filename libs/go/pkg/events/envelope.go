package events

import (
	"errors"
	"time"
)

type Envelope struct {
	EventID       string
	EventType     string
	Source        string
	TenantID      string
	CorrelationID string
	CausationID   string
	OccurredAt    time.Time
	Payload       []byte
	Metadata      map[string]string
}

type Publisher interface {
	Publish(ctx Context, topic string, key string, envelope Envelope) error
}

type Consumer interface {
	Handle(ctx Context, envelope Envelope) error
}

type Context interface {
	Done() <-chan struct{}
	Err() error
}

var ErrInvalidEnvelope = errors.New("invalid event envelope")

func (e Envelope) Validate() error {
	if e.EventID == "" || e.EventType == "" || e.Source == "" || e.CorrelationID == "" || e.OccurredAt.IsZero() || len(e.Payload) == 0 {
		return ErrInvalidEnvelope
	}
	return nil
}
