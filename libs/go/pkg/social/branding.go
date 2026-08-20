package social

import (
	"strings"
	"unicode/utf8"
)

const BrandMark = "— Agbofa Nexus AI"

type CanonicalContent struct {
	ID                 string
	Version            string
	TenantID           string
	Body               string
	Link               string
	MediaURL           string
	BrandApplied       bool
	AIGenerationRef    string
	AuthorID           string
}

type PublicationPackage struct {
	CanonicalID   string
	Version       string
	Platform      Platform
	Text          string
	Link          string
	MediaURL      string
	BrandApplied  bool
	Provenance    map[string]string
}

func Adapt(content CanonicalContent, spec Spec) (PublicationPackage, error) {
	if strings.TrimSpace(content.ID) == "" || strings.TrimSpace(content.Version) == "" {
		return PublicationPackage{}, ErrInvalidContent
	}
	if !content.BrandApplied {
		return PublicationPackage{}, ErrBrandingRequired
	}
	text := ApplyBrand(content.Body, spec)
	if spec.MaxText > 0 && utf8.RuneCountInString(text) > spec.MaxText {
		text = truncateRunes(text, spec.MaxText)
	}
	if content.Link != "" && !spec.Supports(CapabilityLink) && !spec.Supports(CapabilityText) {
		return PublicationPackage{}, ErrCapabilityUnsupported
	}
	if content.MediaURL != "" && !spec.Supports(CapabilityImage) && !spec.Supports(CapabilityVideo) {
		return PublicationPackage{}, ErrCapabilityUnsupported
	}
	return PublicationPackage{
		CanonicalID:  content.ID,
		Version:      content.Version,
		Platform:     spec.ID,
		Text:         text,
		Link:         content.Link,
		MediaURL:     content.MediaURL,
		BrandApplied: true,
		Provenance: map[string]string{
			"source_content_id": content.ID,
			"content_version":   content.Version,
			"tenant_id":         content.TenantID,
			"brand":             "Agbofa Nexus AI",
			"ai_ref":            content.AIGenerationRef,
			"author_id":         content.AuthorID,
		},
	}, nil
}

func ApplyBrand(body string, spec Spec) string {
	body = strings.TrimSpace(body)
	if strings.Contains(body, "Agbofa Nexus AI") || strings.Contains(body, "Agbofa Technologies") {
		return body
	}
	marked := body
	if marked != "" {
		marked += "\n"
	}
	marked += BrandMark
	if spec.MaxText > 0 && utf8.RuneCountInString(marked) > spec.MaxText {
		budget := spec.MaxText - utf8.RuneCountInString(" "+BrandMark)
		if budget < 1 {
			return truncateRunes(BrandMark, spec.MaxText)
		}
		return truncateRunes(body, budget) + " " + BrandMark
	}
	return marked
}

func truncateRunes(s string, n int) string {
	if n <= 0 {
		return ""
	}
	i := 0
	for idx := range s {
		if i == n {
			return s[:idx]
		}
		i++
	}
	return s
}
