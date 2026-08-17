package infrastructure

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/IBM/sarama"

	"github.com/agbofa/nexus/libs/go/pkg/events"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type DLQStats struct {
	FailedSends int `json:"failed_sends"`
	DLQWrites   int `json:"dlq_writes"`
	DLQDiscards int `json:"dlq_discards"`
}

type KafkaEventBus struct {
	mu          sync.RWMutex
	producer    sarama.SyncProducer
	brokers     []string
	topicPrefix string
	sentCount   int
	dlqPath     string
	dlqStats    DLQStats
}

func NewKafkaEventBus() *KafkaEventBus {
	brokerStr := os.Getenv("KAFKA_BROKERS")
	if brokerStr == "" {
		brokerStr = "localhost:9092"
	}
	brokers := strings.Split(brokerStr, ",")

	config := sarama.NewConfig()
	config.Producer.Return.Successes = true
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 3

	var prod sarama.SyncProducer
	prod, err := sarama.NewSyncProducer(brokers, config)
	if err != nil {
		log.Printf("WARN [KafkaEventBus]: failed to connect to brokers %v: %v (will retry on publish)", brokers, err)
	}

	dlqFile := "/var/log/agbofa/kafka_dlq.jsonl"
	if err := os.MkdirAll(filepath.Dir(dlqFile), 0755); err != nil {
		dlqFile = "/tmp/kafka_dlq.jsonl"
	}

	return &KafkaEventBus{
		producer:    prod,
		brokers:     brokers,
		topicPrefix: "agbofa.nexus.p2.agents.",
		dlqPath:     dlqFile,
	}
}

func (b *KafkaEventBus) getProducer() (sarama.SyncProducer, error) {
	b.mu.RLock()
	prod := b.producer
	b.mu.RUnlock()
	if prod != nil {
		return prod, nil
	}

	b.mu.Lock()
	defer b.mu.Unlock()
	if b.producer != nil {
		return b.producer, nil
	}

	config := sarama.NewConfig()
	config.Producer.Return.Successes = true
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 3

	newProd, err := sarama.NewSyncProducer(b.brokers, config)
	if err != nil {
		return nil, fmt.Errorf("kafka producer unavailable on brokers %v: %w", b.brokers, domain.ErrServiceUnavailable)
	}
	b.producer = newProd
	return b.producer, nil
}

func (b *KafkaEventBus) writeToDLQ(envelope events.Envelope, originalErr error) {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.dlqStats.FailedSends++

	data, err := json.Marshal(map[string]interface{}{
		"envelope":     envelope,
		"original_err": originalErr.Error(),
		"failed_at":    time.Now().Format(time.RFC3339),
	})
	if err != nil {
		b.dlqStats.DLQDiscards++
		log.Printf("ERROR [KafkaEventBus DLQ]: failed to marshal DLQ entry: %v", err)
		return
	}

	f, err := os.OpenFile(b.dlqPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		b.dlqStats.DLQDiscards++
		log.Printf("ERROR [KafkaEventBus DLQ]: failed to open DLQ file %s: %v", b.dlqPath, err)
		return
	}
	defer f.Close()

	if _, err := f.Write(append(data, '\n')); err != nil {
		b.dlqStats.DLQDiscards++
		log.Printf("ERROR [KafkaEventBus DLQ]: failed to write to DLQ file: %v", err)
		return
	}
	b.dlqStats.DLQWrites++
	log.Printf("WARN [KafkaEventBus DLQ]: wrote failed event %s to DLQ %s (original error: %v)", envelope.EventID, b.dlqPath, originalErr)
}

func (b *KafkaEventBus) sendKafkaMessage(ctx context.Context, topic, tenantID string, envelope events.Envelope) error {
	prod, err := b.getProducer()
	if err != nil {
		b.writeToDLQ(envelope, err)
		return err
	}

	data, err := json.Marshal(envelope)
	if err != nil {
		return fmt.Errorf("failed to marshal event envelope: %w", err)
	}

	msg := &sarama.ProducerMessage{
		Topic: topic,
		Key:   sarama.StringEncoder(tenantID),
		Value: sarama.ByteEncoder(data),
	}

	partition, offset, err := prod.SendMessage(msg)
	if err != nil {
		log.Printf("ERROR [KafkaEventBus]: send failed on topic %s (tenant %s): %v", topic, tenantID, err)
		b.writeToDLQ(envelope, err)
		return fmt.Errorf("kafka send failed on topic %s: %w", topic, domain.ErrUpstreamError)
	}

	b.mu.Lock()
	b.sentCount++
	b.mu.Unlock()

	log.Printf("DEBUG [KafkaEventBus]: sent event %s to topic %s [partition=%d offset=%d]", envelope.EventID, topic, partition, offset)
	return nil
}

