# Risk Register

**Status:** Active.

| Risk ID | Risk | Description | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| RISK-0001 | Source documentation unavailable | Approved baseline has not yet been uploaded. | Implementation cannot safely begin. | Wait for source upload; perform intake and inventory first. | Enterprise Engineering Agent / User | Open |
| RISK-0002 | Documentation scale exceeds conversation context | 4,500+ pages cannot be held in active context. | Potential loss of consistency if not repository-backed. | Use permanent memory artifacts and batch processing. | Enterprise Engineering Agent | Mitigated by governance |
| RISK-0003 | Architecture drift | Long implementation may diverge from approved baseline. | Could invalidate enterprise implementation. | Architecture Drift Register, ADR checks, traceability gates. | Enterprise Engineering Agent / Approver | Open |
| RISK-0004 | Source artifact mutation | Original approved documents could be accidentally altered if worked on directly. | Loss of auditability and baseline integrity. | Use immutable `source/` layer, derived `extracted/` layer, checksums, and manifest traceability. | Enterprise Engineering Agent | Mitigated by governance |
