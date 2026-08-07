#!/usr/bin/env python3
"""Repository governance validation engine for Agbofa Nexus AI."""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

ROOT = Path(__file__).resolve().parents[2]
JSON_DIR = ROOT / "docs" / "indexes" / "json"
REPORT_DIR = ROOT / "governance" / "reports"

REGISTRIES = {
    "entities": ("ENT", "ENTITY_REGISTRY.md"),
    "services": ("SVC", "SERVICE_REGISTRY.md"),
    "databases": ("DB", "DATABASE_REGISTRY.md"),
    "apis": ("API", "API_REGISTRY.md"),
    "events": ("EVT", "EVENT_REGISTRY.md"),
    "agents": ("AGT", "AGENT_REGISTRY.md"),
    "workflows": ("WF", "WORKFLOW_REGISTRY.md"),
    "ui": ("UI", "UI_SCREEN_REGISTRY.md"),
    "adrs": ("ADR", "ADR_INDEX.md"),
}

@dataclass
class Finding:
    validator: str
    severity: str
    message: str
    path: str = ""

class ValidationContext:
    def __init__(self) -> None:
        self.findings: list[Finding] = []
        self.registries: dict[str, dict[str, Any]] = {}

    def add(self, validator: str, severity: str, message: str, path: Path | str = "") -> None:
        rel = str(path)
        if isinstance(path, Path):
            try:
                rel = str(path.relative_to(ROOT))
            except ValueError:
                rel = str(path)
        self.findings.append(Finding(validator, severity, message, rel))

    def fail_count(self) -> int:
        return sum(1 for f in self.findings if f.severity == "ERROR")


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_registries(ctx: ValidationContext) -> None:
    for name in REGISTRIES:
        path = JSON_DIR / f"{name}.json"
        if not path.exists():
            ctx.add("entity-validator", "ERROR", f"Missing machine-readable registry: {path.relative_to(ROOT)}", path)
            continue
        try:
            ctx.registries[name] = load_json(path)
        except json.JSONDecodeError as exc:
            ctx.add("entity-validator", "ERROR", f"Invalid JSON: {exc}", path)


def as_list(value: Any) -> list[str]:
    if value is None or value == "":
        return []
    if isinstance(value, list):
        return [str(v) for v in value]
    return [str(value)]


def id_set(ctx: ValidationContext, registry: str) -> set[str]:
    return {str(item.get("id")) for item in ctx.registries.get(registry, {}).get("items", []) if item.get("id")}


def validate_registry_shape(ctx: ValidationContext) -> None:
    for name, (prefix, _) in REGISTRIES.items():
        data = ctx.registries.get(name)
        path = JSON_DIR / f"{name}.json"
        if not data:
            continue
        if data.get("canonical_prefix") != prefix:
            ctx.add("entity-validator", "ERROR", f"Registry {name} has prefix {data.get('canonical_prefix')} but expected {prefix}", path)
        items = data.get("items")
        if not isinstance(items, list):
            ctx.add("entity-validator", "ERROR", f"Registry {name} must contain an items array", path)
            continue
        required = data.get("required_fields", [])
        seen: set[str] = set()
        for index, item in enumerate(items):
            item_id = str(item.get("id", ""))
            if not item_id:
                ctx.add("entity-validator", "ERROR", f"Registry {name} item {index} is missing id", path)
                continue
            if item_id in seen:
                ctx.add("entity-validator", "ERROR", f"Duplicate ID {item_id} in {name}", path)
            seen.add(item_id)
            pattern = rf"^{re.escape(prefix)}-[0-9]{{3,}}$"
            if not re.match(pattern, item_id):
                ctx.add("entity-validator", "ERROR", f"ID {item_id} does not match required pattern {prefix}-001", path)
            for field in required:
                if item.get(field) in (None, "", []):
                    ctx.add("entity-validator", "ERROR", f"{item_id} is missing required field: {field}", path)


