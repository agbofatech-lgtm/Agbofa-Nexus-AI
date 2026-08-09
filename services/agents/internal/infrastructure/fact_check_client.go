package infrastructure

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type FactCheckAPIClient struct {
	rateLimiter application.RateLimiter
	httpClient  *http.Client
}

func NewFactCheckAPIClient(limiter application.RateLimiter) *FactCheckAPIClient {
	// Require valid TLS 1.2+ certificate verification
	tlsConfig := &tls.Config{
		MinVersion: tls.VersionTLS12,
	}
	transport := &http.Transport{
		TLSClientConfig:     tlsConfig,
		TLSHandshakeTimeout: 5 * time.Second,
	}
	return &FactCheckAPIClient{
		rateLimiter: limiter,
		httpClient: &http.Client{
			Transport: transport,
			Timeout:   10 * time.Second,
		},
	}
}

func (c *FactCheckAPIClient) QueryTrustedDatabases(ctx context.Context, tenantID, claim string) ([]domain.EvidenceItem, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if claim == "" {
		return []domain.EvidenceItem{}, nil
	}

	evidence := make([]domain.EvidenceItem, 0)
	errs := make([]string, 0)

	// 1. Query GDELT Project API
	gdeltEv, err := c.queryGDELT(ctx, claim)
	if err != nil {
		log.Printf("WARN [FactCheckAPIClient]: GDELT query failed: %v", err)
		errs = append(errs, fmt.Sprintf("GDELT: %v", err))
	} else if gdeltEv != nil {
		evidence = append(evidence, *gdeltEv)
	}

	// 2. Query Wikidata API
	wikidataEv, err := c.queryWikidata(ctx, claim)
	if err != nil {
		log.Printf("WARN [FactCheckAPIClient]: Wikidata query failed: %v", err)
		errs = append(errs, fmt.Sprintf("Wikidata: %v", err))
	} else if wikidataEv != nil {
		evidence = append(evidence, *wikidataEv)
	}

	if len(evidence) == 0 && len(errs) > 0 {
		return nil, fmt.Errorf("all fact-check sources failed: %s: %w", errs, domain.ErrUpstreamError)
	}

	return evidence, nil
}

func (c *FactCheckAPIClient) queryGDELT(ctx context.Context, claim string) (*domain.EvidenceItem, error) {
	qStr := url.QueryEscape(claim)
	apiURL := fmt.Sprintf("https://api.gdeltproject.org/api/v2/doc/doc?query=%s&mode=artlist&maxrecords=3&format=json", qStr)

	reqCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gdelt network error: %w", domain.ErrUpstreamTimeout)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("gdelt returned status %d: %w", resp.StatusCode, domain.ErrUpstreamError)
	}

	var data struct {
		Articles []struct {
			URL       string `json:"url"`
			Title     string `json:"title"`
			Domain    string `json:"domain"`
			Seendate  string `json:"seendate"`
		} `json:"articles"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}
	if len(data.Articles) == 0 {
		return nil, nil
	}

	art := data.Articles[0]
	return &domain.EvidenceItem{
		EvidenceID:  fmt.Sprintf("gdelt-%d", time.Now().UnixNano()),
		Type:        "GDELT_ARCHIVE_MATCH",
		Description: fmt.Sprintf("Found corroborating news report on domain %s: %s", art.Domain, art.Title),
		SourceURL:   art.URL,
		Confidence:  0.90,
		Metadata: map[string]string{
			"source_domain": art.Domain,
			"seen_date":     art.Seendate,
		},
	}, nil
}

func (c *FactCheckAPIClient) queryWikidata(ctx context.Context, claim string) (*domain.EvidenceItem, error) {
	qStr := url.QueryEscape(claim)
	apiURL := fmt.Sprintf("https://www.wikidata.org/w/api.php?action=wbsearchentities&search=%s&language=en&format=json&limit=3", qStr)

	reqCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "agbofa-nexus-ai-verifier/1.0.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("wikidata network error: %w", domain.ErrUpstreamTimeout)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("wikidata returned status %d: %w", resp.StatusCode, domain.ErrUpstreamError)
	}

	var data struct {
		Search []struct {
			ID          string `json:"id"`
			Label       string `json:"label"`
			Description string `json:"description"`
			URL         string `json:"url"`
		} `json:"search"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}
	if len(data.Search) == 0 {
		return nil, nil
	}

	ent := data.Search[0]
	entURL := ent.URL
	if entURL == "" {
		entURL = "https://www.wikidata.org/wiki/" + ent.ID
	}
	return &domain.EvidenceItem{
		EvidenceID:  fmt.Sprintf("wikidata-%s", ent.ID),
		Type:        "WIKIDATA_ENTITY_MATCH",
		Description: fmt.Sprintf("Verified entity %s (%s): %s", ent.ID, ent.Label, ent.Description),
		SourceURL:   entURL,
		Confidence:  0.88,
		Metadata: map[string]string{
			"entity_id":    ent.ID,
			"entity_label": ent.Label,
		},
	}, nil
}
