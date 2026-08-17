# IMP-020 EXISTING MULTIMODAL AUDIT (REPOSITORY TRUTH DISCOVERY)

**Implementation Unit:** `IMP-020` — Multimodal Intelligence (Image, Video, Audio, Cross-Media)  
**Authorized Scope:** `IMP-020 Repository Truth Audit Only (Read-Only Discovery)`  
**Execution Date:** 2026-08-09 (Africa/Accra)  
**Status:** `IMP-020 AUDIT: COMPLETE (AWAITING IMPLEMENTATION AUTHORIZATION)`  

---

## Executive Summary

In strict accordance with the **IMP-020 Repository Truth Audit Directive**, a comprehensive repository-wide audit was executed to map all existing multimodal, image, video, audio, and cross-media implementations before designing any IMP-020 architecture.

Per strict instructions:
- **This was an entirely read-only audit. Zero code files or services were created or modified.**
- **All existing baselines (`IMP-017` 32-agent fleet, `IMP-018` predictive intelligence engine, `IMP-019` advanced personalization, and Phase 1 `phase-1.0.0`) remain 100% immutable and untouched.**
- The audit demonstrates that foundational multimedia classification (`AGT-013`), script/spec generation (`Content Factory`), and media type definitions already exist in the repository, but actual binary processing, OCR engines, frame extraction, speaker diarization, and multimodal vision API integrations (`GPT-4V`, `OpenAI Vision`, `Whisper`) are currently absent or stubbed as metadata descriptions.

---

## Detailed 16-Point Multimodal Repository Audit Report

### 1. Existing Multimodal Files Discovered (Exact Paths)
- **`services/agents/internal/detectors/multimedia_classifier.go`:** Authoritative implementation of `AGT-013` (Multimedia Classifier Content Detector).
- **`services/agents/internal/detectors/multimedia_classifier_test.go`:** Unit test suite for `AGT-013`.
- **`services/agents/internal/pipeline/factory_intake_router.go`:** Authoritative implementation of `AGT-027` (Factory Intake Router), which determines package types (`VIDEO_SCRIPT`, `AUDIO_TRANSCRIPT`, `INFOGRAPHIC_SPEC`, `MULTI_CHANNEL`) and validates required media assets.
- **`services/content-factory/internal/domain/models.go`:** Defines `MultimediaAsset` (`AssetType`: `AUDIO_SCRIPT`, `VIDEO_SCRIPT`, `INFOGRAPHIC_SPEC`), `ArticleAsset`, and `ContentPackage`.
- **`services/content-factory/internal/application/editorial_generation_service.go`:** Implements `GenerateMultimediaAsset(...)`, which generates script specifications via `AIGatewayService` / `llm.Provider`.
- **`services/content-factory/internal/application/editorial_generation_service_test.go`:** Test suite verifying `AUDIO_SCRIPT` generation.
- **`services/content-factory/migrations/20260808200000_content_factory_schema.up.sql`:** DDL migration creating `content_factory_media` table with Row-Level Security (`USING (tenant_id = current_setting('app.current_tenant')::UUID)`).
- **`services/agents/api/protobuf/detectors/v1/detector.proto`:** Defines `MediaType` enum (`MEDIA_TYPE_TEXT`, `IMAGE`, `VIDEO`, `AUDIO`, `MIXED`) and `DETECTOR_TYPE_MULTIMEDIA`.
- **`services/agents/api/protobuf/pipeline/v1/pipeline.proto`:** Defines `PackageType` enum (`PACKAGE_TYPE_VIDEO_SCRIPT`, `PACKAGE_TYPE_AUDIO_TRANSCRIPT`, `PACKAGE_TYPE_INFOGRAPHIC_SPEC`).
- **`libs/go/pkg/llm/provider.go`:** Core LLM provider contract (`CompletionRequest`, `CompletionResponse`, `Message`), currently supporting text-only string prompts without multimodal image/binary attachments.

