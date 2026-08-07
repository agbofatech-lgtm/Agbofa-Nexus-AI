#!/usr/bin/env python3
"""Documentation build pipeline checks for source preservation and extracted artifacts."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source"
EXTRACTED = ROOT / "extracted"
REPORT_DIR = ROOT / "governance" / "reports"
CHECKSUM_DIR = SOURCE / "checksums"

SOURCE_DIRS = [
    SOURCE / "original-pdfs",
    SOURCE / "original-docx",
    SOURCE / "original-images",
    SOURCE / "original-diagrams",
]
EXTRACTED_DIRS = [
    EXTRACTED / "ocr-json",
    EXTRACTED / "markdown",
    EXTRACTED / "text",
    EXTRACTED / "images",
]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def list_files(paths: list[Path]) -> list[Path]:
    files: list[Path] = []
    for base in paths:
        if base.exists():
            files.extend(p for p in base.rglob("*") if p.is_file() and p.name != ".gitkeep")
    return sorted(files)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--strict", action="store_true", help="fail when no source documents are available")
    args = parser.parse_args()

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    CHECKSUM_DIR.mkdir(parents=True, exist_ok=True)

    errors: list[str] = []
    for directory in SOURCE_DIRS + EXTRACTED_DIRS:
        if not directory.exists():
            errors.append(f"Missing required directory: {directory.relative_to(ROOT)}")

    source_files = list_files(SOURCE_DIRS)
    extracted_files = list_files(EXTRACTED_DIRS)
    if args.strict and not source_files:
        errors.append("Strict mode requires approved source documents under source/.")

    checksums = []
    for path in source_files:
        digest = sha256(path)
        checksums.append({"path": str(path.relative_to(ROOT)), "sha256": digest})
    checksum_path = CHECKSUM_DIR / "source-checksums.sha256"
    checksum_path.write_text("".join(f"{item['sha256']}  {item['path']}\n" for item in checksums), encoding="utf-8")

    report = {
        "source_files": len(source_files),
        "extracted_files": len(extracted_files),
        "checksums_recorded": len(checksums),
        "errors": errors,
        "source_paths": [str(p.relative_to(ROOT)) for p in source_files],
        "extracted_paths": [str(p.relative_to(ROOT)) for p in extracted_files],
    }
    (REPORT_DIR / "documentation-pipeline-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    lines = ["# Documentation Pipeline Report", "", f"Source files: {len(source_files)}", f"Extracted files: {len(extracted_files)}", f"Checksums recorded: {len(checksums)}", ""]
    if errors:
        lines.extend(["## Errors", ""] + [f"- {e}" for e in errors] + [""])
    else:
        lines.append("Source preservation directory validation passed.")
        lines.append("")
    (REPORT_DIR / "documentation-pipeline-report.md").write_text("\n".join(lines), encoding="utf-8")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("Documentation pipeline validation passed.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