func (b *KafkaEventBus) GetDLQStats() DLQStats {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.dlqStats
}

func (b *KafkaEventBus) PublishSignalDetected(ctx context.Context, event *domain.MonitorSignalDetectedEvent) error {
	if event == nil {
		return fmt.Errorf("cannot publish nil event")
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal signal detected event: %w", err)
	}

	envelope := events.Envelope{
		EventID:       event.EventID,
		EventType:     domain.EventTypeMonitorSignalDetected,
		Source:        fmt.Sprintf("agents.monitor.%s", event.AgentID),
		TenantID:      event.TenantID,
		CorrelationID: event.EventID,
		OccurredAt:    event.OccurredAt,
		Payload:       payload,
		Metadata: map[string]string{
			"platform": event.Platform.String(),
			"agent_id": event.AgentID,
		},
	}

	topic := b.topicPrefix + domain.EventTypeMonitorSignalDetected
	return b.sendKafkaMessage(ctx, topic, event.TenantID, envelope)
}

func (b *KafkaEventBus) PublishTrendingTopic(ctx context.Context, event *domain.TrendingTopicFoundEvent) error {
	if event == nil {
		return fmt.Errorf("cannot publish nil event")
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal trending topic event: %w", err)
	}

	envelope := events.Envelope{
		EventID:       event.EventID,
		EventType:     domain.EventTypeTrendingTopicFound,
		Source:        fmt.Sprintf("agents.monitor.%s", event.AgentID),
		TenantID:      event.TenantID,
		CorrelationID: event.EventID,
		OccurredAt:    event.OccurredAt,
		Payload:       payload,
		Metadata: map[string]string{
			"platform": event.Platform.String(),
			"agent_id": event.AgentID,
		},
	}

	topic := b.topicPrefix + domain.EventTypeTrendingTopicFound
	return b.sendKafkaMessage(ctx, topic, event.TenantID, envelope)
}

func (b *KafkaEventBus) PublishDetectionResult(ctx context.Context, event *domain.DetectionResultReadyEvent) error {
	if event == nil {
		return fmt.Errorf("cannot publish nil event")
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal detection result event: %w", err)
	}

	envelope := events.Envelope{
		EventID:       event.EventID,
		EventType:     domain.EventTypeDetectionResultReady,
		Source:        fmt.Sprintf("agents.detector.%s", event.AgentID),
		TenantID:      event.TenantID,
		CorrelationID: event.EventID,
		OccurredAt:    event.OccurredAt,
		Payload:       payload,
		Metadata: map[string]string{
			"signal_id":      event.SignalID,
			"agent_id":       event.AgentID,
			"classification": event.Result.Classification,
		},
	}

	topic := b.topicPrefix + domain.EventTypeDetectionResultReady
	return b.sendKafkaMessage(ctx, topic, event.TenantID, envelope)
}

func (b *KafkaEventBus) PublishVerificationCompleted(ctx context.Context, event *domain.VerificationCompletedEvent) error {
	if event == nil {
		return fmt.Errorf("cannot publish nil event")
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal verification completed event: %w", err)
	}

	envelope := events.Envelope{
		EventID:       event.EventID,
		EventType:     domain.EventTypeVerificationCompleted,
		Source:        fmt.Sprintf("agents.verification.%s", event.AgentID),
		TenantID:      event.TenantID,
		CorrelationID: event.EventID,
		OccurredAt:    event.OccurredAt,
		Payload:       payload,
		Metadata: map[string]string{
			"signal_id":    event.SignalID,
			"detection_id": event.Verification.DetectionID,
			"agent_id":     event.AgentID,
			"status":       string(event.Verification.Status),
		},
	}

	topic := b.topicPrefix + domain.EventTypeVerificationCompleted
	return b.sendKafkaMessage(ctx, topic, event.TenantID, envelope)
}

func (b *KafkaEventBus) PublishComplianceClearance(ctx context.Context, event *domain.ComplianceClearanceEvent) error {
	if event == nil {
		return fmt.Errorf("cannot publish nil event")
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal compliance clearance event: %w", err)
	}

	envelope := events.Envelope{
		EventID:       event.EventID,
		EventType:     domain.EventTypeComplianceClearance,
		Source:        "agents.pipeline.AGT-028",
		TenantID:      event.TenantID,
		CorrelationID: event.EventID,
		OccurredAt:    event.OccurredAt,
		Payload:       payload,
		Metadata: map[string]string{
			"content_id": event.ContentID,
			"is_cleared": fmt.Sprintf("%v", event.IsCleared),
		},
	}

	topic := b.topicPrefix + domain.EventTypeComplianceClearance
	return b.sendKafkaMessage(ctx, topic, event.TenantID, envelope)
}

