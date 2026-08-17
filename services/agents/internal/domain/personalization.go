package domain

import (
	"context"
	"strconv"
	"time"
)

type ReaderProfile struct {
	ReaderID       string            `json:"reader_id"`
	TenantID       string            `json:"tenant_id"`
	Preferences    map[string]string `json:"preferences"`
	InterestVector []float64         `json:"interest_vector"`
	LastActiveAt   time.Time         `json:"last_active_at"`
}

type BehavioralSignal struct {
	SignalID        string    `json:"signal_id"`
	TenantID        string    `json:"tenant_id"`
	ReaderID        string    `json:"reader_id"`
	ContentID       string    `json:"content_id"`
	InteractionType string    `json:"interaction_type"`
	DurationMs      int64     `json:"duration_ms"`
	Weight          float64   `json:"weight"`
	OccurredAt      time.Time `json:"occurred_at"`
}

type PersonalizedFeedItem struct {
	ItemID         string  `json:"item_id"`
	TenantID       string  `json:"tenant_id"`
	ReaderID       string  `json:"reader_id"`
	ContentID      string  `json:"content_id"`
	RelevanceScore float64 `json:"relevance_score"`
	Strategy       string  `json:"strategy"`
	Reason         string  `json:"reason"`
}

type PersonalizedFeed struct {
	FeedID      string                 `json:"feed_id"`
	TenantID    string                 `json:"tenant_id"`
	ReaderID    string                 `json:"reader_id"`
	Items       []PersonalizedFeedItem `json:"items"`
	GeneratedAt time.Time              `json:"generated_at"`
	NextCursor  string                 `json:"next_cursor,omitempty"`
	PrevCursor  string                 `json:"prev_cursor,omitempty"`
	HasMore     bool                   `json:"has_more,omitempty"`
	TotalCount  int                    `json:"total_count,omitempty"`
}

type RecommendationModel struct {
	ModelID  string             `json:"model_id"`
	TenantID string             `json:"tenant_id"`
	Name     string             `json:"name"`
	Weights  map[string]float64 `json:"weights"`
	Metadata map[string]string  `json:"metadata"`
}

type PersonalizationEngine interface {
	ID() string
	Name() string
	TenantID() string
	ExecutePersonalization(ctx context.Context, payload map[string]string) (interface{}, error)
}

type CollaborativeRecommendation struct {
	StoryID  string `json:"story_id"`
	Headline string `json:"headline"`
	Score    int    `json:"score"`
}

type RelatedStory struct {
	StoryID        string `json:"story_id"`
	Headline       string `json:"headline"`
	SharedEntities int    `json:"score"`
}

type SimilarStory struct {
	StoryID      string   `json:"story_id"`
	Headline     string   `json:"headline"`
	SharedTopics []string `json:"shared_topics"`
	Score        int      `json:"score"`
}

// Additive DTOs and domain types for IMP-019 Advanced Personalization

type TopicPreference struct {
	TopicID string  `json:"topic_id"`
	Name    string  `json:"name"`
	Weight  float64 `json:"weight"` // 0.0-1.0
}

type SourcePreference struct {
	SourceID string  `json:"source_id"`
	Name     string  `json:"name"`
	Weight   float64 `json:"weight"` // 0.0-1.0
}

type FormatPreference struct {
	FormatType string  `json:"format_type"` // ARTICLE, VIDEO, AUDIO, SHORT, INTERACTIVE
	Weight     float64 `json:"weight"`      // 0.0-1.0
}

type ReadingWindow struct {
	StartTimeUTC string `json:"start_time_utc"` // e.g. "07:00"
	EndTimeUTC   string `json:"end_time_utc"`   // e.g. "09:00"
	Frequency    int    `json:"frequency"`
}

type InferredPreference struct {
	PreferenceID string    `json:"preference_id"`
	Category     string    `json:"category"` // TOPIC, SOURCE, FORMAT, TIME
	Value        string    `json:"value"`
	Confidence   float64   `json:"confidence"` // 0.0-1.0
	InferredAt   time.Time `json:"inferred_at"`
}

type ReadingPattern struct {
	ReaderID       string          `json:"reader_id"`
	TenantID       string          `json:"tenant_id"`
	AvgDurationMs  int64           `json:"avg_duration_ms"`
	ActiveWindows  []ReadingWindow `json:"active_windows"`
	DepthScore     float64         `json:"depth_score"`     // 0.0-1.0
	ExpertiseLevel string          `json:"expertise_level"` // NOVICE, INTERMEDIATE, EXPERT
	CompletionRate float64         `json:"completion_rate"`
}

type BehavioralInsights struct {
	ReaderID        string               `json:"reader_id"`
	TenantID        string               `json:"tenant_id"`
	Pattern         ReadingPattern       `json:"pattern"`
	Inferred        []InferredPreference `json:"inferred"`
	EngagementScore float64              `json:"engagement_score"` // 0.0-1.0
	LastAnalyzedAt  time.Time            `json:"last_analyzed_at"`
}

func (p *ReaderProfile) GetTopicPreferences() []TopicPreference {
	if p == nil || p.Preferences == nil {
		return nil
	}
	var out []TopicPreference
	for k, v := range p.Preferences {
		if len(k) > 6 && k[:6] == "topic:" {
			w := 0.5
			if val, err := strconv.ParseFloat(v, 64); err == nil {
				w = val
			}
			out = append(out, TopicPreference{
				TopicID: k[6:],
				Name:    k[6:],
				Weight:  w,
			})
		}
	}
	return out
}

func (p *ReaderProfile) GetSourcePreferences() []SourcePreference {
	if p == nil || p.Preferences == nil {
		return nil
	}
	var out []SourcePreference
	for k, v := range p.Preferences {
		if len(k) > 7 && k[:7] == "source:" {
			w := 0.5
			if val, err := strconv.ParseFloat(v, 64); err == nil {
				w = val
			}
			out = append(out, SourcePreference{
				SourceID: k[7:],
				Name:     k[7:],
				Weight:   w,
			})
		}
	}
	return out
}

func (p *ReaderProfile) GetFormatPreferences() []FormatPreference {
	if p == nil || p.Preferences == nil {
		return nil
	}
	var out []FormatPreference
	for k, v := range p.Preferences {
		if len(k) > 7 && k[:7] == "format:" {
			w := 0.5
			if val, err := strconv.ParseFloat(v, 64); err == nil {
				w = val
			}
			out = append(out, FormatPreference{
				FormatType: k[7:],
				Weight:     w,
			})
		}
	}
	return out
}
