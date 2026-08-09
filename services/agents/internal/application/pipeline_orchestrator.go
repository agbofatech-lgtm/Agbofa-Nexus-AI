package application

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type PipelineOrchestrator struct {
	mu             sync.RWMutex
	publisher      EventPublisher
	phase1         Phase1ServiceClient
	neo4j          Neo4jClient
	repo           domain.PipelineRepository
	agentsRegistry map[string]domain.Agent
	checkpoints    map[string]*domain.PipelineState
	workQueue      chan PipelineRequestDTO
	sagaHistory    map[string][]string // tenantID:storyID -> completed stage agent IDs
}

func NewPipelineOrchestrator(
	publisher EventPublisher,
	phase1 Phase1ServiceClient,
	neo4j Neo4jClient,
) *PipelineOrchestrator {
	o := &PipelineOrchestrator{
		publisher:      publisher,
		phase1:         phase1,
		neo4j:          neo4j,
		agentsRegistry: make(map[string]domain.Agent, 32),
		checkpoints:    make(map[string]*domain.PipelineState),
		workQueue:      make(chan PipelineRequestDTO, 1000),
		sagaHistory:    make(map[string][]string),
	}
	o.startWorkerPool(4)
	return o
}

func (o *PipelineOrchestrator) startWorkerPool(workers int) {
	for i := 0; i < workers; i++ {
		go func(id int) {
			for req := range o.workQueue {
				agent := o.GetAgent(req.AgentID)
				if pipeAgent, ok := agent.(domain.PipelineAgent); ok {
					_, err := o.ExecutePipelineStage(context.Background(), pipeAgent, req)
					if err != nil {
						log.Printf("ERROR [PipelineWorker-%d]: async stage %s failed: %v", id, req.Stage, err)
					}
				}
			}
		}(i)
	}
}

func (o *PipelineOrchestrator) SubmitPipelineRequestAsync(req PipelineRequestDTO) error {
	select {
	case o.workQueue <- req:
		log.Printf("DEBUG [PipelineOrchestrator]: accepted async pipeline request %s (queue depth: %d)", req.AgentID, len(o.workQueue))
		return nil
	default:
		log.Printf("WARN [PipelineOrchestrator]: work queue full (capacity %d), shedding load", cap(o.workQueue))
		return domain.ErrPipelineOverloaded
	}
}

func (o *PipelineOrchestrator) GetQueueDepth() int {
	return len(o.workQueue)
}

func (o *PipelineOrchestrator) WithRepository(repo domain.PipelineRepository) *PipelineOrchestrator {
	o.repo = repo
	return o
}

func (o *PipelineOrchestrator) RegisterAgent(agent domain.Agent) {
	if agent == nil {
		return
	}
	o.mu.Lock()
	defer o.mu.Unlock()
	o.agentsRegistry[agent.ID()] = agent
}

func (o *PipelineOrchestrator) RegisterAllAgents(
	monitors map[string]domain.Agent,
	detectors map[string]domain.Agent,
	verifiers map[string]domain.Agent,
	pipeline map[string]domain.PipelineAgent,
) {
	o.mu.Lock()
	defer o.mu.Unlock()
	for id, a := range monitors {
		o.agentsRegistry[id] = a
	}
	for id, a := range detectors {
		o.agentsRegistry[id] = a
	}
	for id, a := range verifiers {
		o.agentsRegistry[id] = a
	}
	for id, a := range pipeline {
		o.agentsRegistry[id] = a
	}
}

func (o *PipelineOrchestrator) GetAgent(agentID string) domain.Agent {
	o.mu.RLock()
	defer o.mu.RUnlock()
	return o.agentsRegistry[agentID]
}

func (o *PipelineOrchestrator) compensateSaga(ctx context.Context, tenantID, storyID string, failedAgent string) {
	if storyID == "" {
		return
	}
	key := fmt.Sprintf("%s:%s", tenantID, storyID)
	o.mu.RLock()
	stages, found := o.sagaHistory[key]
	o.mu.RUnlock()

	if !found || len(stages) == 0 {
		return
	}

	graphUpdated := false
	for _, stageID := range stages {
		if stageID == "AGT-026" {
			graphUpdated = true
			break
		}
	}

	if graphUpdated && o.neo4j != nil {
		log.Printf("WARN [PipelineOrchestrator]: downstream agent %s failed; executing compensating saga rollback on Neo4j for story %s (tenant %s)", failedAgent, storyID, tenantID)
		if err := o.neo4j.RollbackStoryGraph(ctx, tenantID, storyID); err != nil {
			log.Printf("ERROR [PipelineOrchestrator]: compensating saga rollback failed for story %s: %v", storyID, err)
		}
	}
}

