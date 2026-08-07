#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / 'governance' / 'reports'

REG = {
    'SVC': ('services.json', r'\bSVC-\d{3,}\b'),
    'API': ('apis.json', r'\bAPI-\d{3,}\b'),
    'DB': ('databases.json', r'\bDB-\d{3,}\b'),
    'EVT': ('events.json', r'\bEVT-\d{3,}\b'),
    'WF': ('workflows.json', r'\bWF-\d{3,}\b'),
    'ADR': ('adrs.json', r'\bADR-\d{3,}\b'),
}

def ids(file):
    data=json.loads((ROOT/'docs/indexes/json'/file).read_text())
    return {i['id'] for i in data.get('items',[]) if 'id' in i}

def status(name, ok, evidence):
    return {'gate': name, 'status': 'PASS' if ok else 'FAIL', 'evidence': evidence}

def main():
    target=sys.argv[1] if len(sys.argv)>1 else 'IMP-002'
    if target!='IMP-002':
        print('Only IMP-002 fast-track matrix is currently configured.')
        return 2
    card=ROOT/'implementation-cards/drafts/CARD-IMP-002.md'
    text=card.read_text() if card.exists() else ''
    gates=[]
    gates.append(status('Baseline evidence certificate', (ROOT/'docs/readiness/baseline/READINESS_BASELINE_001.md').exists(), 'READINESS-BASELINE-001'))
    gates.append(status('CARD-IMP-002 exists', card.exists(), str(card.relative_to(ROOT))))
    gates.append(status('IMP-001 dependency closed', (ROOT/'docs/implementation/imp-001/CLOSURE_RECORD.md').exists(), 'docs/implementation/imp-001/CLOSURE_RECORD.md'))
    missing=[]
    for prefix,(file,pat) in REG.items():
        known=ids(file)
        for found in sorted(set(re.findall(pat,text))):
            if found not in known:
                missing.append(found)
    gates.append(status('Registry dependencies', not missing, 'missing: '+', '.join(missing) if missing else 'all referenced registry IDs resolve'))
    gates.append(status('GAR-008 disposition', (ROOT/'docs/readiness/fast-track/IMP_002_GAR_DISPOSITION.md').exists(), 'docs/readiness/fast-track/IMP_002_GAR_DISPOSITION.md'))
    gates.append(status('GAR-009 disposition', (ROOT/'docs/readiness/fast-track/IMP_002_GAR_DISPOSITION.md').exists(), 'docs/readiness/fast-track/IMP_002_GAR_DISPOSITION.md'))
    gates.append(status('GAR-016 disposition', (ROOT/'docs/readiness/fast-track/IMP_002_GAR_DISPOSITION.md').exists(), 'docs/readiness/fast-track/IMP_002_GAR_DISPOSITION.md'))
    gates.append(status('Unauthorized scope check', 'Production Code Generation: Prohibited' in text and 'Implementation Authorized: No' in text, 'CARD-IMP-002 authorization section'))
    dep_report=(ROOT/'governance/reports/implementation-dependency-validation-report.md').read_text() if (ROOT/'governance/reports/implementation-dependency-validation-report.md').exists() else ''
    gov_report=(ROOT/'governance/reports/governance-validation-report.md').read_text() if (ROOT/'governance/reports/governance-validation-report.md').exists() else ''
    gates.append(status('Dependency validation', 'Errors: 0' in dep_report and 'Findings: 0' in dep_report, 'implementation-dependency-validation-report.md'))
    gates.append(status('Governance validation', 'Errors: 0' in gov_report and 'Findings: 0' in gov_report, 'governance-validation-report.md'))
    ready=all(g['status']=='PASS' for g in gates)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    md=['# Fast-Track Readiness Gate Matrix — IMP-002','', '| Gate | Status | Evidence |','|---|---|---|']
    for g in gates:
        md.append(f"| {g['gate']} | {g['status']} | {g['evidence']} |")
    md += ['', f"**READINESS:** {'PASS' if ready else 'FAIL'}", '', 'This matrix does not authorize implementation.']
    (REPORT_DIR/'imp-002-fast-track-readiness-matrix.md').write_text('\n'.join(md)+'\n')
    (REPORT_DIR/'imp-002-fast-track-readiness-matrix.json').write_text(json.dumps({'target':target,'readiness':'PASS' if ready else 'FAIL','gates':gates},indent=2)+'\n')
    print(f"IMP-002 fast-track readiness: {'PASS' if ready else 'FAIL'}")
    return 0 if ready else 1
if __name__=='__main__':
    sys.exit(main())
