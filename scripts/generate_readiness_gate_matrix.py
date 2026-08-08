#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / 'governance' / 'reports'
REG = {'SVC':('services.json',r'\bSVC-\d{3,}\b'),'API':('apis.json',r'\bAPI-\d{3,}\b'),'DB':('databases.json',r'\bDB-\d{3,}\b'),'EVT':('events.json',r'\bEVT-\d{3,}\b'),'WF':('workflows.json',r'\bWF-\d{3,}\b'),'ADR':('adrs.json',r'\bADR-\d{3,}\b')}
CONFIG={
 'IMP-002': {'card':'CARD-IMP-002.md','deps':['docs/implementation/imp-001/CLOSURE_RECORD.md'],'gars':['GAR-008','GAR-009','GAR-016'],'disp':'docs/readiness/fast-track/IMP_002_GAR_DISPOSITION.md'},
 'IMP-003': {'card':'CARD-IMP-003.md','deps':['docs/implementation/imp-001/CLOSURE_RECORD.md','docs/implementation/imp-002/CLOSURE_RECORD.md'],'gars':['GAR-007','GAR-016'],'disp':'docs/readiness/fast-track/IMP_003_GAR_DISPOSITION.md'},
}
def ids(file):
    return {i['id'] for i in json.loads((ROOT/'docs/indexes/json'/file).read_text()).get('items',[]) if 'id' in i}
def status(name, ok, evidence): return {'gate':name,'status':'PASS' if ok else 'FAIL','evidence':evidence}
def main():
    target=sys.argv[1] if len(sys.argv)>1 else 'IMP-002'
    if target not in CONFIG:
        print(f'{target} fast-track matrix is not configured.'); return 2
    cfg=CONFIG[target]
    card=ROOT/'implementation-cards/drafts'/cfg['card']
    text=card.read_text() if card.exists() else ''
    gates=[]
    gates.append(status('Baseline evidence certificate',(ROOT/'docs/readiness/baseline/READINESS_BASELINE_001.md').exists(),'READINESS-BASELINE-001'))
    gates.append(status(f'{cfg["card"]} exists',card.exists(),str(card.relative_to(ROOT)) if card.exists() else str(card)))
    for dep in cfg['deps']:
        gates.append(status(f'Dependency {dep}',(ROOT/dep).exists(),dep))
    missing=[]
    for _,(file,pat) in REG.items():
        known=ids(file)
        for found in sorted(set(re.findall(pat,text))):
            if found not in known: missing.append(found)
    gates.append(status('Registry dependencies',not missing,'missing: '+', '.join(missing) if missing else 'all referenced registry IDs resolve'))
    for gar in cfg['gars']:
        gates.append(status(f'{gar} disposition',(ROOT/cfg['disp']).exists(),cfg['disp']))
    auth_record=ROOT/'docs/authorization'/f'IAG-DECISION-{target}.md'
    auth_text=auth_record.read_text() if auth_record.exists() else ''
    pre='Production Code Generation: Prohibited' in text and 'Implementation Authorized: No' in text
    post=f'Permitted within approved {target} scope only' in text and 'Effective Authorization | Granted' in auth_text
    gates.append(status('Authorization boundary check',pre or post,f'{cfg["card"]} authorization section'))
    dep_report=(ROOT/'governance/reports/implementation-dependency-validation-report.md').read_text() if (ROOT/'governance/reports/implementation-dependency-validation-report.md').exists() else ''
    gov_report=(ROOT/'governance/reports/governance-validation-report.md').read_text() if (ROOT/'governance/reports/governance-validation-report.md').exists() else ''
    gates.append(status('Dependency validation','Errors: 0' in dep_report and 'Findings: 0' in dep_report,'implementation-dependency-validation-report.md'))
    gates.append(status('Governance validation','Errors: 0' in gov_report and 'Findings: 0' in gov_report,'governance-validation-report.md'))
    ready=all(g['status']=='PASS' for g in gates)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    slug=target.lower().replace('-','-')
    md=[f'# Fast-Track Readiness Gate Matrix — {target}','','| Gate | Status | Evidence |','|---|---|---|']
    for g in gates: md.append(f"| {g['gate']} | {g['status']} | {g['evidence']} |")
    md += ['', f"**READINESS:** {'PASS' if ready else 'FAIL'}", '', 'This matrix does not authorize implementation.']
    (REPORT_DIR/f'{slug}-fast-track-readiness-matrix.md').write_text('\n'.join(md)+'\n')
    (REPORT_DIR/f'{slug}-fast-track-readiness-matrix.json').write_text(json.dumps({'target':target,'readiness':'PASS' if ready else 'FAIL','gates':gates},indent=2)+'\n')
    print(f"{target} fast-track readiness: {'PASS' if ready else 'FAIL'}")
    return 0 if ready else 1
if __name__=='__main__': sys.exit(main())
