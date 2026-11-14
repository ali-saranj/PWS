# Proposal

## Why

When uploading product images in the admin panel on the production environment, the backend fails with HTTP 500 `INTERNAL_ERROR` due to `java.nio.file.AccessDeniedException: /media/products/<id>`.

This occurs because the Spring Boot container runs under non-root user `pws` (UID 1001), while the mounted `pws_media` Docker volume was provisioned with host ownership (UID 501, mode 755). Consequently, the backend process cannot create subdirectories or write media files inside `/media`.

Ensuring proper volume ownership and permissions during deployment and bootstrap is required so staff can upload product images and brand logos without operational failures.

## What Changes

- Modify `deploy/setup-server.sh` and `deploy/deploy.sh` to ensure the host mount point for `deploy_pws_media` is owned by user/group `1001:1001` with `0775` permissions.
- Fix volume permissions on the live host environment (`94.184.25.112`) so existing media and new uploads function immediately.
- Enhance `LocalMediaStorage` in `api` to catch `AccessDeniedException` and log descriptive context (path, user, and guidance) to avoid ambiguous errors if filesystem permissions drift.

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `deployment/production`: Update the container orchestration and persistence requirement to specify write permissions for the non-root API service user (UID 1001) on the persistent media volume.

## Impact

- **Affected scripts**: `deploy/setup-server.sh`, `deploy/deploy.sh`.
- **Affected code**: `api/src/main/java/ir/pws/store/catalog/image/LocalMediaStorage.java`.
- **Operational impact**: Fixes image uploads on production without affecting existing media assets served by Nginx.
