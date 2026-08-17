package detectors

import (
	"context"
	"errors"
	"testing"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

func TestMultimediaClassifier_InterfaceAndMediaTypes(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewMultimediaClassifier(ai, bus)

	if detector.ID() != "AGT-013" {
		t.Errorf("expected ID AGT-013, got %s", detector.ID())
	}
	if detector.Name() != "Multimedia Classifier" {
		t.Errorf("expected Name Multimedia Classifier, got %s", detector.Name())
	}
	if detector.Version() != "1.0.0" {
		t.Errorf("expected Version 1.0.0, got %s", detector.Version())
	}

	// 1. Cross-tenant Initialize check
	err := detector.Initialize(ctx, "", nil)
	if !errors.Is(err, domain.ErrCrossTenantViolation) {
		t.Fatalf("expected ErrCrossTenantViolation on empty tenantID, got %v", err)
	}

	// 2. Valid Initialize
	err = detector.Initialize(ctx, "tenant-media-1", map[string]string{"env": "test"})
	if err != nil {
		t.Fatalf("unexpected error initializing MultimediaClassifier: %v", err)
	}

	// 3. HealthCheck
	health, err := detector.HealthCheck(ctx)
	if err != nil || health.Status != "ONLINE" {
		t.Fatalf("expected ONLINE health status, got %v (err=%v)", health, err)
	}

	// 4. Detect VIDEO
	sigVid := &domain.MonitorSignal{
		SignalID: "sig-vid-1",
		TenantID: "tenant-media-1",
		URL:      "https://youtube.com/watch?v=1001",
		Content:  "", // Video without text
	}
	resVid, err := detector.Detect(ctx, sigVid)
	if err != nil || resVid.Metadata["media_type"] != "VIDEO" {
		t.Fatalf("expected VIDEO media_type, got %v (err=%v)", resVid.Metadata["media_type"], err)
	}

	// 5. Detect IMAGE
	sigImg := &domain.MonitorSignal{
		SignalID: "sig-img-1",
		TenantID: "tenant-media-1",
		URL:      "https://example.com/photo.jpg",
		Content:  "",
	}
	resImg, _ := detector.Detect(ctx, sigImg)
	if resImg.Metadata["media_type"] != "IMAGE" {
		t.Errorf("expected IMAGE media_type, got %s", resImg.Metadata["media_type"])
	}

	// 6. Detect AUDIO
	sigAud := &domain.MonitorSignal{
		SignalID: "sig-aud-1",
		TenantID: "tenant-media-1",
		URL:      "https://example.com/podcast.mp3",
		Content:  "",
	}
	resAud, _ := detector.Detect(ctx, sigAud)
	if resAud.Metadata["media_type"] != "AUDIO" {
		t.Errorf("expected AUDIO media_type, got %s", resAud.Metadata["media_type"])
	}

	// 7. Detect MIXED
	sigMix := &domain.MonitorSignal{
		SignalID: "sig-mix-1",
		TenantID: "tenant-media-1",
		URL:      "https://youtube.com/watch?v=1002",
		Content:  "Detailed breaking news analysis accompanying video report",
	}
	resMix, _ := detector.Detect(ctx, sigMix)
	if resMix.Metadata["media_type"] != "MIXED" {
		t.Errorf("expected MIXED media_type, got %s", resMix.Metadata["media_type"])
	}

	// 8. Detect TEXT
	sigTxt := &domain.MonitorSignal{
		SignalID: "sig-txt-1",
		TenantID: "tenant-media-1",
		URL:      "https://example.com/article",
		Content:  "Pure text article without multimedia attachments",
	}
	resTxt, _ := detector.Detect(ctx, sigTxt)
	if resTxt.Metadata["media_type"] != "TEXT" {
		t.Errorf("expected TEXT media_type, got %s", resTxt.Metadata["media_type"])
	}
}

func TestMultimediaClassifier_AnalyzeAndClassify(t *testing.T) {
	ctx := context.Background()
	ai := &mockAIGateway{}
	bus := &mockEventBus{}

	detector := NewMultimediaClassifier(ai, bus)
	_ = detector.Initialize(ctx, "tenant-media-1", nil)

	sig := &domain.MonitorSignal{
		SignalID: "sig-media-analyse-1",
		TenantID: "tenant-media-1",
		URL:      "https://example.com/breaking.jpg",
		Content:  "Photo of ongoing rescue operations",
	}

	// 1. Analyze routes through AIGatewayService and extracts description
	res, err := detector.Analyze(ctx, sig)
	if err != nil || res == nil {
		t.Fatalf("unexpected error on Analyze: %v", err)
	}
	if res.Metadata["ai_description"] != "AI Summarized Breaking Event" {
		t.Errorf("expected AI description from gateway, got %s", res.Metadata["ai_description"])
	}
	if res.Metadata["dimensions"] == "" || res.Metadata["format"] == "" {
		t.Errorf("expected dimensions/format metadata, got %v", res.Metadata)
	}

	// 2. Classify returns media type, confidence, and evidence items
	mediaType, conf, evidence, err := detector.Classify(ctx, sig)
	if err != nil || len(evidence) == 0 {
		t.Fatalf("unexpected error on Classify: %v", err)
	}
	if mediaType != "MIXED" {
		t.Errorf("expected MIXED classification for text+image, got %s", mediaType)
	}
	if conf <= 0 || conf > 1.0 {
		t.Errorf("confidence score out of bounds: %f", conf)
	}
}

type mockMultimodalGateway struct {
	lastAttachments []MultimodalAttachment
	fail            bool
}

func (m *mockMultimodalGateway) SummarizeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (string, float64, error) {
	return "Fallback AI Summary", 0.90, nil
}
func (m *mockMultimodalGateway) ScoreTrendingTopic(ctx context.Context, tenantID, agentID string, topic *domain.TrendingTopic) (float64, error) {
	return 0.8, nil
}
func (m *mockMultimodalGateway) AnalyzeSignal(ctx context.Context, tenantID, agentID string, signal *domain.MonitorSignal) (*domain.DetectionResult, error) {
	return &domain.DetectionResult{}, nil
}
func (m *mockMultimodalGateway) VerifyDetection(ctx context.Context, tenantID, agentID string, detection *domain.DetectionResult) (*domain.VerificationResult, error) {
	return &domain.VerificationResult{}, nil
}
func (m *mockMultimodalGateway) PredictVirality(ctx context.Context, tenantID, storyID string, metadata map[string]string) (*domain.ViralityPrediction, error) {
	return &domain.ViralityPrediction{}, nil
}
func (m *mockMultimodalGateway) OptimizeEngagement(ctx context.Context, tenantID, contentID string, metadata map[string]string) (*domain.EngagementOptimization, error) {
	return &domain.EngagementOptimization{}, nil
}
func (m *mockMultimodalGateway) ModelTrendLifecycle(ctx context.Context, tenantID, topicID string, metadata map[string]string) (*domain.TrendLifecycleModel, error) {
	return &domain.TrendLifecycleModel{}, nil
}
func (m *mockMultimodalGateway) ForecastPerformance(ctx context.Context, tenantID, contentID string, metadata map[string]string) (*domain.ContentPerformanceForecast, error) {
	return &domain.ContentPerformanceForecast{}, nil
}
func (m *mockMultimodalGateway) DetectAnomalies(ctx context.Context, tenantID string, platform domain.PlatformSource, metadata map[string]string) (*domain.AnomalyDetectionEvent, error) {
	return &domain.AnomalyDetectionEvent{}, nil
}
func (m *mockMultimodalGateway) InvokeMultimodal(ctx context.Context, tenantID, agentID string, attachments []MultimodalAttachment) (*MultimodalResponse, error) {
	if m.fail {
		return nil, errors.New("simulated multimodal model error")
	}
	m.lastAttachments = attachments
	if len(attachments) == 0 {
		return nil, errors.New("no attachments provided")
	}
	switch attachments[0].Type {
	case "image":
		return &MultimodalResponse{
			OCRText:     "BREAKING: GDP Rises 4%",
			Detections:  `[{"label":"chart","confidence":0.95}]`,
			Description: "News graphic depicting Q2 GDP rise",
		}, nil
	case "video_frame":
		return &MultimodalResponse{
			FrameDetections:  `[{"label":"speaker","confidence":0.92}]`,
			SceneDescription: "Press conference at podium",
			TemporalAnalysis: "Speaker gesture at 00:15",
		}, nil
	case "audio":
		return &MultimodalResponse{
			Transcription:  "The central bank lowered interest rates today.",
			Segments:       `[{"speaker_id":"spk_0","text":"The central bank lowered interest rates today."}]`,
			AudioSentiment: "NEUTRAL_REPORTING",
		}, nil
	}
	return &MultimodalResponse{Description: "Generic multimodal analysis"}, nil
}

func TestMultimediaClassifier_MultimodalAIAnalysis(t *testing.T) {
	ctx := context.Background()
	mmGateway := &mockMultimodalGateway{}
	detector := NewMultimediaClassifier(mmGateway, nil)
	_ = detector.Initialize(ctx, "tenant-XYZ", nil)

	// 1. IMAGE with media_url -> populates OCRText, Detections, Description
	sigImg := &domain.MonitorSignal{
		SignalID: "sig-img-1",
		TenantID: "tenant-XYZ",
		URL:      "https://media.agbofa.ai/chart.jpg",
		Metadata: map[string]string{
			"media_url": "https://media.agbofa.ai/chart.jpg",
		},
	}
	resImg, err := detector.Analyze(ctx, sigImg)
	if err != nil {
		t.Fatalf("unexpected error analyzing image: %v", err)
	}
	if resImg.Metadata["ocr_text"] != "BREAKING: GDP Rises 4%" {
		t.Fatalf("expected OCRText populated from multimodal model, got %s", resImg.Metadata["ocr_text"])
	}
	if resImg.Metadata["detected_objects"] != `[{"label":"chart","confidence":0.95}]` {
		t.Fatalf("expected detected_objects populated, got %s", resImg.Metadata["detected_objects"])
	}
	if resImg.Metadata["ai_description"] != "News graphic depicting Q2 GDP rise" {
		t.Fatalf("expected ai_description populated, got %s", resImg.Metadata["ai_description"])
	}

	// 2. VIDEO with 7 key frames -> enforces max 5 key frames limit
	sigVid := &domain.MonitorSignal{
		SignalID: "sig-vid-1",
		TenantID: "tenant-XYZ",
		URL:      "https://media.agbofa.ai/video.mp4",
		Metadata: map[string]string{
			"key_frames": "f1.jpg,f2.jpg,f3.jpg,f4.jpg,f5.jpg,f6.jpg,f7.jpg",
		},
	}
	resVid, _ := detector.Analyze(ctx, sigVid)
	if len(mmGateway.lastAttachments) != 5 {
		t.Fatalf("expected max 5 key frames passed to multimodal gateway, got %d", len(mmGateway.lastAttachments))
	}
	if resVid.Metadata["scene_description"] != "Press conference at podium" {
		t.Fatalf("expected scene_description populated, got %s", resVid.Metadata["scene_description"])
	}

	// 3. AUDIO with media_url -> populates transcription, speaker_segments, audio_sentiment
	sigAud := &domain.MonitorSignal{
		SignalID: "sig-aud-1",
		TenantID: "tenant-XYZ",
		URL:      "https://media.agbofa.ai/clip.mp3",
		Metadata: map[string]string{
			"media_url": "https://media.agbofa.ai/clip.mp3",
		},
	}
	resAud, _ := detector.Analyze(ctx, sigAud)
	if resAud.Metadata["transcription"] != "The central bank lowered interest rates today." {
		t.Fatalf("expected audio transcription populated, got %s", resAud.Metadata["transcription"])
	}
	if resAud.Metadata["audio_sentiment"] != "NEUTRAL_REPORTING" {
		t.Fatalf("expected audio sentiment populated, got %s", resAud.Metadata["audio_sentiment"])
	}

	// 4. Fallback when multimodal gateway fails -> falls back to SummarizeSignal / description
	mmGateway.fail = true
	resFail, _ := detector.Analyze(ctx, sigImg)
	if resFail.Metadata["ai_description"] != "Fallback AI Summary" {
		t.Fatalf("expected fallback to AI Gateway summary when multimodal fails, got %s", resFail.Metadata["ai_description"])
	}
}
