package domain

import (
	"time"
)

type EntityType string

const (
	EntityTypePerson       EntityType = "PERSON"
	EntityTypeOrganization EntityType = "ORGANIZATION"
	EntityTypeLocation     EntityType = "LOCATION"
	EntityTypeConcept      EntityType = "CONCEPT"
)

type RelType string

const (
	RelTypeMentions     RelType = "MENTIONS"
	RelTypeCorroborates RelType = "CORROBORATES"
	RelTypeContradicts  RelType = "CONTRADICTS"
	RelTypeSimilarTo    RelType = "SIMILAR_TO"
	RelTypeVersionOf    RelType = "VERSION_OF"
)

type StoryNode struct {
	NodeID          string
	TenantID        string
	StoryID         string
	Title           string
	TruthState      string
	ConfidenceScore float64
	Version         int
	ValidFrom       time.Time
	ValidTo         time.Time
}

type EntityNode struct {
	EntityID    string
	TenantID    string
	CanonicalID string
	Name        string
	EntityType  EntityType
	Properties  map[string]string
}

type GraphRelationship struct {
	RelID        string
	TenantID     string
	SourceNodeID string
	TargetNodeID string
	RelType      RelType
	Weight       float64
	ValidFrom    time.Time
	ValidTo      time.Time
}

type SimilarityEdge struct {
	TenantID        string
	SourceStoryID   string
	TargetStoryID   string
	SimilarityScore float64
	ClusterID       string
}

type GraphQueryFilter struct {
	TenantID      string
	EntityTypes   []string
	MinConfidence float64
	QueryText     string
}

type MemoryArchivePolicy struct {
	TenantID             string
	ArchiveThresholdDays int
	PruneOrphanNodes     bool
}

type WorkflowInstanceRef struct {
	InstanceID string
	TenantID   string
	WorkflowID string
	Status     string
	Parameters map[string]string
	StartedAt  time.Time
}
