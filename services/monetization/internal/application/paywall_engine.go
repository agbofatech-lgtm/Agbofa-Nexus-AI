package application

import (
	"errors"
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

var _ PaywallService = (*PaywallEngine)(nil)

// SubscriptionStatusChecker defines an optional contract to inspect terminal/historical
// subscription statuses (such as EXPIRED) when no active subscription is returned.
type SubscriptionStatusChecker interface {
	GetLatestSubscriptionStatusByReader(ctx context.Context, tenantID, readerID string) (domain.SubscriptionStatus, error)
}

type entitlementCacheEntry struct {
	check     *domain.EntitlementCheck
	expiresAt time.Time
}

// PaywallEngine implements the core Paywall Content Gating Engine for IMP-021 Batch 2.
// It enforces subscription and metered access rules, manages a 5-minute TTL entitlement cache,
// supports configurable metered limits, and executes thread-safe access tracking.
type PaywallEngine struct {
	repo              PaywallRepository
	subService        SubscriptionService
	readerVal         ReaderValidator
	pub               EventPublisher
	audit             AuditLogger
	defaultMeterLimit int
	tenantMeterLimits map[string]int
	premiumContents   map[string]map[string]bool // tenantID -> contentID -> isPremium
	cache             map[string]*entitlementCacheEntry
	cacheMutex        sync.RWMutex
	meterMutex        sync.Mutex
}

// NewPaywallEngine creates a new PaywallEngine instance with a default 5 articles/month free limit.
func NewPaywallEngine(
	repo PaywallRepository,
	subService SubscriptionService,
	readerVal ReaderValidator,
	pub EventPublisher,
	audit AuditLogger,
) *PaywallEngine {
	return &PaywallEngine{
		repo:              repo,
		subService:        subService,
		readerVal:         readerVal,
		pub:               pub,
		audit:             audit,
		defaultMeterLimit: 5,
		tenantMeterLimits: make(map[string]int),
		premiumContents:   make(map[string]map[string]bool),
		cache:             make(map[string]*entitlementCacheEntry),
	}
}

// SetTenantMeterLimit configures a tenant-specific monthly metered article limit.
func (e *PaywallEngine) SetTenantMeterLimit(tenantID string, limit int) {
	e.meterMutex.Lock()
	defer e.meterMutex.Unlock()
	e.tenantMeterLimits[tenantID] = limit
}

// SetContentPremium configures whether an article is marked as premium in the tenant catalog.
func (e *PaywallEngine) SetContentPremium(tenantID, contentID string, isPremium bool) {
	e.cacheMutex.Lock()
	defer e.cacheMutex.Unlock()
	if e.premiumContents[tenantID] == nil {
		e.premiumContents[tenantID] = make(map[string]bool)
	}
	e.premiumContents[tenantID][contentID] = isPremium
}

func (e *PaywallEngine) isContentPremiumInternal(tenantID, contentID string) bool {
	e.cacheMutex.RLock()
	defer e.cacheMutex.RUnlock()
	if e.premiumContents[tenantID] == nil {
		return false
	}
	return e.premiumContents[tenantID][contentID]
}

// IsContentPremium checks whether a specific content item requires a subscription.
func (e *PaywallEngine) IsContentPremium(ctx context.Context, tenantID, contentID string) (bool, error) {
	if tenantID == "" {
		return false, domain.ErrCrossTenantViolation
	}
	return e.isContentPremiumInternal(tenantID, contentID), nil
}

// CheckEntitlementForContent inspects reader entitlement without requiring an explicit isPremium boolean.
func (e *PaywallEngine) CheckEntitlementForContent(ctx context.Context, tenantID, readerID, contentID string) (*domain.EntitlementCheck, error) {
	isPrem := e.isContentPremiumInternal(tenantID, contentID)
	return e.CheckEntitlement(ctx, tenantID, readerID, contentID, isPrem)
}

// CheckEntitlement verifies if a reader can access content, returning access state and reason.
// Checks 5-minute TTL cache before evaluating subscription or metered free rules.
func (e *PaywallEngine) CheckEntitlement(ctx context.Context, tenantID, readerID, contentID string, isPremium bool) (*domain.EntitlementCheck, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	isAnon := (readerID == "" || strings.HasPrefix(readerID, "anon:") || strings.HasPrefix(readerID, "session:"))
	if !isAnon && e.readerVal != nil {
		if err := e.readerVal.ValidateReaderIdentity(ctx, tenantID, readerID); err != nil {
			return nil, fmt.Errorf("reader identity validation failed: %w", err)
		}
	}

	isPrem := isPremium || e.isContentPremiumInternal(tenantID, contentID)
	cacheKey := fmt.Sprintf("%s:%s:%s:%v", tenantID, readerID, contentID, isPrem)

	e.cacheMutex.RLock()
	entry, exists := e.cache[cacheKey]
	e.cacheMutex.RUnlock()
	if exists && time.Now().UTC().Before(entry.expiresAt) {
		cp := *entry.check
		return &cp, nil
	}

	var hasAccess bool
	var reason domain.PaywallReason

	if isAnon {
		// Anonymous users: always METERED_FREE (counted by session).
		// Premium content bypasses metering — subscription required.
		if isPrem {
			hasAccess = false
			reason = domain.PaywallReasonPremiumOnly
		} else {
			metered, err := e.GetMeteredAccess(ctx, tenantID, readerID)
			if err != nil {
				return nil, err
			}
			if metered.MeteredCount < metered.MeteredLimit {
				hasAccess = true
				reason = domain.PaywallReasonMeteredFree
			} else {
				hasAccess = false
				reason = domain.PaywallReasonPremiumOnly
			}
		}
	} else {
		// Authenticated reader: check active subscription first
		var activeSub *domain.ReaderSubscription
		if e.subService != nil {
			var err error
			activeSub, err = e.subService.GetActiveSubscriptionByReader(ctx, tenantID, readerID)
			if err != nil && !errors.Is(err, domain.ErrSubscriptionNotFound) {
				return nil, err
			}
		}

		if activeSub != nil && (activeSub.Status == domain.SubscriptionStatusActive || activeSub.Status == domain.SubscriptionStatusTrialing) {
			hasAccess = true
			reason = domain.PaywallReasonSubscribed
		} else {
			// Check if subscription expired
			var latestStatus domain.SubscriptionStatus
			if checker, ok := e.subService.(SubscriptionStatusChecker); ok {
				var err error
				latestStatus, err = checker.GetLatestSubscriptionStatusByReader(ctx, tenantID, readerID)
				if err != nil {
					return nil, err
				}
			}
			if latestStatus == domain.SubscriptionStatusExpired {
				hasAccess = false
				reason = domain.PaywallReasonExpired
			} else if isPrem {
				// Premium content bypasses metering — subscription required
				hasAccess = false
				reason = domain.PaywallReasonPremiumOnly
			} else {
				// Non-premium content available to metered free readers
				metered, err := e.GetMeteredAccess(ctx, tenantID, readerID)
				if err != nil {
					return nil, err
				}
				if metered.MeteredCount < metered.MeteredLimit {
					hasAccess = true
					reason = domain.PaywallReasonMeteredFree
				} else {
					hasAccess = false
					reason = domain.PaywallReasonPremiumOnly
				}
			}
		}
	}

	now := time.Now().UTC()
	check := &domain.EntitlementCheck{
		TenantID:  tenantID,
		ReaderID:  readerID,
		ContentID: contentID,
		IsPremium: isPrem,
		HasAccess: hasAccess,
		Reason:    reason,
		CheckedAt: now,
	}

	if e.repo != nil {
		meteredCount := 0
		meteredLimit := e.defaultMeterLimit
		if m, err := e.GetMeteredAccess(ctx, tenantID, readerID); err == nil && m != nil {
			meteredCount = m.MeteredCount
			meteredLimit = m.MeteredLimit
		}
		ent := &domain.PaywallEntitlement{
			TenantID:     tenantID,
			ReaderID:     readerID,
			ContentID:    contentID,
			HasAccess:    hasAccess,
			Reason:       reason,
			MeteredCount: meteredCount,
			MeteredLimit: meteredLimit,
			CheckedAt:    now,
		}
		_ = e.repo.SaveEntitlement(ctx, tenantID, ent)
	}

	if e.pub != nil {
		evt := &domain.PaywallTriggeredEvent{
			EventID:    fmt.Sprintf("evt-%d", now.UnixNano()),
			TenantID:   tenantID,
			ReaderID:   readerID,
			ContentID:  contentID,
			HasAccess:  hasAccess,
			Reason:     reason,
			OccurredAt: now,
		}
		_ = e.pub.PublishPaywallTriggered(ctx, evt)
	}

	if e.audit != nil {
		_ = e.audit.LogEvent(ctx, tenantID, "PAYWALL_ENTITLEMENT_CHECKED", contentID, fmt.Sprintf("reader_id=%s,has_access=%v,reason=%s", readerID, hasAccess, reason))
	}

	// Cache entitlement for 5 minutes
	e.cacheMutex.Lock()
	e.cache[cacheKey] = &entitlementCacheEntry{
		check:     check,
		expiresAt: now.Add(5 * time.Minute),
	}
	e.cacheMutex.Unlock()

	return check, nil
}

// GetMeteredAccess returns current monthly metered count and configurable limit for a reader.
// Resets count automatically at monthly billing period boundaries.
func (e *PaywallEngine) GetMeteredAccess(ctx context.Context, tenantID, readerID string) (*domain.MeteredAccess, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	e.meterMutex.Lock()
	limit, exists := e.tenantMeterLimits[tenantID]
	e.meterMutex.Unlock()
	if !exists || limit <= 0 {
		limit = e.defaultMeterLimit
	}

	now := time.Now().UTC()
	windowStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	windowEnd := windowStart.AddDate(0, 1, 0)

	var rec *domain.MeteredAccess
	if e.repo != nil {
		var err error
		rec, err = e.repo.GetMeteredAccess(ctx, tenantID, readerID)
		if err != nil {
			rec = nil
		}
	}

	if rec == nil {
		rec = &domain.MeteredAccess{
			TenantID:     tenantID,
			ReaderID:     readerID,
			MeteredCount: 0,
			MeteredLimit: limit,
			WindowStart:  windowStart,
			WindowEnd:    windowEnd,
		}
		return rec, nil
	}

	// Reset if monthly billing period has passed
	if now.After(rec.WindowEnd) || now.Equal(rec.WindowEnd) ||
		rec.WindowStart.Year() != windowStart.Year() ||
		rec.WindowStart.Month() != windowStart.Month() {
		rec.MeteredCount = 0
		rec.WindowStart = windowStart
		rec.WindowEnd = windowEnd
		rec.MeteredLimit = limit
	}
	rec.MeteredLimit = limit

	return rec, nil
}

// IncrementMeteredAccess thread-safely increments the monthly metered count for a reader.
func (e *PaywallEngine) IncrementMeteredAccess(ctx context.Context, tenantID, readerID string) (*domain.MeteredAccess, error) {
	return e.IncrementMeteredAccessForContent(ctx, tenantID, readerID, "")
}

// IncrementMeteredAccessForContent thread-safely increments metered count and logs the content item ID.
func (e *PaywallEngine) IncrementMeteredAccessForContent(ctx context.Context, tenantID, readerID, contentID string) (*domain.MeteredAccess, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	e.meterMutex.Lock()
	defer e.meterMutex.Unlock()

	metered, err := e.GetMeteredAccess(ctx, tenantID, readerID)
	if err != nil {
		return nil, err
	}

	metered.MeteredCount++

	if e.repo != nil {
		if updated, err := e.repo.IncrementMeteredAccess(ctx, tenantID, readerID); err == nil && updated != nil {
			metered.MeteredCount = updated.MeteredCount
		}
	}

	if e.audit != nil {
		target := contentID
		if target == "" {
			target = readerID
		}
		_ = e.audit.LogEvent(ctx, tenantID, "METERED_ACCESS_INCREMENTED", target, fmt.Sprintf("reader_id=%s,new_count=%d", readerID, metered.MeteredCount))
	}

	e.InvalidateReaderCache(ctx, tenantID, readerID)

	return metered, nil
}

// InvalidateReaderCache evicts all cached entitlement evaluations for a specific reader.
func (e *PaywallEngine) InvalidateReaderCache(ctx context.Context, tenantID, readerID string) {
	e.cacheMutex.Lock()
	defer e.cacheMutex.Unlock()
	prefix := fmt.Sprintf("%s:%s:", tenantID, readerID)
	for k := range e.cache {
		if strings.HasPrefix(k, prefix) {
			delete(e.cache, k)
		}
	}
}

// InvalidateTenantCache evicts all cached entitlement evaluations for an entire tenant.
func (e *PaywallEngine) InvalidateTenantCache(ctx context.Context, tenantID string) {
	e.cacheMutex.Lock()
	defer e.cacheMutex.Unlock()
	prefix := fmt.Sprintf("%s:", tenantID)
	for k := range e.cache {
		if strings.HasPrefix(k, prefix) {
			delete(e.cache, k)
		}
	}
}

// ClearExpiredCache purges expired TTL cache entries.
func (e *PaywallEngine) ClearExpiredCache(ctx context.Context) {
	e.cacheMutex.Lock()
	defer e.cacheMutex.Unlock()
	now := time.Now().UTC()
	for k, v := range e.cache {
		if now.After(v.expiresAt) {
			delete(e.cache, k)
		}
	}
}
