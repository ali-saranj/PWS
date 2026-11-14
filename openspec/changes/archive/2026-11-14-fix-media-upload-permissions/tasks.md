# Tasks

## 1. Production Host Remediation

- [x] 1.1 Fix permissions of the media volume on `94.184.25.112` by running `podman exec -u 0 pws-api chown -R pws:pws /media && podman exec -u 0 pws-api chmod -R u=rwX,g=rwX,o=rX /media` and verify ownership is `1001:1001` with `podman exec pws-api ls -ld /media /media/products`
- [x] 1.2 Verify that uploading a product image on production succeeds with HTTP 201 Created and without `INTERNAL_ERROR`

## 2. Deployment Script Hardening

- [x] 2.1 Update `deploy/deploy.sh` to automatically enforce `1001:1001` ownership and `775` permissions on the `pws_media` volume before/after service startup, and verify with `bash -n deploy/deploy.sh`
- [x] 2.2 Update `deploy/setup-server.sh` to configure container volume permissions for non-root users, and verify with `bash -n deploy/setup-server.sh`

## 3. Storage Diagnostic Enhancement

- [x] 3.1 Update `LocalMediaStorage.java` to detect `AccessDeniedException` and log explicit permission and ownership diagnostics before wrapping in `UncheckedIOException`, and verify by running `./mvnw test -Dtest=ProductImageApiTest`
