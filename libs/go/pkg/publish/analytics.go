package publish

import "strings"

// Snapshot is a normalized analytics record. Values are only stored when a
// provider actually returned them. Zero means "not reported", not a fake metric.
type Snapshot struct {
	Platform     string
	ResourceID   string
	Window       string
	Impressions  *int64
	Views        *int64
	Likes        *int64
	Comments     *int64
	Shares       *int64
	Clicks       *int64
	SourceMetric string
}

func Normalize(platform, resourceID, window, source string, values map[string]int64) Snapshot {
	s := Snapshot{Platform: strings.ToLower(platform), ResourceID: resourceID, Window: window, SourceMetric: source}
	if v, ok := values["impressions"]; ok {
		s.Impressions = &v
	}
	if v, ok := values["views"]; ok {
		s.Views = &v
	}
	if v, ok := values["video_views"]; ok && s.Views == nil {
		s.Views = &v
		if s.SourceMetric == "" {
			s.SourceMetric = "video_views"
		}
	}
	if v, ok := values["likes"]; ok {
		s.Likes = &v
	}
	if v, ok := values["comments"]; ok {
		s.Comments = &v
	}
	if v, ok := values["shares"]; ok {
		s.Shares = &v
	}
	if v, ok := values["clicks"]; ok {
		s.Clicks = &v
	}
	return s
}
