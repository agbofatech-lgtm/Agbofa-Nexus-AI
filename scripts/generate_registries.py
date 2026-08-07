#!/usr/bin/env python3
"""Generate human-readable Markdown registries from machine-readable JSON registries."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
JSON_DIR = ROOT / "docs" / "indexes" / "json"
INDEX_DIR = ROOT / "docs" / "indexes"

REGISTRY_CONFIG: dict[str, dict[str, Any]] = {
    "entities": {
        "title": "Canonical Entity Registry",
        "path": INDEX_DIR / "ENTITY_REGISTRY.md",
        "columns": ["ID", "Name", "Type", "Owner", "Status", "Primary Volume", "Source Reference", "Related ADRs", "Dependencies", "Related Services", "Related APIs", "Related Events", "Related Databases", "Related Agents", "Related UI Screens", "Notes"],
        "keys": ["id", "name", "type", "owner", "status", "primary_volume", "source_reference", "related_adrs", "dependencies", "related_services", "related_apis", "related_events", "related_databases", "related_agents", "related_ui_screens", "notes"],
        "purpose": "Assign stable canonical identifiers to major platform artifacts across documentation, implementation, testing, and deployment.",
    },
    "services": {
        "title": "Service Registry",
        "path": INDEX_DIR / "SERVICE_REGISTRY.md",
        "columns": ["ID", "Name", "Owner", "Bounded Context", "Status", "Primary Volume", "Source Reference", "Related ADRs", "Dependencies", "Exposes APIs", "Consumes Events", "Produces Events", "Database Owner", "Runtime", "Language", "Deployment Unit", "Tests Required", "Implementation Status"],
        "keys": ["id", "name", "owner", "bounded_context", "status", "primary_volume", "source_reference", "related_adrs", "dependencies", "exposes_apis", "consumes_events", "produces_events", "database_owner", "runtime", "language", "deployment_unit", "tests_required", "implementation_status"],
        "purpose": "Canonical registry for services and microservices.",
    },
    "databases": {
        "title": "Database Registry",
        "path": INDEX_DIR / "DATABASE_REGISTRY.md",
        "columns": ["ID", "Name", "Technology", "Owner Service", "Owner Domain", "Status", "Primary Volume", "Source Reference", "Related ADRs", "Schemas/Collections/Graphs", "Entities/Nodes/Relationships", "Access Pattern", "Migration Location", "Backup/Retention Requirements", "Tests Required", "Implementation Status"],
        "keys": ["id", "name", "technology", "owner_service", "owner_domain", "status", "primary_volume", "source_reference", "related_adrs", "schemas_collections_graphs", "entities_nodes_relationships", "access_pattern", "migration_location", "backup_retention_requirements", "tests_required", "implementation_status"],
        "purpose": "Canonical registry for database ownership, schemas, collections, and graph domains.",
    },
    "apis": {
        "title": "API Registry",
        "path": INDEX_DIR / "API_REGISTRY.md",
        "columns": ["ID", "Name", "API Type", "Owning Service", "Status", "Primary Volume", "Source Reference", "Related ADRs", "Method/RPC", "Path/Service", "Request Contract", "Response Contract", "Auth/Security", "Dependencies", "Related Events", "Tests Required", "Implementation Status"],
        "keys": ["id", "name", "api_type", "owning_service", "status", "primary_volume", "source_reference", "related_adrs", "method_rpc", "path_service", "request_contract", "response_contract", "auth_security", "dependencies", "related_events", "tests_required", "implementation_status"],
        "purpose": "Canonical registry for REST, gRPC, and other API contracts.",
    },
    "events": {
        "title": "Event Registry",
        "path": INDEX_DIR / "EVENT_REGISTRY.md",
        "columns": ["ID", "Name", "Topic/Stream", "Producer", "Consumers", "Status", "Primary Volume", "Source Reference", "Related ADRs", "Payload Contract", "Ordering Requirement", "Idempotency Requirement", "Retention", "Security Classification", "Tests Required", "Implementation Status"],
        "keys": ["id", "name", "topic_stream", "producer", "consumers", "status", "primary_volume", "source_reference", "related_adrs", "payload_contract", "ordering_requirement", "idempotency_requirement", "retention", "security_classification", "tests_required", "implementation_status"],
        "purpose": "Canonical registry for events, Kafka topics, and event contracts.",
    },
    "agents": {
        "title": "AI Agent Registry",
        "path": INDEX_DIR / "AGENT_REGISTRY.md",
        "columns": ["ID", "Name", "Role", "Owning Service", "Status", "Primary Volume", "Source Reference", "Related ADRs", "Capabilities", "Tools", "Prompt References", "Memory Scope", "LLM/Model Policy", "Governance Controls", "Human Approval Required", "Tests Required", "Implementation Status"],
        "keys": ["id", "name", "role", "owning_service", "status", "primary_volume", "source_reference", "related_adrs", "capabilities", "tools", "prompt_references", "memory_scope", "llm_model_policy", "governance_controls", "human_approval_required", "tests_required", "implementation_status"],
        "purpose": "Canonical registry for approved AI agents and agentic components.",
    },
    "ui": {
        "title": "UI Screen Registry",
        "path": INDEX_DIR / "UI_SCREEN_REGISTRY.md",
        "columns": ["ID", "Name", "Application", "Route", "User Role/Audience", "Status", "Primary Volume", "Source Reference", "Related ADRs", "Related Workflow", "APIs Used", "Events Used", "Accessibility Requirements", "Security Requirements", "Tests Required", "Implementation Status"],
        "keys": ["id", "name", "application", "route", "user_role_audience", "status", "primary_volume", "source_reference", "related_adrs", "related_workflow", "apis_used", "events_used", "accessibility_requirements", "security_requirements", "tests_required", "implementation_status"],
        "purpose": "Canonical registry for frontend pages, screens, routes, and user interfaces.",
    },
    "workflows": {
        "title": "Workflow Registry",
        "path": INDEX_DIR / "WORKFLOW_REGISTRY.md",
        "columns": ["ID", "Name", "Workflow Type", "Owner", "Status", "Primary Volume", "Source Reference", "Related ADRs", "Trigger", "Participants", "Services Involved", "APIs Used", "Events Produced/Consumed", "Databases Used", "UI Screens", "Security Controls", "Tests Required", "Implementation Status"],
        "keys": ["id", "name", "workflow_type", "owner", "status", "primary_volume", "source_reference", "related_adrs", "trigger", "participants", "services_involved", "apis_used", "events_produced_consumed", "databases_used", "ui_screens", "security_controls", "tests_required", "implementation_status"],
        "purpose": "Canonical registry for approved business, editorial, AI, operational, deployment, and security workflows.",
    },
    "adrs": {
        "title": "Architecture Decision Record Index",
        "path": INDEX_DIR / "ADR_INDEX.md",
        "columns": ["ADR ID", "Title", "Status", "Decision Area", "Related Volumes", "Related Services", "Related APIs/Events/Databases", "Supersedes", "Source Reference", "Implementation Impact"],
        "keys": ["id", "title", "status", "decision_area", "related_volumes", "related_services", "related_apis_events_databases", "supersedes", "source_reference", "implementation_impact"],
        "purpose": "Canonical index for approved Architecture Decision Records.",
    },
}


def cell(value: Any) -> str:
    if value is None or value == "":
        return ""
    if isinstance(value, list):
        return ", ".join(str(v) for v in value)
    return str(value).replace("\n", "<br>").replace("|", "\\|")


def load_registry(name: str) -> dict[str, Any]:
    path = JSON_DIR / f"{name}.json"
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def render_registry(name: str) -> str:
    cfg = REGISTRY_CONFIG[name]
    data = load_registry(name)
    columns = cfg["columns"]
    keys = cfg["keys"]
    lines = [
        f"# {cfg['title']}",
        "",
        f"**Purpose:** {cfg['purpose']}  ",
        f"**Machine Source:** `docs/indexes/json/{name}.json`  ",
        "**Generation:** Generated by `scripts/generate_registries.py`; edit the JSON source, then regenerate Markdown.  ",
        "",
        "| " + " | ".join(columns) + " |",
        "|" + "---|" * len(columns),
    ]
    items = data.get("items", [])
    if items:
        for item in items:
            lines.append("| " + " | ".join(cell(item.get(k, "")) for k in keys) + " |")
    else:
        empty = ["No registered entries"] + [""] * (len(columns) - 1)
        lines.append("| " + " | ".join(empty) + " |")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail if generated Markdown differs from committed files")
    args = parser.parse_args()
    mismatches: list[Path] = []
    for name, cfg in REGISTRY_CONFIG.items():
        rendered = render_registry(name)
        path = cfg["path"]
        if args.check:
            current = path.read_text(encoding="utf-8") if path.exists() else ""
            if current != rendered:
                mismatches.append(path)
        else:
            path.write_text(rendered, encoding="utf-8")
    if mismatches:
        print("Registry Markdown is out of sync with JSON sources:")
        for path in mismatches:
            print(f"- {path.relative_to(ROOT)}")
        print("Run: python3 scripts/generate_registries.py")
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