### 2. Existing Multimodal Types Discovered
- **`detector.proto` (`MediaType` Enum):** `MEDIA_TYPE_UNSPECIFIED = 0`, `MEDIA_TYPE_TEXT = 1`, `MEDIA_TYPE_IMAGE = 2`, `MEDIA_TYPE_VIDEO = 3`, `MEDIA_TYPE_AUDIO = 4`, `MEDIA_TYPE_MIXED = 5`.
- **`pipeline.proto` (`PackageType` Enum):** `PACKAGE_TYPE_VIDEO_SCRIPT = 3`, `PACKAGE_TYPE_AUDIO_TRANSCRIPT = 4`, `PACKAGE_TYPE_INFOGRAPHIC_SPEC = 5`, `PACKAGE_TYPE_MULTI_CHANNEL = 6`.
- **`content-factory/domain.MultimediaAsset`:** Struct containing `AssetID string`, `TenantID string`, `PackageID string`, `AssetType string` (`AUDIO_SCRIPT`, `VIDEO_SCRIPT`, `INFOGRAPHIC_SPEC`), and `ContentSpec string`.
- **`agents/platforms.ContentType`:** Identifies platform-supported content types (`IMAGE`, `VIDEO`, `TEXT`).

### 3. Existing Multimodal Engines / Agents Discovered
- **`AGT-013` (`MultimediaClassifier`):** Identifies media types from signal content and URL suffixes (`.jpg`, `.png`, `.mp4`, `instagram.com/p/`), extracting format (`image/jpeg`, `video/mp4`), estimated dimensions/duration, and file size.
- **`AGT-027` (`FactoryIntakeRouter`):** Determines production packaging requirements and validates required media assets (`scene_descriptions`, `dialogue`, `timing`, `full_transcript`, `speaker_labels`, `timestamps`, `featured_image`).
- **`EditorialGenerationService` (Content Factory):** Generates script specifications (`AUDIO_SCRIPT`, `VIDEO_SCRIPT`, `INFOGRAPHIC_SPEC`) from textual prompts.

### 4. Existing Multimodal API Contracts Discovered
- **`detector.proto` (`ContentDetectorService`):** Supports classifying monitor signals with media type enumerations and returning `DetectionResult` with metadata maps.
- **`pipeline.proto` (`PipelineService`):** Supports routing content packages with media asset specifications.
- **`llm.Provider` (`libs/go/pkg/llm/provider.go`):** Accepts `CompletionRequest` containing `[]Message{Role, Content string}`; does **not** currently define structured multimodal image/audio/video attachment fields.

### 5. Existing Multimodal Database Schemas Discovered
- **`content_factory_media` (`services/content-factory/migrations/20260808200000_content_factory_schema.up.sql`):**
  - Columns: `id UUID PRIMARY KEY`, `asset_id VARCHAR(100) UNIQUE NOT NULL`, `tenant_id UUID NOT NULL`, `package_id VARCHAR(100)`, `asset_type VARCHAR(50) NOT NULL` (`AUDIO_SCRIPT`, `VIDEO_SCRIPT`, `INFOGRAPHIC_SPEC`), `content_spec TEXT NOT NULL`, `created_at TIMESTAMPTZ`.
  - Enforces explicit multi-tenant Row-Level Security via `USING (tenant_id = current_setting('app.current_tenant')::UUID)`.
- **`detection_results` (`services/agents/migrations/20260809000001_detector_schema.up.sql`):**
  - Stores media classification findings in JSONB `metadata` and `evidence` columns.

### 6. What AGT-013 Already Handles
- **Media Type Classification:** Accurately classifies signals as `TEXT`, `IMAGE`, `VIDEO`, `AUDIO`, or `MIXED` based on URL patterns (`.jpg`, `.png`, `.mp4`, `.mp3`) and text content.
- **Metadata Extraction:** Estimates and populates `dimensions`, `duration`, `format` (MIME type), and `file_size` without downloading or storing binary files.
- **Simulated / Delegated Media Descriptions:**
  - For `IMAGE`: populates `res.Metadata["ai_description"] = "Alt-text: High-resolution news graphic..."`, `res.Metadata["detected_objects"] = "Person, News Studio, Graph"`, and `res.Metadata["embedded_text_ocr"] = signal.Content`.
  - For `VIDEO`: populates `res.Metadata["ai_description"] = "Scene description: Broadcast segment showing speaker on podium."` and `res.Metadata["key_frames"] = "frame_0.jpg, frame_60.jpg, frame_120.jpg"`.
  - For `AUDIO`: populates `res.Metadata["ai_description"] = "Audio transcription summary..."`.
  - When `aiGateway != nil`, delegates signal text to `AIGatewayService.SummarizeSignal(...)`.