func (b *KafkaEventBus) PublishPipelineExecution(ctx context.Context, event *domain.PipelineExecutionEvent) error {
	if event == nil {
		return fmt.Errorf("cannot publish nil event")
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal pipeline execution event: %w", err)
	}

	envelope := events.Envelope{
		EventID:       event.EventID,
		EventType:     domain.EventTypePipelineExecutionCompleted,
		Source:        fmt.Sprintf("agents.pipeline.%s", event.AgentID),
		TenantID:      event.TenantID,
		CorrelationID: event.EventID,
		OccurredAt:    event.OccurredAt,
		Payload:       payload,
		Metadata: map[string]string{
			"execution_id": event.ExecutionID,
			"agent_id":     event.AgentID,
			"stage":        string(event.Stage),
		},
	}

	topic := b.topicPrefix + domain.EventTypePipelineExecutionCompleted
	return b.sendKafkaMessage(ctx, topic, event.TenantID, envelope)
}

func (b *KafkaEventBus) PublishPredictionIntelligence(ctx context.Context, event *domain.PredictiveIntelligenceEvent) error {
	if event == nil {
		return fmt.Errorf("cannot publish nil event")
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal predictive intelligence event: %w", err)
	}

	envelope := events.Envelope{
		EventID:       event.EventID,
		EventType:     domain.EventTypePredictiveIntelligenceGenerated,
		Source:        fmt.Sprintf("agents.predictive.%s", event.EngineID),
		TenantID:      event.TenantID,
		CorrelationID: event.EventID,
		OccurredAt:    event.OccurredAt,
		Payload:       payload,
		Metadata: map[string]string{
			"engine_id":       event.EngineID,
			"prediction_type": event.PredictionType,
		},
	}

	topic := b.topicPrefix + domain.EventTypePredictiveIntelligenceGenerated
	return b.sendKafkaMessage(ctx, topic, event.TenantID, envelope)
}

func (b *KafkaEventBus) PublishBehavioralSignal(ctx context.Context, tenantID string, event *domain.BehavioralSignalRecordedEvent) error {
	if event == nil {
		return fmt.Errorf("cannot publish nil event")
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal behavioral signal event: %w", err)
	}

	envelope := events.Envelope{
		EventID:       event.EventID,
		EventType:     domain.EventTypeBehavioralSignalRecorded,
		Source:        "agents.personalization.PERS-003",
		TenantID:      tenantID,
		CorrelationID: event.EventID,
		OccurredAt:    event.OccurredAt,
		Payload:       payload,
		Metadata: map[string]string{
			"reader_id":        event.ReaderID,
			"interaction_type": event.Signal.InteractionType,
		},
	}

	topic := b.topicPrefix + domain.EventTypeBehavioralSignalRecorded
	return b.sendKafkaMessage(ctx, topic, tenantID, envelope)
}

func (b *KafkaEventBus) PublishPersonalizedFeed(ctx context.Context, tenantID string, event *domain.PersonalizedFeedGeneratedEvent) error {
	if event == nil {
		return fmt.Errorf("cannot publish nil event")
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal personalized feed event: %w", err)
	}

	envelope := events.Envelope{
		EventID:       event.EventID,
		EventType:     domain.EventTypePersonalizedFeedGenerated,
		Source:        "agents.personalization.PERS-001",
		TenantID:      tenantID,
		CorrelationID: event.EventID,
		OccurredAt:    event.OccurredAt,
		Payload:       payload,
		Metadata: map[string]string{
			"reader_id": event.ReaderID,
			"feed_id":   event.Feed.FeedID,
		},
	}

	topic := b.topicPrefix + domain.EventTypePersonalizedFeedGenerated
	return b.sendKafkaMessage(ctx, topic, tenantID, envelope)
}

func (b *KafkaEventBus) PublishPreferenceUpdate(ctx context.Context, tenantID string, event *domain.PreferenceModelUpdatedEvent) error {
	if event == nil {
		return fmt.Errorf("cannot publish nil event")
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal preference update event: %w", err)
	}

	envelope := events.Envelope{
		EventID:       event.EventID,
		EventType:     domain.EventTypePreferenceModelUpdated,
		Source:        "agents.personalization.PERS-004",
		TenantID:      tenantID,
		CorrelationID: event.EventID,
		OccurredAt:    event.OccurredAt,
		Payload:       payload,
		Metadata: map[string]string{
			"reader_id": event.ReaderID,
		},
	}

	topic := b.topicPrefix + domain.EventTypePreferenceModelUpdated
	return b.sendKafkaMessage(ctx, topic, tenantID, envelope)
}

func (b *KafkaEventBus) GetPublishedCount() int {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.sentCount
}
