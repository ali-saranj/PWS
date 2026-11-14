# Design

## Context

See `proposal.md` for motivation.

In the production deployment:
- The Spring Boot Core API container (`pws-api`) runs as a dedicated non-root user `pws` (UID 1001, GID 1001) as defined in `api/Dockerfile`.
- The persistent volume `deploy_pws_media` is mounted to `/media` inside the API container and to `/var/www/media:ro` inside the Nginx container.
- When initial catalog media was imported from a developer workstation, files and directories retained the host's UID 501 with mode `755`, preventing user 1001 from creating product subdirectories (e.g., `/media/products/74`).

## Goals / Non-Goals

**Goals:**
- Ensure the production media volume allows the non-root API container user (UID 1001) full read/write permissions.
- Make volume ownership and permissions idempotent in `deploy/setup-server.sh` and `deploy/deploy.sh` so future deployments and seed updates do not break write access.
- Provide clear error logging in `LocalMediaStorage` if an `AccessDeniedException` occurs, pointing directly to permission/ownership mismatches rather than generic `INTERNAL_ERROR`.

**Non-Goals:**
- Running the API container as `root` (breaks container security hardening).
- Migrating from local/volume media storage to external object storage (e.g., S3/MinIO).

## Decisions

### Decision 1: Set volume ownership to `1001:1001` with `0775` permissions
- **Rationale**: User `pws` (UID 1001) requires write access to create product and brand folders (`/media/products/<id>`, `/media/brands/<id>`). Nginx requires read access (`r-x`), which is satisfied by mode `0775` or `0755`.
- **Alternatives considered**:
  - *Running container as root*: Rejected. Non-root user execution in `api/Dockerfile` is an essential security invariant.
  - *Setting permissions to 777*: Rejected. World-writable permissions are overly permissive; `1001:1001` with `775` properly attributes files to the service user.

### Decision 2: Embed permission checks/chown in deployment workflow
- **Rationale**: `deploy.sh` is executed whenever the application is updated. Adding a volume permission check or pre-creation hook in `deploy.sh` (or container entrypoint) guarantees that even if someone rsyncs files with arbitrary UIDs, permissions are corrected before the API serves traffic.

### Decision 3: Add explicit permission diagnostic in `LocalMediaStorage`
- **Rationale**: `LocalMediaStorage.save` currently catches `IOException` and wraps it in `UncheckedIOException`. When `e instanceof AccessDeniedException`, logging an actionable error message (`LocalMediaStorage permission denied: target directory is not writable by current user`) before propagating allows operators to immediately diagnose storage configuration issues.

## Risks / Trade-offs

- **[Risk] Nginx read failure if permissions are too restrictive** → **Mitigation**: Use directory mode `775` and file mode `664` with ownership `1001:1001` so world-readable bits (`r-x` on directories, `r--` on files) allow Nginx (running as user `nginx` or root master) to serve static media without issue.
- **[Risk] Podman vs Docker volume path difference** → **Mitigation**: Run `chown` via container execution (`podman/docker exec` or a lightweight alpine helper container) or directly against the resolved volume path.

## Migration Plan

1. Apply fix directly to running production host `94.184.25.112`:
   `podman exec -u 0 pws-api chown -R pws:pws /media`
2. Update deployment scripts in the repository (`deploy/deploy.sh` and `deploy/setup-server.sh`).
3. Commit and push the change.
