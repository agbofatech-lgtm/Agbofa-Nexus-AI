package verification

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

// VerificationRegistry manages registration, lifecycle, and concurrent execution
// of all ContentVerifiers in IMP-017-C (AGT-017 through AGT-024).
type VerificationRegistry struct {
	mu        sync.RWMutex
	verifiers map[string]ContentVerifier
}

// NewVerificationRegistry initializes a new VerificationRegistry instance.
func NewVerificationRegistry() *VerificationRegistry {
	return &VerificationRegistry{
		verifiers: make(map[string]ContentVerifier, 8),
	}
}

// RegisterVerifier registers a ContentVerifier in the registry.
func (r *VerificationRegistry) RegisterVerifier(verifier ContentVerifier) error {
	if verifier == nil {
		return fmt.Errorf("cannot register nil content verifier")
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	r.verifiers[verifier.ID()] = verifier
	return nil
}

// GetVerifier retrieves a ContentVerifier by ID.
func (r *VerificationRegistry) GetVerifier(verifierID string) (ContentVerifier, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	v, ok := r.verifiers[verifierID]
	if !ok {
		return nil, fmt.Errorf("content verifier %s not found in registry", verifierID)
	}
	return v, nil
}

// ListVerifiers returns a slice of all registered ContentVerifiers.
func (r *VerificationRegistry) ListVerifiers() []ContentVerifier {
	r.mu.RLock()
	defer r.mu.RUnlock()
	list := make([]ContentVerifier, 0, len(r.verifiers))
	for _, v := range r.verifiers {
		list = append(list, v)
	}
	return list
}

// InitializeAll initializes all registered ContentVerifiers for a specific tenant.
func (r *VerificationRegistry) InitializeAll(ctx context.Context, tenantID string, config map[string]string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	r.mu.RLock()
	list := make([]ContentVerifier, 0, len(r.verifiers))
	for _, v := range r.verifiers {
		if v.TenantID() == "" || v.TenantID() == tenantID {
			list = append(list, v)
		}
	}
	r.mu.RUnlock()

	for _, v := range list {
		if err := v.Initialize(ctx, tenantID, config); err != nil {
			return fmt.Errorf("failed to initialize verifier %s: %w", v.ID(), err)
		}
	}
	return nil
}

// HealthCheckAll performs concurrent health checks on all registered ContentVerifiers.
func (r *VerificationRegistry) HealthCheckAll(ctx context.Context) (map[string]*domain.SourceHealth, error) {
	r.mu.RLock()
	list := make([]ContentVerifier, 0, len(r.verifiers))
	for _, v := range r.verifiers {
		list = append(list, v)
	}
	r.mu.RUnlock()

	healthMap := make(map[string]*domain.SourceHealth, len(list))
	for _, v := range list {
		h, err := v.HealthCheck(ctx)
		if err != nil || h == nil {
			healthMap[v.ID()] = &domain.SourceHealth{
				SourceID:     v.ID(),
				Status:       "OFFLINE",
				LastCheckAt:  time.Now(),
				ErrorMessage: fmt.Sprintf("%v", err),
			}
		} else {
			healthMap[v.ID()] = h
		}
	}
	return healthMap, nil
}

// ShutdownAll gracefully shuts down all registered ContentVerifiers.
func (r *VerificationRegistry) ShutdownAll(ctx context.Context) error {
	r.mu.RLock()
	list := make([]ContentVerifier, 0, len(r.verifiers))
	for _, v := range r.verifiers {
		list = append(list, v)
	}
	r.mu.RUnlock()

	for _, v := range list {
		_ = v.Shutdown(ctx)
	}
	return nil
}

// VerifyAll executes Verify concurrently across all registered ContentVerifiers
// using goroutines, sync.WaitGroup, and sync.Mutex with mandatory tenant isolation filtering.
func (r *VerificationRegistry) VerifyAll(ctx context.Context, claim *domain.Claim) ([]*domain.VerificationResult, error) {
	if claim == nil || claim.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	r.mu.RLock()
	list := make([]ContentVerifier, 0, len(r.verifiers))
	for _, v := range r.verifiers {
		if v.TenantID() == "" || v.TenantID() == claim.TenantID {
			list = append(list, v)
		}
	}
	r.mu.RUnlock()

	var results []*domain.VerificationResult
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, v := range list {
		wg.Add(1)
		go func(verifier ContentVerifier) {
			defer wg.Done()
			res, err := verifier.Verify(ctx, claim)
			if err == nil && res != nil {
				mu.Lock()
				results = append(results, res)
				mu.Unlock()
			}
		}(v)
	}

	wg.Wait()
	return results, nil
}

// CorroborateAll executes Corroborate concurrently across all registered ContentVerifiers
// with mandatory tenant isolation filtering.
func (r *VerificationRegistry) CorroborateAll(ctx context.Context, claim *domain.Claim, sources []domain.Source) ([]*domain.CorroborationResult, error) {
	if claim == nil || claim.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	r.mu.RLock()
	list := make([]ContentVerifier, 0, len(r.verifiers))
	for _, v := range r.verifiers {
		if v.TenantID() == "" || v.TenantID() == claim.TenantID {
			list = append(list, v)
		}
	}
	r.mu.RUnlock()

	var results []*domain.CorroborationResult
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, v := range list {
		wg.Add(1)
		go func(verifier ContentVerifier) {
			defer wg.Done()
			res, err := verifier.Corroborate(ctx, claim, sources)
			if err == nil && res != nil {
				mu.Lock()
				results = append(results, res)
				mu.Unlock()
			}
		}(v)
	}

	wg.Wait()
	return results, nil
}

// AssessAll executes Assess concurrently across all registered ContentVerifiers
// with mandatory tenant isolation filtering.
func (r *VerificationRegistry) AssessAll(ctx context.Context, claim *domain.Claim) ([]*domain.AssessmentResult, error) {
	if claim == nil || claim.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	r.mu.RLock()
	list := make([]ContentVerifier, 0, len(r.verifiers))
	for _, v := range r.verifiers {
		if v.TenantID() == "" || v.TenantID() == claim.TenantID {
			list = append(list, v)
		}
	}
	r.mu.RUnlock()

	var results []*domain.AssessmentResult
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, v := range list {
		wg.Add(1)
		go func(verifier ContentVerifier) {
			defer wg.Done()
			res, err := verifier.Assess(ctx, claim)
			if err == nil && res != nil {
				mu.Lock()
				results = append(results, res)
				mu.Unlock()
			}
		}(v)
	}

	wg.Wait()
	return results, nil
}
