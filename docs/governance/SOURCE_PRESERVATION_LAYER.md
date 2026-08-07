# Source Preservation Layer

**Project:** Agbofa Nexus AI — Autonomous AI Media Company Platform  
**Company:** Agbofa Technologies  
**Status:** Active governance layer  
**Purpose:** Preserve original approved documentation while making every transformation traceable.

---

## 1. Principle

Original approved source documents must never be modified.

All extraction, OCR, Markdown conversion, indexing, documentation review, and implementation planning must be performed from derived artifacts while preserving links back to the immutable source files.

The original PDFs remain the primary source of truth unless the approved baseline explicitly provides another authoritative format.

---

## 2. Repository Structure

```text
Agbofa-Nexus-AI/
├── source/
│   ├── original-pdfs/
│   ├── original-docx/
│   ├── original-images/
│   ├── original-diagrams/
│   └── checksums/
├── extracted/
│   ├── ocr-json/
│   ├── markdown/
│   ├── text/
│   └── images/
├── docs/
├── services/
├── apps/
├── ai-services/
└── ...
```

---

## 3. Source Handling Rules

1. Never edit files under `source/original-pdfs/`.
2. Never edit files under `source/original-docx/` unless an explicitly approved corrected source is supplied.
3. Never overwrite an original source file with a transformed artifact.
4. Store checksums for every original file under `source/checksums/`.
5. Store OCR/layout extraction output under `extracted/ocr-json/`.
6. Store structured Markdown output under `extracted/markdown/`.
7. Store plain text extraction under `extracted/text/`.
8. Store extracted images and diagrams under `extracted/images/`.
9. Maintain source-to-derived traceability in the Master Documentation Manifest.
10. When derived content conflicts with the original source, the original source wins unless approval says otherwise.

---

## 4. Preferred Ingestion Formats

### 4.1 Primary Source of Truth

```text
Original PDF
```

The original PDF is preserved for verification, auditability, pagination, layout review, and certification.

### 4.2 Best AI Processing Format

```text
OCR JSON with layout preservation
```

OCR JSON is preferred for AI-assisted processing because it can preserve:

- page numbers
- headings
- tables
- image locations
- diagram locations
- coordinates
- reading order
- section boundaries
- cross-reference context

### 4.3 Best Version-Control Format

```text
Structured Markdown
```

Markdown is preferred for:

- Git diffs
- editorial review
- publication structure
- long-term documentation maintenance
- manifest and index generation
- cross-reference normalization

---

## 5. Approved Transformation Pipeline

```text
Original PDF
  ↓
OCR Engine
  ↓
OCR JSON with layout preserved
  ↓
Structured Markdown
  ↓
Indexes and Manifest
  ↓
Architecture Review
  ↓
Implementation Cards
  ↓
Code Generation
  ↓
Testing
  ↓
Documentation Sync
  ↓
Release
```

---

## 6. Traceability Requirements

Each derived artifact must record:

- original source filename
- source checksum
- extraction date
- extraction method/tool if known
- page range
- volume number
- phase/document identifier where applicable
- transformation status
- review status

Traceability must be reflected in:

- `docs/manifest/MASTER_DOCUMENTATION_MANIFEST.md`
- `docs/indexes/TRACEABILITY_MATRIX.md`
- `docs/project-management/CHANGE_LOG.md`
- `docs/project-management/DECISION_LOG.md`

---

## 7. Verification Requirements

Before using extracted text, OCR JSON, or Markdown for implementation planning:

1. Confirm the original source file exists.
2. Confirm checksum is recorded.
3. Confirm extraction artifact references the original source.
4. Confirm volume/page mapping is available where possible.
5. Record extraction quality issues.
6. Record ambiguous or broken extraction in the Architecture Drift Register if it may affect implementation.

---

## 8. Never Guess Enforcement

If OCR output is incomplete, corrupted, ambiguous, or contradicts the source PDF:

```text
STOP.
```

Then:

1. Record the issue.
2. Identify the affected volume/page/section.
3. Explain the ambiguity.
4. Recommend a resolution.
5. Await approval before implementation decisions are made from that content.

---

## 9. Current Certification

As of this governance layer adoption:

- Source preservation directories exist.
- Original source documents have not yet been uploaded.
- No source document has been modified.
- No OCR transformation has been performed.
- No Markdown transformation has been performed.
- No implementation has started.