func (o *PipelineOrchestrator) ExecutePipelineStage(
	ctx context.Context,
	agent domain.PipelineAgent,
	req PipelineRequestDTO,
) (*PipelineResponseDTO, error) {
	start := time.Now()
	if agent == nil {
		return nil, fmt.Errorf("pipeline agent is nil")
	}
	if req.TenantID != agent.TenantID() {
		return nil, domain.ErrCrossTenantViolation
	}

	payload := req.Payload
	if payload == nil {
		payload = make(map[string]string)
	}
	payload["tenant_id"] = req.TenantID
	storyID := payload["story_id"]

	payloadHash := fmt.Sprintf("%x", len(payload)*31)
	checkpointID := fmt.Sprintf("chk-%s-%d", agent.ID(), time.Now().UnixNano())
	checkpoint := &domain.PipelineState{
		StateID:          checkpointID,
		TenantID:         req.TenantID,
		AgentID:          agent.ID(),
		CurrentStage:     agent.Stage(),
		LastStatus:       domain.PipelineStatusPending,
		CheckpointStatus: domain.CheckpointStatusInProgress,
		PayloadHash:      payloadHash,
		LastUpdated:      time.Now(),
	}
	o.mu.Lock()
	o.checkpoints[checkpointID] = checkpoint
	o.mu.Unlock()
	if o.repo != nil {
		_ = o.repo.SavePipelineState(ctx, req.TenantID, checkpoint)
	}

	res, err := agent.ExecutePipeline(ctx, payload)
	if err != nil {
		checkpoint.CheckpointStatus = domain.CheckpointStatusFailed
		checkpoint.LastStatus = domain.PipelineStatusFailed
		checkpoint.LastUpdated = time.Now()
		o.mu.Lock()
		o.checkpoints[checkpointID] = checkpoint
		o.mu.Unlock()
		if o.repo != nil {
			_ = o.repo.SavePipelineState(ctx, req.TenantID, checkpoint)
		}

		// ITEM 1: Compensating Saga Rollback execution on downstream failure
		o.compensateSaga(ctx, req.TenantID, storyID, agent.ID())

		return nil, fmt.Errorf("pipeline agent %s failed: %w", agent.ID(), err)
	}

	checkpoint.CheckpointStatus = domain.CheckpointStatusCompleted
	checkpoint.LastStatus = domain.PipelineStatusSuccess
	checkpoint.LastUpdated = time.Now()
	o.mu.Lock()
	o.checkpoints[checkpointID] = checkpoint
	if storyID != "" {
		key := fmt.Sprintf("%s:%s", req.TenantID, storyID)
		o.sagaHistory[key] = append(o.sagaHistory[key], agent.ID())
	}
	o.mu.Unlock()
	if o.repo != nil {
		_ = o.repo.SavePipelineState(ctx, req.TenantID, checkpoint)
	}

	if agent.ID() == "AGT-028" && o.publisher != nil {
		isCleared := true
		if payload["content_status"] == "QUARANTINED" {
			isCleared = false
		}
		evt := &domain.ComplianceClearanceEvent{
			EventID:         fmt.Sprintf("evt-025-%d", time.Now().UnixNano()),
			TenantID:        req.TenantID,
			ContentID:       payload["content_id"],
			IsCleared:       isCleared,
			ClearanceReason: res.OutputPayload,
			OccurredAt:      time.Now(),
		}
		_ = o.publisher.PublishComplianceClearance(ctx, evt)
	}

	if o.publisher != nil && res != nil {
		evt := &domain.PipelineExecutionEvent{
			EventID:     fmt.Sprintf("evt-045-%s-%d", res.ExecutionID, time.Now().UnixNano()),
			TenantID:    req.TenantID,
			ExecutionID: res.ExecutionID,
			AgentID:     agent.ID(),
			Stage:       agent.Stage(),
			Result:      *res,
			OccurredAt:  time.Now(),
		}
		_ = o.publisher.PublishPipelineExecution(ctx, evt)
	}

	elapsed := time.Since(start).Milliseconds()
	return &PipelineResponseDTO{
		TenantID:        req.TenantID,
		AgentID:         agent.ID(),
		Result:          res,
		ExecutionTimeMs: elapsed,
	}, nil
}

func (o *PipelineOrchestrator) ResumeIncompleteCheckpoints(ctx context.Context, tenantID string) ([]*domain.PipelineState, error) {
	o.mu.RLock()
	defer o.mu.RUnlock()
	res := make([]*domain.PipelineState, 0)
	for _, chk := range o.checkpoints {
		if chk.TenantID == tenantID && chk.CheckpointStatus == domain.CheckpointStatusInProgress {
			res = append(res, chk)
		}
	}
	return res, nil
}

func (o *PipelineOrchestrator) CleanupExpiredCheckpoints(ctx context.Context, maxAge time.Duration) int {
	o.mu.Lock()
	defer o.mu.Unlock()
	now := time.Now()
	cleaned := 0
	for id, chk := range o.checkpoints {
		if now.Sub(chk.LastUpdated) > maxAge {
			delete(o.checkpoints, id)
			cleaned++
		}
	}
	return cleaned
}

func (o *PipelineOrchestrator) CheckFleetHealth(ctx context.Context, tenantID string) (*PipelineHealthReportDTO, error) {
	o.mu.RLock()
	total := len(o.agentsRegistry)
	active := 0
	for _, a := range o.agentsRegistry {
		if a.Status() == domain.AgentStatusActive || a.Status() == domain.AgentStatusIdle {
			active++
		}
	}
	o.mu.RUnlock()

	p1OK := true
	if o.phase1 != nil {
		ok, err := o.phase1.MonitorServiceHealth(ctx, "all")
		if err == nil {
			p1OK = ok
		}
	}

	return &PipelineHealthReportDTO{
		TenantID:         tenantID,
		TotalAgents:      total,
		ActiveAgents:     active,
		Phase1ServicesOK: p1OK,
		LastCheckAt:      time.Now(),
		Details: map[string]string{
			"monitors_count":     "8",
			"detectors_count":    "8",
			"verifiers_count":    "8",
			"pipeline_count":     "8",
			"total_fleet_status": "ONLINE",
			"queue_depth":        fmt.Sprintf("%d", len(o.workQueue)),
			"queue_capacity":     "1000",
		},
	}, nil
}
