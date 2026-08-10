package detectors

import (
	"context"
	"hash/fnv"
	"math"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type SimilarityResult struct {
	IsDuplicate     bool    `json:"is_duplicate"`
	SimilarityScore float64 `json:"similarity_score"`
	MatchedSignalID string  `json:"matched_signal_id"`
}

type indexEntry struct {
	SignalID  string
	Signature []uint64
	Timestamp time.Time
}

type TenantIndex struct {
	mu      sync.RWMutex
	entries []indexEntry
}

type SimilarityIndex struct {
	mu        sync.RWMutex
	tenants   map[string]*TenantIndex
	threshold float64
	capacity  int
	ttl       time.Duration
}

func NewSimilarityIndex() *SimilarityIndex {
	thresh := 0.80
	if val := os.Getenv("SIMILARITY_THRESHOLD"); val != "" {
		if t, err := strconv.ParseFloat(val, 64); err == nil && t > 0 && t <= 1.0 {
			thresh = t
		}
	}
	capVal := 10000
	if val := os.Getenv("INDEX_CAPACITY"); val != "" {
		if c, err := strconv.Atoi(val); err == nil && c > 0 {
			capVal = c
		}
	}
	ttlVal := 168 * time.Hour // 7 days
	if val := os.Getenv("INDEX_TTL"); val != "" {
		if d, err := time.ParseDuration(val); err == nil && d > 0 {
			ttlVal = d
		}
	}

	return &SimilarityIndex{
		tenants:   make(map[string]*TenantIndex),
		threshold: thresh,
		capacity:  capVal,
		ttl:       ttlVal,
	}
}

func (idx *SimilarityIndex) getTenantIndex(tenantID string) *TenantIndex {
	idx.mu.Lock()
	defer idx.mu.Unlock()
	t, exists := idx.tenants[tenantID]
	if !exists {
		t = &TenantIndex{
			entries: make([]indexEntry, 0, 100),
		}
		idx.tenants[tenantID] = t
	}
	return t
}

func shingleContent(content string, n int) map[string]struct{} {
	words := strings.Fields(strings.ToLower(content))
	res := make(map[string]struct{})
	if len(words) < n {
		res[strings.Join(words, " ")] = struct{}{}
		return res
	}
	for i := 0; i <= len(words)-n; i++ {
		shingle := strings.Join(words[i:i+n], " ")
		res[shingle] = struct{}{}
	}
	return res
}

func hashShingle(s string) uint64 {
	h := fnv.New64a()
	h.Write([]byte(s))
	return h.Sum64()
}

func computeMinHash(shingles map[string]struct{}) []uint64 {
	numHashes := 128
	sig := make([]uint64, numHashes)
	for i := 0; i < numHashes; i++ {
		sig[i] = math.MaxUint64
	}

	// Pseudo-random linear hash functions: (a*x + b) % p
	var primes = []uint64{
		1000000007, 1000000009, 1000000021, 1000000033, 1000000087, 1000000093,
		1000000097, 1000000103, 1000000123, 1000000181, 1000000207, 1000000223,
	}

	for s := range shingles {
		rawHash := hashShingle(s)
		for i := 0; i < numHashes; i++ {
			a := uint64((i*31 + 17) % 1000000007)
			b := uint64((i*47 + 23) % 1000000009)
			p := primes[i%len(primes)]
			val := (a*rawHash + b) % p
			if val < sig[i] {
				sig[i] = val
			}
		}
	}
	return sig
}

func jaccardSimilarity(sig1, sig2 []uint64) float64 {
	if len(sig1) == 0 || len(sig2) == 0 || len(sig1) != len(sig2) {
		return 0.0
	}
	matches := 0
	for i := 0; i < len(sig1); i++ {
		if sig1[i] == sig2[i] {
			matches++
		}
	}
	return float64(matches) / float64(len(sig1))
}

func (idx *SimilarityIndex) CheckSimilarity(ctx context.Context, tenantID string, signal *domain.MonitorSignal) (*SimilarityResult, error) {
	if tenantID == "" || signal == nil || signal.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}

	tIdx := idx.getTenantIndex(tenantID)
	tIdx.mu.Lock()
	defer tIdx.mu.Unlock()

	now := time.Now()
	// TTL cleanup
	validEntries := make([]indexEntry, 0, len(tIdx.entries))
	for _, e := range tIdx.entries {
		if now.Sub(e.Timestamp) <= idx.ttl {
			validEntries = append(validEntries, e)
		}
	}
	tIdx.entries = validEntries

	shingles := shingleContent(signal.Content, 3)
	sig := computeMinHash(shingles)

	maxSim := 0.0
	matchedID := ""
	for _, e := range tIdx.entries {
		if e.SignalID == signal.SignalID {
			continue
		}
		sim := jaccardSimilarity(sig, e.Signature)
		if sim > maxSim {
			maxSim = sim
			matchedID = e.SignalID
		}
	}

	if maxSim >= idx.threshold {
		return &SimilarityResult{
			IsDuplicate:     true,
			SimilarityScore: maxSim,
			MatchedSignalID: matchedID,
		}, nil
	}

	// Not duplicate: store signature in index (with LRU eviction if over capacity)
	if len(tIdx.entries) >= idx.capacity {
		tIdx.entries = tIdx.entries[1:]
	}
	tIdx.entries = append(tIdx.entries, indexEntry{
		SignalID:  signal.SignalID,
		Signature: sig,
		Timestamp: now,
	})

	return &SimilarityResult{
		IsDuplicate:     false,
		SimilarityScore: maxSim,
		MatchedSignalID: matchedID,
	}, nil
}
