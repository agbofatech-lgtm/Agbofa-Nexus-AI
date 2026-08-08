# Backup and Disaster Recovery Foundation

IMP-002 records backup and DR foundation controls from Phase 5 Document 2.

| System | RPO | RTO / Notes |
|---|---|---|
| PostgreSQL | 5 minutes | PITR and cross-region backup expected |
| Neo4j | 1 hour | Full and incremental backups expected |
| Kafka | 5 minutes | Continuous S3 sink pattern expected |
| Redis | 24 hours | Cache/session recovery according to service criticality |
| ClickHouse | 1 hour | Replayable analytics data expected |

Concrete cloud backup resources require authorized implementation detail within IMP-002 scope.
