package domain

import (
	"errors"
	"fmt"
)

var (
	ErrNodeNotFound           = errors.New("story graph node not found")
	ErrEntityNotFound         = errors.New("entity node not found")
	ErrRelationshipNotFound   = errors.New("graph relationship not found")
	ErrCrossTenantViolation   = errors.New("prohibited cross-tenant graph traversal or mutation")
	ErrLowConfidenceMutation  = errors.New("ai-assisted graph mutation rejected due to low confidence")
	ErrDownstreamBoundary     = errors.New("prohibited cross-boundary operation")
)

const (
	Neo4jConstraintStoryNode  = "CREATE CONSTRAINT FOR (n:StoryNode) REQUIRE (n.tenant_id, n.node_id) IS UNIQUE"
	Neo4jConstraintEntityNode = "CREATE CONSTRAINT FOR (n:EntityNode) REQUIRE (n.tenant_id, n.canonical_id) IS UNIQUE"
	Neo4jIndexEntityName      = "CREATE INDEX FOR (n:EntityNode) ON (n.tenant_id, n.name)"
)

type StoryNodeRepository interface {
	SaveStoryNode(node StoryNode) error
	GetStoryNode(tenantID, storyID string) (*StoryNode, error)
}

type EntityRepository interface {
	SaveEntity(entity EntityNode) error
	GetEntityByCanonicalID(tenantID, canonicalID string) (*EntityNode, error)
}

type RelationshipRepository interface {
	SaveRelationship(rel GraphRelationship) error
	ListRelationships(tenantID, sourceNodeID string) ([]GraphRelationship, error)
}

type SimilarityRepository interface {
	SaveSimilarityEdge(edge SimilarityEdge) error
	ListSimilarStories(tenantID, storyID string, minScore float64) ([]SimilarityEdge, error)
}

type GraphSearchRepository interface {
	SearchNodes(filter GraphQueryFilter) ([]StoryNode, error)
}

type MemoryRepository interface {
	ArchiveOldNodes(policy MemoryArchivePolicy) (int, int, error)
}

func ValidateTenantIsolation(tenantID, targetTenantID string) error {
	if tenantID == "" || targetTenantID == "" || tenantID != targetTenantID {
		return fmt.Errorf("%w: caller tenant %s cannot access target tenant %s", ErrCrossTenantViolation, tenantID, targetTenantID)
	}
	return nil
}

func ValidateConfidenceThreshold(score, minRequired float64) error {
	if score < minRequired {
		return fmt.Errorf("%w: score %.2f is below required %.2f", ErrLowConfidenceMutation, score, minRequired)
	}
	return nil
}
