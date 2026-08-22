package publish

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/social"
)

type memStore struct {
	mu       sync.Mutex
	jobs     map[string]Job
	order    []string
	attempts map[string]Attempt
}

func newMem() *memStore { return &memStore{jobs: map[string]Job{}, attempts: map[string]Attempt{}} }

func (m *memStore) Claim(_ context.Context, _ string, _ time.Time, _ time.Duration) (Job, bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, id := range m.order {
		j := m.jobs[id]
		if j.Status == StatusQueued {
			j.Status = StatusPublishing
			m.jobs[id] = j
			return j, true, nil
		}
	}
	return Job{}, false, nil
}

func (m *memStore) DueScheduled(_ context.Context, now time.Time) ([]Job, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []Job
	for _, j := range m.jobs {
		if j.Status == StatusScheduled && j.ScheduledAt != nil && !j.ScheduledAt.After(now) {
			out = append(out, j)
		}
	}
	return out, nil
}

func (m *memStore) EnqueueDue(_ context.Context, job Job) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.jobs[job.ID] = job
	return nil
}

func (m *memStore) Complete(_ context.Context, job Job, attempt Attempt) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.jobs[job.ID] = job
	m.attempts[job.ID] = attempt
	return nil
}

func (m *memStore) GetByIdempotency(_ context.Context, _, key string) (Job, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, j := range m.jobs {
		if j.IdempotencyKey == key {
			return j, nil
		}
	}
	return Job{}, social.ErrDuplicateJob
}

type stubAdapter struct {
	res    social.PublishResult
	err    error
	called *int
}

func (s stubAdapter) Platform() social.Platform { return social.PlatformX }
func (s stubAdapter) Exchange(context.Context, string, string, string) (social.TokenSet, error) {
	return social.TokenSet{}, nil
}
func (s stubAdapter) Refresh(context.Context, string) (social.TokenSet, error) {
	return social.TokenSet{}, nil
}
func (s stubAdapter) Publish(context.Context, social.TokenSet, social.PublicationPackage) (social.PublishResult, error) {
	if s.called != nil {
		(*s.called)++
	}
	return s.res, s.err
}

func TestWorkerPublishesOnceAndSkipsDuplicate(t *testing.T) {
	store := newMem()
	job := Job{
		ID: "j1", TenantID: "t1", AccountID: "a1", Platform: "x", ContentID: "c1", ContentVersion: "v1",
		Status: StatusQueued, Snapshot: "hello", BrandApplied: true, MaxAttempts: 3,
	}
	store.jobs[job.ID] = job
	store.order = []string{job.ID}
	w := Worker{
		Store: store,
		Adapter: stubAdapter{res: social.PublishResult{ExternalID: "tw-1", RawStatus: 200}},
		Tokens: func(context.Context, Job) (social.TokenSet, error) {
			return social.TokenSet{AccessToken: "tok"}, nil
		},
		MaxTries: 3,
	}
	if err := w.Tick(context.Background()); err != nil {
		t.Fatal(err)
	}
	if store.jobs[job.ID].Status != StatusPublished || store.jobs[job.ID].PlatformPublicationID != "tw-1" {
		t.Fatalf("got %+v", store.jobs[job.ID])
	}
	if err := w.Tick(context.Background()); err != nil {
		t.Fatal(err)
	}
	if store.jobs[job.ID].PlatformPublicationID != "tw-1" {
		t.Fatal("idempotency lost")
	}
}

func TestWorkerEmptyProviderIDIsPendingVerification(t *testing.T) {
	store := newMem()
	job := Job{
		ID: "j3", TenantID: "t1", AccountID: "a1", Platform: "x", ContentID: "c1", ContentVersion: "v1",
		Status: StatusQueued, Snapshot: "hello", BrandApplied: true,
	}
	store.jobs[job.ID] = job
	store.order = []string{job.ID}
	w := Worker{
		Store: store,
		Adapter: stubAdapter{res: social.PublishResult{ExternalID: "", RawStatus: 200}},
		Tokens:  func(context.Context, Job) (social.TokenSet, error) { return social.TokenSet{AccessToken: "tok"}, nil },
	}
	if err := w.Tick(context.Background()); err != nil {
		t.Fatal(err)
	}
	if store.jobs[job.ID].Status != StatusPendingVerify {
		t.Fatalf("status %s", store.jobs[job.ID].Status)
	}
	if store.jobs[job.ID].PlatformPublicationID != "" {
		t.Fatal("must not invent platform id")
	}
}

func TestWorkerReauthWhenTokensMissing(t *testing.T) {
	store := newMem()
	job := Job{
		ID: "j4", TenantID: "t1", AccountID: "a1", Platform: "youtube",
		ContentID: "c1", ContentVersion: "v1",
		Status: StatusQueued, Snapshot: "x", BrandApplied: true,
	}
	store.jobs[job.ID] = job
	store.order = []string{job.ID}
	w := Worker{
		Store: store,
		Adapter: stubAdapter{},
		Tokens: func(context.Context, Job) (social.TokenSet, error) {
			return social.TokenSet{}, social.ErrReauthRequired
		},
	}
	_ = w.Tick(context.Background())
	if store.jobs[job.ID].Status != StatusFailed {
		t.Fatalf("expected FAILED, got %s", store.jobs[job.ID].Status)
	}
}

func TestWorkerBrandFailure(t *testing.T) {
	store := newMem()
	job := Job{ID: "j2", TenantID: "t1", AccountID: "a1", Platform: "x", ContentID: "c1", ContentVersion: "v1", Status: StatusQueued, Snapshot: "x", BrandApplied: false}
	store.jobs[job.ID] = job
	store.order = []string{job.ID}
	w := Worker{Store: store, Adapter: stubAdapter{}, Tokens: func(context.Context, Job) (social.TokenSet, error) { return social.TokenSet{AccessToken: "t"}, nil }}
	_ = w.Tick(context.Background())
	if store.jobs[job.ID].Status != StatusFailed {
		t.Fatalf("status %s", store.jobs[job.ID].Status)
	}
}

func TestWorkerFinalSafetyDecisionBlocksPublish(t *testing.T) {
	store := newMem()
	job := Job{ID: "j5", TenantID: "t1", AccountID: "a1", Platform: "x", ContentID: "c1", ContentVersion: "v1", Status: StatusQueued, Snapshot: "hello", BrandApplied: true}
	store.jobs[job.ID] = job
	store.order = []string{job.ID}
	called := 0
	w := Worker{
		Store:   store,
		Adapter: stubAdapter{res: social.PublishResult{ExternalID: "tw-2", RawStatus: 200}, called: &called},
		Tokens:  func(context.Context, Job) (social.TokenSet, error) { return social.TokenSet{AccessToken: "tok"}, nil },
		BeforePublish: func(context.Context, Job) (FinalSafetyDecision, error) {
			return FinalSafetyDecision{Allowed: false, Deferred: true, Code: "KILL_SWITCH_ENGAGED", Reason: "kill switch engaged", RetryAfter: time.Minute}, nil
		},
	}
	if err := w.Tick(context.Background()); err != nil {
		t.Fatal(err)
	}
	if called != 0 {
		t.Fatalf("publish called %d times", called)
	}
	if store.jobs[job.ID].Status != StatusRetryWaiting {
		t.Fatalf("status %s", store.jobs[job.ID].Status)
	}
	if store.attempts[job.ID].ErrorCode != "KILL_SWITCH_ENGAGED" {
		t.Fatalf("attempt=%+v", store.attempts[job.ID])
	}
	if store.attempts[job.ID].NextAttemptAt == nil {
		t.Fatal("expected deferred retry time")
	}
}
