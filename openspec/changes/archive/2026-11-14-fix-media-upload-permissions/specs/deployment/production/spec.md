# Spec Delta

## MODIFIED Requirements

### Requirement: Container Orchestration and Persistence
The system MUST orchestrate services using Docker Compose with dedicated persistent storage volumes for database and media assets, ensuring appropriate filesystem permissions for service containers.

#### Scenario: Database data persistence across restarts
- **WHEN** the PostgreSQL container is restarted or recreated
- **THEN** all committed database records, schema versions, and stock ledger entries are preserved in the persistent volume

#### Scenario: Product media asset persistence
- **WHEN** product images are uploaded or served
- **THEN** the files are stored on a persistent volume accessible by both the API and Nginx

#### Scenario: Non-root API container media write permissions
- **WHEN** the API container running under user `pws` (UID 1001) writes uploaded files or creates subdirectories under `/media`
- **THEN** filesystem permissions permit directory creation and file writes without throwing `AccessDeniedException`