def validate_cross_references(ctx: ValidationContext) -> None:
    svc_ids = id_set(ctx, "services")
    api_ids = id_set(ctx, "apis")
    db_ids = id_set(ctx, "databases")
    evt_ids = id_set(ctx, "events")
    agt_ids = id_set(ctx, "agents")
    ui_ids = id_set(ctx, "ui")
    wf_ids = id_set(ctx, "workflows")
    adr_ids = id_set(ctx, "adrs")

    def check(registry: str, item: dict[str, Any], field: str, allowed: set[str], validator: str) -> None:
        for ref in as_list(item.get(field)):
            if ref and ref not in allowed:
                ctx.add(validator, "ERROR", f"{item.get('id')} references unknown {field}: {ref}", JSON_DIR / f"{registry}.json")

    for name, data in ctx.registries.items():
        for item in data.get("items", []):
            for field in ("related_adrs", "adr_references"):
                check(name, item, field, adr_ids, "adr-validator")

    for item in ctx.registries.get("apis", {}).get("items", []):
        check("apis", item, "owning_service", svc_ids, "api-validator")
        check("apis", item, "related_events", evt_ids, "api-validator")
    for item in ctx.registries.get("databases", {}).get("items", []):
        check("databases", item, "owner_service", svc_ids, "database-validator")
    for item in ctx.registries.get("events", {}).get("items", []):
        check("events", item, "producer", svc_ids, "workflow-validator")
        check("events", item, "consumers", svc_ids, "workflow-validator")
    for item in ctx.registries.get("agents", {}).get("items", []):
        check("agents", item, "owning_service", svc_ids, "workflow-validator")
    for item in ctx.registries.get("ui", {}).get("items", []):
        check("ui", item, "apis_used", api_ids, "api-validator")
        check("ui", item, "events_used", evt_ids, "workflow-validator")
        check("ui", item, "related_workflow", wf_ids, "workflow-validator")
    for item in ctx.registries.get("workflows", {}).get("items", []):
        check("workflows", item, "services_involved", svc_ids, "workflow-validator")
        check("workflows", item, "apis_used", api_ids, "workflow-validator")
        check("workflows", item, "events_produced_consumed", evt_ids, "workflow-validator")
        check("workflows", item, "databases_used", db_ids, "workflow-validator")
        check("workflows", item, "ui_screens", ui_ids, "workflow-validator")
        check("workflows", item, "agents", agt_ids, "workflow-validator")


def validate_markdown_sync(ctx: ValidationContext) -> None:
    result = subprocess.run([sys.executable, str(ROOT / "scripts" / "generate_registries.py"), "--check"], cwd=ROOT, text=True, capture_output=True)
    if result.returncode != 0:
        ctx.add("documentation-validator", "ERROR", result.stdout.strip() or result.stderr.strip(), "docs/indexes")


def validate_required_files(ctx: ValidationContext) -> None:
    required = [
        "docs/manifest/MASTER_DOCUMENTATION_MANIFEST.md",
        "docs/indexes/TRACEABILITY_MATRIX.md",
        "docs/indexes/IMPLEMENTATION_STATUS.md",
        "docs/indexes/ARCHITECTURE_DRIFT_REGISTER.md",
        "docs/governance/ARCHITECTURE_VALIDATION_GATE.md",
        "docs/governance/AI_RETRIEVAL_LAYER.md",
        "docs/governance/SOURCE_PRESERVATION_LAYER.md",
        "templates/IMPLEMENTATION_CARD_TEMPLATE.md",
    ]
    for rel in required:
        path = ROOT / rel
        if not path.exists():
            ctx.add("documentation-validator", "ERROR", f"Required governance artifact is missing: {rel}", path)


