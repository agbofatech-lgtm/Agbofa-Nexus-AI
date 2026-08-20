package publish

import "testing"

func TestNormalizeDoesNotInventMetrics(t *testing.T) {
	s := Normalize("x", "tw-1", "1h", "impressions", map[string]int64{"impressions": 12})
	if s.Impressions == nil || *s.Impressions != 12 {
		t.Fatal("impressions")
	}
	if s.Likes != nil || s.Views != nil {
		t.Fatal("must not invent unreported metrics")
	}
}