### 7. What AIGatewayService Already Supports
- **Current Support:** Routes text-based completion requests (`llm.CompletionRequest`) across registered providers (`openai`, `anthropic`, etc.) with fallback routing and token quota accounting.
- **Configured Models:** Currently configured for text models (`gpt-4`, `claude-3`, `nexus-detector-v1`, `nexus-summarizer-v1`, etc.).
- **Missing Vision/Multimodal Support:** `AIGatewayService` does not currently define multimodal attachment payloads in `llm.CompletionRequest` or integrate third-party vision/audio endpoints (`OpenAI Vision`, `GPT-4V`, `Whisper`, `Claude Vision`).

### 8. What Content Factory Already Generates
- **Script & Specification Generation:** Generates text-based specifications for `AUDIO_SCRIPT`, `VIDEO_SCRIPT`, and `INFOGRAPHIC_SPEC` via `GenerateMultimediaAsset(...)`.
- **Media Asset Persistence:** Persists generated scripts and specifications in the RLS-protected `content_factory_media` PostgreSQL table.
- **Missing Binary Processing:** Does not generate actual binary audio, video files, or rendered graphic images.

### 9. Four-Domain Compliance Matrix
| IMP-020 Domain | Existing Repository Implementation Target | Assessment Status | Detailed Compliance Summary |
| :--- | :--- | :---: | :--- |
| **1. Image Analysis** | `AGT-013` (`multimedia_classifier.go`), `content_factory_media` | **`EXISTS BUT INCOMPLETE`** | **Satisfies:** image type classification (`MEDIA_TYPE_IMAGE`), MIME type/dimension metadata extraction, and alt-text/OCR metadata placeholders.<br>**Incomplete / Missing:** actual binary OCR text extraction, bounding box object detection, visual sentiment scoring, and third-party vision API routing (`GPT-4V` / `Claude Vision`). |
| **2. Video Analysis** | `AGT-013`, `FactoryIntakeRouter` (`VIDEO_SCRIPT`) | **`EXISTS BUT INCOMPLETE`** | **Satisfies:** video type classification (`MEDIA_TYPE_VIDEO`), key frame and scene description metadata placeholders, and video script specification generation in Content Factory.<br>**Incomplete / Missing:** actual video frame decoding, action recognition, scene change detection, and temporal key-frame indexing. |
| **3. Audio Transcription** | `AGT-013`, `FactoryIntakeRouter` (`AUDIO_TRANSCRIPT`) | **`EXISTS BUT INCOMPLETE`** | **Satisfies:** audio classification (`MEDIA_TYPE_AUDIO`), audio transcription summary placeholders, and audio script specification generation in Content Factory.<br>**Incomplete / Missing:** actual speech-to-text transcription (`Whisper`), speaker diarization (speaker timestamps/labels), and audio vocal sentiment analysis. |
| **4. Cross-Media Correlation** | `StoryGraphUpdater` (`AGT-026`), `MultimediaClassifier` (`MIXED`) | **`EXISTS BUT INCOMPLETE`** | **Satisfies:** mixed media classification (`MEDIA_TYPE_MIXED`), linking multiple media assets to a single story package (`content_factory_packages`), and entity/event story graph linking.<br>**Incomplete / Missing:** explicit cross-media consistency verification (correlating OCR text in images with audio transcript claims) and multimodal evidence corroboration. |

### 10. Missing Capabilities
- Binary image/audio/video attachment payload support in `llm.CompletionRequest` (`libs/go/pkg/llm/`).
- Authoritative multimodal API client connectors for `OpenAI Vision`, `GPT-4V`, `Whisper`, and `Claude Vision` in `services/runtime/`.
- Runtime OCR text extraction, bounding-box object detection, speaker diarization, and temporal frame indexing algorithms.
- Multimodal cross-media consistency checking (verifying whether visual OCR/graphics match spoken audio transcripts and written captions).

