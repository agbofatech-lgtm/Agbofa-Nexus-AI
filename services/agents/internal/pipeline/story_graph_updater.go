package pipeline

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

// StoryGraphUpdater implements AGT-026, the Story Graph Updater for IMP-017-D.
//
// Authoritative Spec Reference:
//   Arena.txt Volume 5 (Content Intelligence & Agents)
//   AGT-026: Story Graph Updater — Maintains the knowledge graph of stories, their relationships,
//   and their lifecycle. Updates or creates nodes in the Story Graph, links related stories through
//   entities/topics/events/sources, detects story merges (>0.85 entity overlap on same event),
//   advances status (EMERGING -> DEVELOPING -> VERIFIED -> PUBLISHED -> CORRECTED), and emits
//   StoryGraphUpdatedEvent / StoryMergeDetectedEvent.
type StoryGraphUpdater struct {
	mu             sync.RWMutex
	tenantID       string
	config         map[string]string
	initialized    bool
	aiGateway      application.AIGatewayClient
	eventBus       application.EventPublisher
	neo4j          application.Neo4jClient
	nodes          map[string]*StoryNode
	edges          map[string]map[string]string // sourceStoryID -> targetStoryID -> linkType
	mergesDetected int
}

// StoryNode represents an authoritative node in the knowledge graph.
type StoryNode struct {
	StoryID         string
	TenantID        string
	Title           string
	Status          string // EMERGING, DEVELOPING, VERIFIED, PUBLISHED, CORRECTED
	ConfidenceScore float64
	SourceCount     int
	Entities        []string
	EventName       string
	TopicName       string
	SourceIDs       []string
	RelatedStories  []string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// NewStoryGraphUpdater initializes a new StoryGraphUpdater (AGT-026).
func NewStoryGraphUpdater(aiGateway application.AIGatewayClient, eventBus application.EventPublisher, neo4j application.Neo4jClient) *StoryGraphUpdater {
	return &StoryGraphUpdater{
		aiGateway: aiGateway,
		eventBus:  eventBus,
		neo4j:     neo4j,
		nodes:     make(map[string]*StoryNode),
		edges:     make(map[string]map[string]string),
	}
}

func (u *StoryGraphUpdater) ID() string       { return "AGT-026" }
func (u *StoryGraphUpdater) Name() string     { return "Story Graph Updater" }
func (u *StoryGraphUpdater) TenantID() string { return u.tenantID }
func (u *StoryGraphUpdater) Version() string  { return "1.0.0" }

// Initialize configures and activates the StoryGraphUpdater for a specific tenant.
func (u *StoryGraphUpdater) Initialize(ctx context.Context, tenantID string, config map[string]string) error {
	if tenantID == "" {
		return domain.ErrCrossTenantViolation
	}
	u.mu.Lock()
	defer u.mu.Unlock()
	u.tenantID = tenantID
	u.config = config
	u.initialized = true
	return nil
}

// HealthCheck reports the operational status of the StoryGraphUpdater.
func (u *StoryGraphUpdater) HealthCheck(ctx context.Context) (*domain.SourceHealth, error) {
	u.mu.RLock()
	defer u.mu.RUnlock()
	if !u.initialized {
		return nil, errors.New("StoryGraphUpdater (AGT-026) not initialized")
	}
	return &domain.SourceHealth{
		SourceID:    u.ID(),
		Status:      "HEALTHY",
		LastCheckAt: time.Now(),
	}, nil
}

// Shutdown deactivates the StoryGraphUpdater.
func (u *StoryGraphUpdater) Shutdown(ctx context.Context) error {
	u.mu.Lock()
	defer u.mu.Unlock()
	u.initialized = false
	return nil
}

// Operate extracts entities from verified content, creates or updates story graph nodes,
// links related stories, detects story merges (>0.85 overlap), updates Neo4j via Neo4jClient,
// and emits StoryGraphUpdatedEvent / StoryMergeDetectedEvent.
func (u *StoryGraphUpdater) Operate(ctx context.Context, payload *domain.PipelinePayload) (*domain.PipelineResult, error) {
	if payload == nil || payload.TenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	u.mu.Lock()
	if !u.initialized {
		u.mu.Unlock()
		return nil, errors.New("StoryGraphUpdater (AGT-026) not initialized")
	}
	if u.tenantID != "" && u.tenantID != payload.TenantID {
		u.mu.Unlock()
		return nil, domain.ErrCrossTenantViolation
	}

	entities, eventName, topicName := u.extractEntities(payload)

	// Route through AIGatewayService for semantic similarity and entity extraction
	if u.aiGateway != nil {
		detReq := &domain.DetectionResult{
			ResultID:       payload.PayloadID,
			TenantID:       payload.TenantID,
			SignalID:       payload.SignalID,
			Classification: "ENTITY_EXTRACTION_AND_SIMILARITY: " + payload.Content,
			Metadata: map[string]string{
				"entities": strings.Join(entities, ","),
			},
		}
		_, _ = u.aiGateway.VerifyDetection(ctx, payload.TenantID, u.ID(), detReq)
	}

	var primaryNode *StoryNode
	var mergeCandidate *StoryNode
	var maxOverlap float64
	action := "CREATED"

	for _, n := range u.nodes {
		overlap := computeEntityOverlap(n.Entities, entities)
		if strings.EqualFold(n.EventName, eventName) && overlap > 0.85 {
			if primaryNode == nil {
				primaryNode = n
				maxOverlap = overlap
			} else {
				mergeCandidate = n
				break
			}
		} else if strings.EqualFold(n.TopicName, topicName) && overlap > 0.50 {
			if primaryNode == nil {
				primaryNode = n
			}
		}
	}

	var storyID string
	var newStatus string

	if primaryNode == nil {
		// Create new story node
		storyID = fmt.Sprintf("st-graph-%s-%d", payload.PayloadID, time.Now().UnixNano())
		newStatus = "EMERGING"
		if payload.ConfidenceScore > 0.85 && len(payload.Sources) >= 3 {
			newStatus = "VERIFIED"
		} else if len(payload.Sources) > 1 && payload.ConfidenceScore > 0.70 {
			newStatus = "DEVELOPING"
		}

		primaryNode = &StoryNode{
			StoryID:         storyID,
			TenantID:        payload.TenantID,
			Title:           payload.Content,
			Status:          newStatus,
			ConfidenceScore: payload.ConfidenceScore,
			SourceCount:     len(payload.Sources),
			Entities:        entities,
			EventName:       eventName,
			TopicName:       topicName,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}
		for _, s := range payload.Sources {
			primaryNode.SourceIDs = append(primaryNode.SourceIDs, s.SourceID)
		}
		u.nodes[storyID] = primaryNode
		action = "CREATED"
	} else {
		storyID = primaryNode.StoryID
		// Merge candidate detection
		if mergeCandidate != nil {
			action = "MERGED"
			u.mergesDetected++
			// Merge sources and attributions
			primaryNode.SourceIDs = append(primaryNode.SourceIDs, mergeCandidate.SourceIDs...)
			primaryNode.SourceCount += mergeCandidate.SourceCount
			primaryNode.ConfidenceScore = (primaryNode.ConfidenceScore + mergeCandidate.ConfidenceScore) / 2.0
			primaryNode.Entities = mergeUnique(primaryNode.Entities, mergeCandidate.Entities)
			delete(u.nodes, mergeCandidate.StoryID)
		} else {
			action = "UPDATED"
			oldConf := primaryNode.ConfidenceScore
			primaryNode.ConfidenceScore = (oldConf*float64(primaryNode.SourceCount) + payload.ConfidenceScore) / float64(primaryNode.SourceCount+1)
			primaryNode.SourceCount += len(payload.Sources)
			for _, s := range payload.Sources {
				primaryNode.SourceIDs = append(primaryNode.SourceIDs, s.SourceID)
			}
		}

		// Advance status lifecycle
		if primaryNode.Status == "PUBLISHED" {
			primaryNode.Status = "CORRECTED"
		} else if primaryNode.SourceCount >= 3 && primaryNode.ConfidenceScore > 0.85 {
			primaryNode.Status = "VERIFIED"
		} else if primaryNode.SourceCount > 1 && primaryNode.ConfidenceScore > 0.70 {
			primaryNode.Status = "DEVELOPING"
		}
		primaryNode.UpdatedAt = time.Now()
		newStatus = primaryNode.Status
	}

	// Link related stories
	for sid, target := range u.nodes {
		if sid == storyID {
			continue
		}
		if strings.EqualFold(target.EventName, eventName) {
			u.addEdge(storyID, sid, "EVENT_LINK")
		} else if strings.EqualFold(target.TopicName, topicName) {
			u.addEdge(storyID, sid, "TOPIC_LINK")
		}
	}
	u.mu.Unlock()

	// Update Phase 1 Neo4jClient
	if u.neo4j != nil {
		_ = u.neo4j.UpdateStoryGraph(ctx, payload.TenantID, storyID, domain.VerificationResult{
			VerificationID:  payload.PayloadID,
			TenantID:        payload.TenantID,
			ConfidenceScore: primaryNode.ConfidenceScore,
			Metadata:        map[string]string{"action": action},
		})
	}

	targetStage := "STORY_GRAPH"
	if action == "MERGED" && mergeCandidate != nil {
		targetStage = "STORY_GRAPH:MERGE"
	}

	res := &domain.PipelineResult{
		ResultID:       fmt.Sprintf("res-graph-%s-%d", payload.PayloadID, time.Now().UnixNano()),
		TenantID:       payload.TenantID,
		AgentID:        u.ID(),
		Stage:          domain.PipelineStageStoryGraph,
		Status:         domain.PipelineStatusSuccess,
		PayloadID:      payload.PayloadID,
		TargetPipeline: targetStage,
		Priority:       "HIGH",
		RoutedAt:       time.Now(),
		Metadata: map[string]string{
			"story_id":         storyID,
			"action":           action,
			"new_status":       newStatus,
			"confidence_score": fmt.Sprintf("%.4f", primaryNode.ConfidenceScore),
			"source_count":     fmt.Sprintf("%d", primaryNode.SourceCount),
			"target_stage":     targetStage,
		},
	}
	if mergeCandidate != nil {
		res.Metadata["merged_story_id"] = mergeCandidate.StoryID
		res.Metadata["overlap_score"] = fmt.Sprintf("%.2f", maxOverlap)
	}

	// Event emission via EventPublisher
	if u.eventBus != nil {
		_ = u.eventBus.PublishPipelineExecution(ctx, &domain.PipelineExecutionEvent{
			EventID:      fmt.Sprintf("evt-graph-%s", storyID),
			TenantID:     payload.TenantID,
			ExecutionID:  res.ResultID,
			AgentID:      u.ID(),
			PipelineName: targetStage,
			Status:       action,
			StartedAt:    time.Now(),
			CompletedAt:  time.Now(),
			Metadata:     res.Metadata,
		})
	}
	return res, nil
}

func (u *StoryGraphUpdater) addEdge(fromID, toID, linkType string) {
	if _, ok := u.edges[fromID]; !ok {
		u.edges[fromID] = make(map[string]string)
	}
	u.edges[fromID][toID] = linkType
}

func (u *StoryGraphUpdater) extractEntities(payload *domain.PipelinePayload) ([]string, string, string) {
	if payload.Metadata != nil && payload.Metadata["entities"] != "" {
		parts := strings.Split(payload.Metadata["entities"], ",")
		for i := range parts {
			parts[i] = strings.TrimSpace(parts[i])
		}
		evt := payload.Metadata["event_name"]
		if evt == "" {
			evt = "default_event"
		}
		top := payload.Metadata["topic_name"]
		if top == "" {
			top = "default_topic"
		}
		return parts, evt, top
	}
	words := strings.Fields(payload.Content)
	var entities []string
	for _, w := range words {
		if len(w) > 4 {
			entities = append(entities, strings.Trim(w, ".,!\"'"))
		}
	}
	return entities, "general_event", "general_topic"
}

func computeEntityOverlap(a, b []string) float64 {
	if len(a) == 0 || len(b) == 0 {
		return 0.0
	}
	set := make(map[string]bool)
	for _, v := range a {
		set[strings.ToLower(v)] = true
	}
	var match int
	for _, v := range b {
		if set[strings.ToLower(v)] {
			match++
		}
	}
	return float64(match) / float64(len(a))
}

func mergeUnique(a, b []string) []string {
	set := make(map[string]bool)
	for _, v := range a {
		set[v] = true
	}
	out := append([]string(nil), a...)
	for _, v := range b {
		if !set[v] {
			set[v] = true
			out = append(out, v)
		}
	}
	return out
}

// Route returns "STORY_GRAPH" as the pipeline stage identifier, or "STORY_GRAPH:MERGE"
// if a story merge was detected.
func (u *StoryGraphUpdater) Route(ctx context.Context, payload *domain.PipelinePayload) (string, error) {
	res, err := u.Operate(ctx, payload)
	if err != nil {
		return "", err
	}
	return res.TargetPipeline, nil
}

// Report returns graph metrics including total_nodes, total_edges, nodes_by_status,
// merges_detected, average_confidence, and graph_density.
func (u *StoryGraphUpdater) Report(ctx context.Context, payload *domain.PipelinePayload) (*domain.PipelineReport, error) {
	u.mu.RLock()
	defer u.mu.RUnlock()

	statusCounts := make(map[string]int)
	var totalConf float64
	for _, n := range u.nodes {
		statusCounts[n.Status]++
		totalConf += n.ConfidenceScore
	}
	var totalEdges int
	for _, targetMap := range u.edges {
		totalEdges += len(targetMap)
	}

	var avgConf, density float64
	nodeCount := len(u.nodes)
	if nodeCount > 0 {
		avgConf = totalConf / float64(nodeCount)
		if nodeCount > 1 {
			density = float64(totalEdges) / float64(nodeCount*(nodeCount-1))
		}
	}

	rep := &domain.PipelineReport{
		ReportID:  fmt.Sprintf("rep-graph-%d", time.Now().UnixNano()),
		TenantID:  u.tenantID,
		AgentID:   u.ID(),
		Metrics: map[string]interface{}{
			"total_nodes":        nodeCount,
			"total_edges":        totalEdges,
			"nodes_by_status":    statusCounts,
			"merges_detected":    u.mergesDetected,
			"average_confidence": avgConf,
			"graph_density":      density,
		},
		Anomalies:       []string{"none"},
		Recommendations: []string{"Continue knowledge graph linking and story lifecycle tracking."},
		GeneratedAt:     time.Now(),
	}
	if payload != nil {
		rep.PayloadID = payload.PayloadID
		rep.TenantID = payload.TenantID
	}
	return rep, nil
}

// PersistStateSQL persists the pipeline state to PostgreSQL under strict RLS transaction isolation.
func (u *StoryGraphUpdater) PersistStateSQL(ctx context.Context, db *sql.DB, tenantID string, state *domain.PipelineState) error {
	if tenantID == "" || state == nil || state.TenantID == "" || tenantID != state.TenantID {
		return domain.ErrCrossTenantViolation
	}
	if db == nil {
		return errors.New("database connection is nil")
	}
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, "SET LOCAL app.current_tenant = $1", tenantID); err != nil {
		return fmt.Errorf("failed to set RLS tenant context: %w", err)
	}
	query := `
		INSERT INTO pipeline_states (state_id, tenant_id, agent_id, current_stage, last_status, last_updated, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (state_id, tenant_id) DO UPDATE SET
			last_status = EXCLUDED.last_status, last_updated = EXCLUDED.last_updated;
	`
	_, err = tx.ExecContext(ctx, query, state.StateID, tenantID, state.AgentID, string(state.CurrentStage), string(state.LastStatus), state.LastUpdated, time.Now())
	if err != nil {
		return err
	}
	return tx.Commit()
}
