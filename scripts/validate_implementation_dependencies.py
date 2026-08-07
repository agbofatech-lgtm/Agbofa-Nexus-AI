#!/usr/bin/env python3
"""Validate implementation cards and implementation sequence dependencies."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_DIR = ROOT / "docs" / "indexes" / "json"
SEQ_PATH = ROOT / "docs" / "implementation" / "json" / "implementation_sequence.json"
CARD_DIR = ROOT / "implementation-cards"
REPORT_DIR = ROOT / "governance" / "reports"

ID_PATTERNS = {
    "service": re.compile(r"\bSVC-\d{3,}\b"),
    "api": re.compile(r"\bAPI-\d{3,}\b"),
    "database": re.compile(r"\bDB-\d{3,}\b"),
    "event": re.compile(r"\bEVT-\d{3,}\b"),
    "decision": re.compile(r"\bADR-\d{3,}\b"),
    "implementation": re.compile(r"\bIMP-\d{3,}\b"),
    "gar": re.compile(r"\bGAR-\d{3,}\b"),
}

REGISTRY_FILES = {
    "service": "services.json",
    "api": "apis.json",
    "database": "databases.json",
    "event": "events.json",
    "decision": "adrs.json",
}


def load_ids(filename: str) -> set[str]:
    path = JSON_DIR / filename
    if not path.exists():
        return set()
    data = json.loads(path.read_text())
    return {str(item.get("id")) for item in data.get("items", []) if item.get("id")}


def load_sequence() -> dict:
    if not SEQ_PATH.exists():
        return {"items": []}
    return json.loads(SEQ_PATH.read_text())


def main() -> int:
    findings: list[dict[str, str]] = []
    registry_ids = {kind: load_ids(filename) for kind, filename in REGISTRY_FILES.items()}
    sequence = load_sequence()
    imp_ids = {item["id"] for item in sequence.get("items", [])}
    open_gars = {"GAR-006", "GAR-007", "GAR-008", "GAR-013", "GAR-014"}

    # Validate implementation sequence dependency references.
    for item in sequence.get("items", []):
        item_id = item.get("id", "")
        for dep in item.get("dependencies", []):
            if dep not in imp_ids:
                findings.append({"severity": "ERROR", "path": str(SEQ_PATH.relative_to(ROOT)), "message": f"{item_id} depends on unknown implementation unit {dep}"})
        if item.get("implementation_eligible") is True:
            blockers = set(item.get("blocking_gar", []))
            unresolved = blockers & open_gars
            if unresolved:
                findings.append({"severity": "ERROR", "path": str(SEQ_PATH.relative_to(ROOT)), "message": f"{item_id} is eligible but references unresolved GAR items: {', '.join(sorted(unresolved))}"})
            if item.get("approval_status") != "approved":
                findings.append({"severity": "ERROR", "path": str(SEQ_PATH.relative_to(ROOT)), "message": f"{item_id} is eligible but approval_status is not approved"})

    # Validate implementation cards if/when they exist.
    if CARD_DIR.exists():
        for card in sorted(CARD_DIR.glob("*.md")):
            text = card.read_text(errors="ignore")
            approved = re.search(r"\*\*Status:\*\*\s*Approved|Status:\s*Approved", text, re.I) is not None
            for kind, pattern in ID_PATTERNS.items():
                ids = sorted(set(pattern.findall(text)))
                if kind in registry_ids:
                    for found in ids:
                        if found not in registry_ids[kind]:
                            findings.append({"severity": "ERROR", "path": str(card.relative_to(ROOT)), "message": f"Referenced {kind} ID does not exist: {found}"})
                elif kind == "implementation":
                    for found in ids:
                        if found not in imp_ids:
                            findings.append({"severity": "ERROR", "path": str(card.relative_to(ROOT)), "message": f"Referenced implementation ID does not exist: {found}"})
                elif kind == "gar" and approved:
                    unresolved = sorted(set(ids) & open_gars)
                    if unresolved:
                        findings.append({"severity": "ERROR", "path": str(card.relative_to(ROOT)), "message": f"Approved card references unresolved GAR items: {', '.join(unresolved)}"})

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report = {"summary": {"errors": sum(1 for f in findings if f["severity"] == "ERROR"), "findings": len(findings)}, "findings": findings}
    (REPORT_DIR / "implementation-dependency-validation-report.json").write_text(json.dumps(report, indent=2) + "\n")
    lines = ["# Implementation Dependency Validation Report", "", f"Errors: {report['summary']['errors']}", f"Findings: {len(findings)}", ""]
    if findings:
        lines += ["| Severity | Path | Message |", "|---|---|---|"]
        for f in findings:
            lines.append(f"| {f['severity']} | {f['path']} | {f['message'].replace('|', '\\|')} |")
    else:
        lines.append("Implementation dependency validation passed.")
    lines.append("")
    (REPORT_DIR / "implementation-dependency-validation-report.md").write_text("\n".join(lines))

    if report["summary"]["errors"]:
        for f in findings:
            print(f"{f['severity']}: {f['path']}: {f['message']}")
        return 1
    print("Implementation dependency validation passed.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
