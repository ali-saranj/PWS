# Tasks: Add Production HTTPS / SSL

## 1. Environment & Configuration Updates

- [x] 1.1 Update `deploy/.env.prod.example` and `deploy/.env.prod` with `CERTBOT_EMAIL=ali.saranj1384@gmail.com`, `APP_COOKIES_SECURE=true`, and `APP_ZARINPAL_CALLBACK_URL=https://proteinirany.ir/api/shop/payments/zarinpal/callback`, verifying all keys are documented
- [x] 1.2 Validate that Spring Boot `application-prod.yml` consumes `APP_COOKIES_SECURE` and passes secure flags to cookies by running `./mvnw -q test -Dtest=SecurityConfigTest` (or verifying relevant config bindings)

## 2. Nginx Reverse Proxy TLS & Redirection Configuration

- [x] 2.1 Refactor `deploy/nginx/pws.conf` to split into port 80 HTTP listener and port 443 HTTPS listeners, ensuring `/.well-known/acme-challenge/` and `/13642013.txt` are served over HTTP without redirection
- [x] 2.2 Configure port 80 permanent redirect (HTTP 301) to `https://proteinirany.ir$request_uri` for all other traffic
- [x] 2.3 Configure port 443 `www.proteinirany.ir` redirect to `https://proteinirany.ir$request_uri`
- [x] 2.4 Configure port 443 canonical server block for `proteinirany.ir` with TLSv1.2/1.3, modern ciphers, HSTS, and proxy headers (`X-Forwarded-Proto https`, `X-Forwarded-Port 443`)
- [x] 2.5 Verify Nginx configuration syntax validity using `docker run --rm -v $(pwd)/deploy/nginx/pws.conf:/etc/nginx/conf.d/default.conf:ro nginx:1.27-alpine nginx -t` (or local dry-run with mock certs)

## 3. Docker Compose Services & Auto-Renewal

- [x] 3.1 Add `pws-certbot` service to `deploy/docker-compose.prod.yml` using image `certbot/certbot:v3.1.0` with volume mounts (`certbot_www`, `certbot_conf`), 12h renewal loop command, and 64M memory cap
- [x] 3.2 Update `pws-nginx` service in `deploy/docker-compose.prod.yml` with background periodic reload loop (`while :; do sleep 12h & wait ${!}; nginx -s reload; done & nginx -g "daemon off;"`)
- [x] 3.3 Verify Compose configuration syntax with `docker compose -f deploy/docker-compose.prod.yml config`

## 4. Initial SSL Bootstrap Script

- [x] 4.1 Create `deploy/init-ssl.sh` implementing the chicken-and-egg resolution (dummy self-signed cert generation, starting Nginx, requesting real certs via Certbot webroot, and reloading Nginx) with `--staging` flag support
- [x] 4.2 Grant execute permissions (`chmod +x deploy/init-ssl.sh`) and verify script syntax with `bash -n deploy/init-ssl.sh`

## 5. Deployment Integration & End-to-End Verification

- [x] 5.1 Update `deploy/deploy.sh` smoke verification to inspect HTTPS availability and headers when SSL is enabled
- [x] 5.2 Document the SSL provisioning and renewal operations in `README.md` and verify all production checklist items match `deployment/production` specification requirements

## Workflow follow-up

- Archive the change after implementation and verification are complete (`openspec archive add-https-ssl`).