def validate_implementation_cards(ctx: ValidationContext) -> None:
    cards = list((ROOT / "implementation-cards").glob("*.md")) if (ROOT / "implementation-cards").exists() else []
    required_phrases = [
        "## 1. Objective",
        "## 2. Documentation References",
        "## 3. Dependency Analysis",
        "## 4. Architecture Validation Gate",
        "## 8. Approval",
        "## 10. Test Summary",
        "## 11. Documentation Updates",
    ]
    for card in cards:
        text = card.read_text(encoding="utf-8")
        for phrase in required_phrases:
            if phrase not in text:
                ctx.add("traceability-validator", "ERROR", f"Implementation card missing section: {phrase}", card)
        if "Pending" in text and "**Status:** Complete" in text:
            ctx.add("traceability-validator", "ERROR", "Complete implementation card still contains pending fields", card)


def validate_markdown_links(ctx: ValidationContext) -> None:
    link_pattern = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
    for path in ROOT.rglob("*.md"):
        if ".git" in path.parts:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for match in link_pattern.finditer(text):
            target = match.group(1)
            if target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            clean = target.split("#", 1)[0]
            if not clean:
                continue
            candidate = (path.parent / clean).resolve()
            try:
                candidate.relative_to(ROOT)
            except ValueError:
                ctx.add("documentation-validator", "ERROR", f"Link escapes repository: {target}", path)
                continue
            if not candidate.exists():
                ctx.add("documentation-validator", "ERROR", f"Broken local link: {target}", path)


def validate_security_controls(ctx: ValidationContext) -> None:
    sec_path = ROOT / "docs" / "indexes" / "SECURITY_INDEX.md"
    if not sec_path.exists():
        ctx.add("security-validator", "ERROR", "Security index is missing", sec_path)
    for registry_name in ("apis", "agents", "ui", "events"):
        for item in ctx.registries.get(registry_name, {}).get("items", []):
            fields = ["auth_security", "security_requirements", "security_classification", "governance_controls"]
            if not any(item.get(field) for field in fields):
                ctx.add("security-validator", "ERROR", f"{item.get('id')} lacks security/governance classification", JSON_DIR / f"{registry_name}.json")


def run_validators(selected: list[str]) -> ValidationContext:
    ctx = ValidationContext()
    load_registries(ctx)
    validators: dict[str, Callable[[ValidationContext], None]] = {
        "entity-validator": validate_registry_shape,
        "adr-validator": validate_cross_references,
        "api-validator": validate_cross_references,
        "database-validator": validate_cross_references,
        "workflow-validator": validate_cross_references,
        "traceability-validator": validate_implementation_cards,
        "documentation-validator": lambda c: (validate_required_files(c), validate_markdown_sync(c), validate_markdown_links(c)),
        "security-validator": validate_security_controls,
    }
    targets = selected or list(validators)
    for name in targets:
        validator = validators.get(name)
        if validator is None:
            ctx.add("governance-validator", "ERROR", f"Unknown validator requested: {name}")
            continue
        validator(ctx)
    return ctx


def write_report(ctx: ValidationContext) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report = {
        "summary": {"errors": ctx.fail_count(), "findings": len(ctx.findings)},
        "findings": [finding.__dict__ for finding in ctx.findings],
    }
    (REPORT_DIR / "governance-validation-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    lines = ["# Governance Validation Report", "", f"Errors: {ctx.fail_count()}", f"Findings: {len(ctx.findings)}", ""]
    if ctx.findings:
        lines.extend(["| Validator | Severity | Path | Message |", "|---|---|---|---|"])
        for f in ctx.findings:
            lines.append(f"| {f.validator} | {f.severity} | {f.path} | {f.message.replace('|', '\\|')} |")
    else:
        lines.append("All selected governance validations passed.")
    lines.append("")
    (REPORT_DIR / "governance-validation-report.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--validator", action="append", default=[], help="run a specific validator; may be repeated")
    args = parser.parse_args()
    ctx = run_validators(args.validator)
    write_report(ctx)
    for finding in ctx.findings:
        print(f"{finding.severity}: {finding.validator}: {finding.path}: {finding.message}")
    if ctx.fail_count():
        print(f"Governance validation failed with {ctx.fail_count()} error(s).")
        return 1
    print("Governance validation passed.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
