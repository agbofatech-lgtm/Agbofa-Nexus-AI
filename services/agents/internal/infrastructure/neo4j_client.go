package infrastructure

import (
	"context"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type Neo4jGraphClient struct {
	mu       sync.RWMutex
	uri      string
	username string
	password string
	driver   neo4j.DriverWithContext
}

func NewNeo4jGraphClient(uri string) *Neo4jGraphClient {
	if uri == "" {
		uri = os.Getenv("NEO4J_URI")
	}
	if uri == "" {
		uri = "bolt://localhost:7687"
	}
	user := os.Getenv("NEO4J_USERNAME")
	if user == "" {
		user = "neo4j"
	}
	pass := os.Getenv("NEO4J_PASSWORD")

	return &Neo4jGraphClient{
		uri:      uri,
		username: user,
		password: pass,
	}
}

func (c *Neo4jGraphClient) getDriver(ctx context.Context) (neo4j.DriverWithContext, error) {
	c.mu.RLock()
	drv := c.driver
	c.mu.RUnlock()
	if drv != nil {
		return drv, nil
	}

	c.mu.Lock()
	defer c.mu.Unlock()
	if c.driver != nil {
		return c.driver, nil
	}

	auth := neo4j.BasicAuth(c.username, c.password, "")
	newDrv, err := neo4j.NewDriverWithContext(c.uri, auth)
	if err != nil {
		log.Printf("ERROR [Neo4jGraphClient]: failed to create driver for URI %s: %v", c.uri, err)
		return nil, fmt.Errorf("neo4j driver init failed: %w", domain.ErrServiceUnavailable)
	}

	verCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := newDrv.VerifyConnectivity(verCtx); err != nil {
		log.Printf("ERROR [Neo4jGraphClient]: failed to verify connectivity to %s: %v", c.uri, err)
		newDrv.Close(verCtx)
		return nil, fmt.Errorf("neo4j connection unreachable at %s: %w", c.uri, domain.ErrServiceUnavailable)
	}

	c.driver = newDrv
	return c.driver, nil
}

func (c *Neo4jGraphClient) UpdateStoryGraph(ctx context.Context, tenantID, storyID string, verification domain.VerificationResult) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	if storyID == "" {
		return fmt.Errorf("story_id required for story graph update")
	}

	reqCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	drv, err := c.getDriver(reqCtx)
	if err != nil {
		return err
	}

	session := drv.NewSession(reqCtx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(reqCtx)

	_, err = session.ExecuteWrite(reqCtx, func(tx neo4j.ManagedTransaction) (any, error) {
		cypherQuery := `
		MERGE (s:Story {id: $storyID, tenant_id: $tenantID})
		SET s.verified_by = $verifierID,
		    s.verified_at = $verifiedAt,
		    s.confidence = $confidence,
		    s.status = $status
		WITH s
		CREATE (e:Evidence {id: $verificationID, tenant_id: $tenantID, confidence: $confidence})
		CREATE (s)-[r:VERIFIED_BY {timestamp: $verifiedAt}]->(e)
		RETURN s.id
		`
		params := map[string]any{
			"storyID":        storyID,
			"tenantID":       tenantID,
			"verifierID":     verification.AgentID,
			"verifiedAt":     verification.VerifiedAt.Format(time.RFC3339),
			"confidence":     verification.ConfidenceScore,
			"status":         string(verification.Status),
			"verificationID": verification.VerificationID,
		}

		res, err := tx.Run(reqCtx, cypherQuery, params)
		if err != nil {
			return nil, err
		}
		if _, err := res.Consume(reqCtx); err != nil {
			return nil, err
		}
		return nil, nil
	})

	if err != nil {
		log.Printf("ERROR [Neo4jGraphClient]: UpdateStoryGraph Cypher transaction failed: %v", err)
		return fmt.Errorf("neo4j UpdateStoryGraph failed: %w", domain.ErrUpstreamError)
	}

	log.Printf("DEBUG [Neo4jGraphClient]: updated story graph for story %s on tenant %s", storyID, tenantID)
	return nil
}

func (c *Neo4jGraphClient) RollbackStoryGraph(ctx context.Context, tenantID, storyID string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	if storyID == "" {
		return fmt.Errorf("story_id required for story graph rollback")
	}

	reqCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	drv, err := c.getDriver(reqCtx)
	if err != nil {
		return err
	}

	session := drv.NewSession(reqCtx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(reqCtx)

	_, err = session.ExecuteWrite(reqCtx, func(tx neo4j.ManagedTransaction) (any, error) {
		cypherQuery := `
		MATCH (s:Story {id: $storyID, tenant_id: $tenantID})
		OPTIONAL MATCH (s)-[r:VERIFIED_BY]->(e:Evidence {tenant_id: $tenantID})
		DETACH DELETE s, e
		`
		params := map[string]any{
			"storyID":  storyID,
			"tenantID": tenantID,
		}

		res, err := tx.Run(reqCtx, cypherQuery, params)
		if err != nil {
			return nil, err
		}
		if _, err := res.Consume(reqCtx); err != nil {
			return nil, err
		}
		return nil, nil
	})

	if err != nil {
		log.Printf("ERROR [Neo4jGraphClient]: RollbackStoryGraph Cypher transaction failed: %v", err)
		return fmt.Errorf("neo4j RollbackStoryGraph failed: %w", domain.ErrUpstreamError)
	}

	log.Printf("WARN [Neo4jGraphClient]: executed compensating saga rollback for story %s on tenant %s", storyID, tenantID)
	return nil
}

// ============================================================================
// REQ-019-010: Neo4j Collaborative Filtering Extension (IMP-019 Batch F4)
// ============================================================================
//
// Authoritative Spec Quotations:
// Source A: Arena.txt, Section 4.2, lines 143021-143027
// "type RecommendationEngine struct { neo4j neo4j.Driver ... }"
//
// Source B: Arena.txt, Section 18.2, lines 186617-186645
// Graph traversal queries for entity overlap and topic similarity via shared relationships.

func parseScoreInt(v any) int {
	switch val := v.(type) {
	case int64:
		return int(val)
	case int:
		return val
	case float64:
		return int(val)
	}
	return 0
}

func parseStringSlice(v any) []string {
	var res []string
	if slice, ok := v.([]any); ok {
		for _, item := range slice {
			if str, isStr := item.(string); isStr {
				res = append(res, str)
			}
		}
	} else if strSlice, ok := v.([]string); ok {
		res = append(res, strSlice...)
	}
	return res
}

// GetCollaborativeRecommendations returns stories engaged by similar readers who share
// interaction history with the target reader, excluding stories already engaged by the target reader.
func (c *Neo4jGraphClient) GetCollaborativeRecommendations(
	ctx context.Context,
	tenantID string,
	readerID string,
	limit int,
) ([]domain.CollaborativeRecommendation, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if readerID == "" {
		return nil, fmt.Errorf("reader_id required for collaborative recommendations")
	}
	if limit <= 0 {
		limit = 10
	}

	var results []domain.CollaborativeRecommendation
	err := domain.RetryWithBackoff(ctx, func() error {
		reqCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
		defer cancel()

		drv, err := c.getDriver(reqCtx)
		if err != nil {
			return err
		}

		session := drv.NewSession(reqCtx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
		defer session.Close(reqCtx)

		res, err := session.ExecuteRead(reqCtx, func(tx neo4j.ManagedTransaction) (any, error) {
			cypherQuery := `
MATCH (r:Reader {reader_id: $readerID, tenant_id: $tenantID})
      -[:INTERACTED_WITH]->(s:Story)
      <-[:INTERACTED_WITH]-(other:Reader)
      -[:INTERACTED_WITH]->(rec:Story)
WHERE rec.tenant_id = $tenantID
  AND rec.story_id <> s.story_id
  AND NOT (r)-[:INTERACTED_WITH]->(rec)
WITH rec, count(DISTINCT other) as collaborative_score
RETURN rec.story_id as story_id,
       rec.headline as headline,
       collaborative_score as score
ORDER BY score DESC
LIMIT $limit
`
			params := map[string]any{
				"readerID": readerID,
				"tenantID": tenantID,
				"limit":    limit,
			}

			dbRes, err := tx.Run(reqCtx, cypherQuery, params)
			if err != nil {
				return nil, err
			}

			var recs []domain.CollaborativeRecommendation
			for dbRes.Next(reqCtx) {
				record := dbRes.Record()
				var rec domain.CollaborativeRecommendation
				if sid, ok := record.Get("story_id"); ok && sid != nil {
					rec.StoryID, _ = sid.(string)
				}
				if hl, ok := record.Get("headline"); ok && hl != nil {
					rec.Headline, _ = hl.(string)
				}
				if sc, ok := record.Get("score"); ok && sc != nil {
					rec.Score = parseScoreInt(sc)
				}
				recs = append(recs, rec)
			}
			if err := dbRes.Err(); err != nil {
				return nil, err
			}
			return recs, nil
		})
		if err != nil {
			return err
		}
		if res != nil {
			results = res.([]domain.CollaborativeRecommendation)
		}
		return nil
	})

	if err != nil {
		log.Printf("ERROR [Neo4jGraphClient]: GetCollaborativeRecommendations failed for reader %s on tenant %s: %v", readerID, tenantID, err)
		return nil, err
	}

	return results, nil
}

// GetRelatedStoriesByEntity finds stories that share entities with the specified story,
// ordered by shared entities count descending.
//
// Authoritative Spec Quotation:
// Source: Arena.txt, Section 18.2, lines 186617-186645
func (c *Neo4jGraphClient) GetRelatedStoriesByEntity(
	ctx context.Context,
	tenantID string,
	storyID string,
	limit int,
) ([]domain.RelatedStory, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if storyID == "" {
		return nil, fmt.Errorf("story_id required for related stories query")
	}
	if limit <= 0 {
		limit = 20
	}

	var results []domain.RelatedStory
	err := domain.RetryWithBackoff(ctx, func() error {
		reqCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
		defer cancel()

		drv, err := c.getDriver(reqCtx)
		if err != nil {
			return err
		}

		session := drv.NewSession(reqCtx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
		defer session.Close(reqCtx)

		res, err := session.ExecuteRead(reqCtx, func(tx neo4j.ManagedTransaction) (any, error) {
			cypherQuery := `
MATCH (s:Story {story_id: $storyID, tenant_id: $tenantID})
      -[:INVOLVES_ENTITY]->(e:Entity)
      <-[:INVOLVES_ENTITY]-(related:Story)
WHERE related.tenant_id = $tenantID
  AND related.story_id <> $storyID
WITH related, count(DISTINCT e) as shared_entities
RETURN related.story_id as story_id,
       related.headline as headline,
       shared_entities as score
ORDER BY shared_entities DESC
LIMIT $limit
`
			params := map[string]any{
				"storyID":  storyID,
				"tenantID": tenantID,
				"limit":    limit,
			}

			dbRes, err := tx.Run(reqCtx, cypherQuery, params)
			if err != nil {
				return nil, err
			}

			var recs []domain.RelatedStory
			for dbRes.Next(reqCtx) {
				record := dbRes.Record()
				var rec domain.RelatedStory
				if sid, ok := record.Get("story_id"); ok && sid != nil {
					rec.StoryID, _ = sid.(string)
				}
				if hl, ok := record.Get("headline"); ok && hl != nil {
					rec.Headline, _ = hl.(string)
				}
				if sc, ok := record.Get("score"); ok && sc != nil {
					rec.SharedEntities = parseScoreInt(sc)
				}
				recs = append(recs, rec)
			}
			if err := dbRes.Err(); err != nil {
				return nil, err
			}
			return recs, nil
		})
		if err != nil {
			return err
		}
		if res != nil {
			results = res.([]domain.RelatedStory)
		}
		return nil
	})

	if err != nil {
		log.Printf("ERROR [Neo4jGraphClient]: GetRelatedStoriesByEntity failed for story %s on tenant %s: %v", storyID, tenantID, err)
		return nil, err
	}

	return results, nil
}

// GetSimilarStoriesByTopic finds stories that belong to similar topics as the specified story,
// ordered by topic overlap score descending.
//
// Authoritative Spec Quotation:
// Source: Arena.txt, Section 18.2, lines 186617-186645
func (c *Neo4jGraphClient) GetSimilarStoriesByTopic(
	ctx context.Context,
	tenantID string,
	storyID string,
	limit int,
) ([]domain.SimilarStory, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if storyID == "" {
		return nil, fmt.Errorf("story_id required for similar stories query")
	}
	if limit <= 0 {
		limit = 20
	}

	var results []domain.SimilarStory
	err := domain.RetryWithBackoff(ctx, func() error {
		reqCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
		defer cancel()

		drv, err := c.getDriver(reqCtx)
		if err != nil {
			return err
		}

		session := drv.NewSession(reqCtx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
		defer session.Close(reqCtx)

		res, err := session.ExecuteRead(reqCtx, func(tx neo4j.ManagedTransaction) (any, error) {
			cypherQuery := `
MATCH (s:Story {story_id: $storyID, tenant_id: $tenantID})
      -[:BELONGS_TO_TOPIC]->(t:Topic)
      <-[:BELONGS_TO_TOPIC]-(similar:Story)
WHERE similar.tenant_id = $tenantID
  AND similar.story_id <> $storyID
WITH similar, collect(DISTINCT t.name) as shared_topics
RETURN similar.story_id as story_id,
       similar.headline as headline,
       shared_topics,
       size(shared_topics) as score
ORDER BY score DESC
LIMIT $limit
`
			params := map[string]any{
				"storyID":  storyID,
				"tenantID": tenantID,
				"limit":    limit,
			}

			dbRes, err := tx.Run(reqCtx, cypherQuery, params)
			if err != nil {
				return nil, err
			}

			var recs []domain.SimilarStory
			for dbRes.Next(reqCtx) {
				record := dbRes.Record()
				var rec domain.SimilarStory
				if sid, ok := record.Get("story_id"); ok && sid != nil {
					rec.StoryID, _ = sid.(string)
				}
				if hl, ok := record.Get("headline"); ok && hl != nil {
					rec.Headline, _ = hl.(string)
				}
				if st, ok := record.Get("shared_topics"); ok && st != nil {
					rec.SharedTopics = parseStringSlice(st)
				}
				if sc, ok := record.Get("score"); ok && sc != nil {
					rec.Score = parseScoreInt(sc)
				}
				recs = append(recs, rec)
			}
			if err := dbRes.Err(); err != nil {
				return nil, err
			}
			return recs, nil
		})
		if err != nil {
			return err
		}
		if res != nil {
			results = res.([]domain.SimilarStory)
		}
		return nil
	})

	if err != nil {
		log.Printf("ERROR [Neo4jGraphClient]: GetSimilarStoriesByTopic failed for story %s on tenant %s: %v", storyID, tenantID, err)
		return nil, err
	}

	return results, nil
}
