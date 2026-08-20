package social

import "encoding/json"

const snapshotKind = 1

type SnapshotEnvelope struct {
	Kind     int    `json:"_nexus_snapshot"`
	Text     string `json:"text"`
	MediaURL string `json:"media_url,omitempty"`
}

func EncodeSnapshot(text, mediaURL string) string {
	raw, err := json.Marshal(SnapshotEnvelope{Kind: snapshotKind, Text: text, MediaURL: mediaURL})
	if err != nil {
		return text
	}
	return string(raw)
}

func ParseSnapshot(raw string) (text, mediaURL string) {
	var env SnapshotEnvelope
	if err := json.Unmarshal([]byte(raw), &env); err == nil && env.Kind == snapshotKind {
		return env.Text, env.MediaURL
	}
	return raw, ""
}