### 11. Incomplete Capabilities
- `AGT-013` currently relies on URL string suffixes and text heuristics for media classification; needs optional delegation to multimodal vision/audio APIs when binary media references are present.
- `AIGatewayService` needs an additive `InvokeMultimodalModel(ctx, req)` method or additive attachment fields on `llm.CompletionRequest` to support multimodal inference.
- `content_factory_media` currently stores script text in `content_spec`; needs optional additive metadata columns or JSONB attributes for binary media asset URIs and diarization transcripts.

### 12. Conflicting Contracts, If Any
- **Zero conflicting contracts discovered.** No parallel multimodal service or competing `MediaType` / `MultimediaAsset` definitions exist.
- Existing contracts in `detector.proto`, `pipeline.proto`, and `content-factory` are clean and authoritative.

### 13. Tenant / RLS Assessment for Media Data
- **Status:** **`EXISTS AND SATISFIES`**
- All existing media tables (`content_factory_media`) enforce strict multi-tenant Row-Level Security (`USING (tenant_id = current_setting('app.current_tenant')::UUID)`).
- Every media record is strictly scoped by `tenant_id`, ensuring media specifications or transcripts belonging to one tenant can never be read or modified by another tenant.

### 14. Recommended Architecture (Option C — Existing Implementation Gap Audit)
- **Adopt Option C (Existing Implementation Gap Audit & Core Designation):** Formally designate `AGT-013` (`MultimediaClassifier`), `AIGatewayService`, and `services/content-factory` (`content_factory_media`) as the **authoritative base architecture for IMP-020**.
- **Do NOT create a parallel `services/multimodal/` microservice**, which would duplicate `AGT-013` and `content_factory_media`.
- Under future implementation authorization, implement additive enhancements:
  1. Add optional multimodal attachment support to `libs/go/pkg/llm/CompletionRequest` and `AIGatewayService`.
  2. Enhance `AGT-013` to invoke multimodal vision/audio models via `AIGatewayService` when detailed OCR, scene detection, or transcription is requested.
  3. Extend Content Factory to link transcribed audio and analyzed images with story packages.

### 15. Exact Files That Would Require Modification / Creation (For Future Implementation Authorization)
- **Zero code files modified or created in this Gap Audit.**
- Under separate future authorization, the following files should receive additive modifications:
  1. `libs/go/pkg/llm/provider.go` (Add optional `MediaAttachment` struct and field to `CompletionRequest`).
  2. `services/runtime/internal/application/aigateway_service.go` (Add multimodal routing support for vision/audio models).
  3. `services/agents/internal/detectors/multimedia_classifier.go` (Enhance `AGT-013` to invoke multimodal LLM endpoints for OCR, object detection, and diarized transcripts).
  4. `services/agents/internal/detectors/multimedia_classifier_test.go` (Add test coverage for multimodal AI Gateway routing).

### 16. Estimated Batch Count Based on What Already Exists
- Because foundational classification (`AGT-013`), packaging (`AGT-027`), script generation (`Content Factory`), and RLS database schemas already exist:
- **Estimated Implementation Effort:** **2 to 3 Batches Total**
  - **Batch 1:** AI Gateway Multimodal Contract Extension (`libs/go/pkg/llm` + `services/runtime`).
  - **Batch 2:** `AGT-013` Multimodal Enhancement (OCR, object detection, speaker diarization via AI Gateway).
  - **Batch 3:** Cross-Media Consistency Corroboration & Verification Integration.

---

## 5. IMP-020 GAP AUDIT COMPLETION STATEMENT

```
IMP-020 STATUS: REPOSITORY TRUTH AUDIT COMPLETE (AWAITING IMPLEMENTATION AUTHORIZATION)
DECISION PATH: OPTION C — EXISTING IMPLEMENTATION GAP AUDIT & CORE DESIGNATION
FILES CREATED OR MODIFIED: 0 (Strict compliance with "DO NOT WRITE IMPLEMENTATION FILES")
WORKSPACE SIZE: 19 MB non-Git / 26 MB total (GREEN Tier)
```

**Next Step Directive:**  
The **IMP-020 Existing Multimodal Implementation Audit** is complete and delivered.  
We have stopped at this boundary and await formal authorization to begin implementation of the identified additive multimodal enhancements.
