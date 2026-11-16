# Design: Production HTTPS / SSL Architecture

## Context

See `proposal.md` for motivation and background.

Currently, `deploy/docker-compose.prod.yml` defines the `nginx` reverse proxy exposing ports `80` and `443` with volumes `certbot_www` and `certbot_conf` already attached. However, `pws.conf` only configures a port 80 listener. The container setup is lightweight, constrained to a 2GB RAM host with Podman/Docker, requiring memory-conscious container configurations.

## Goals / Non-Goals

**Goals:**
- Provide zero-downtime TLS termination using Let's Encrypt certificates for `proteinirany.ir` and `www.proteinirany.ir`.
- Enforce canonical HTTPS routing (`https://proteinirany.ir`) from HTTP, `www`, and the raw server IP (`94.184.25.112`).
- Automate certificate renewals every 12 hours without requiring host cron or granting Docker socket privileges to containers.
- Provide a robust initial bootstrap script (`deploy/init-ssl.sh`) to overcome the chicken-and-egg startup problem.
- Ensure all downstream applications (Spring Boot Core API, Next.js Storefront) receive accurate HTTPS forwarded headers and enforce secure cookies.

**Non-Goals:**
- DNS-01 challenge automation (HTTP-01 webroot challenge is sufficient since port 80 is publicly accessible).
- Internal TLS between Nginx and internal container services (`shop:3000`, `api:8080`)—traffic remains isolated inside the private Docker bridge network.
- Wildcard certificates (only apex `proteinirany.ir` and `www.proteinirany.ir` are required).

## Decisions

### 1. HTTP-01 Webroot Validation via Dedicated Certbot Service
- **Decision**: Use `certbot/certbot:v3.1.0` in Docker Compose sharing `/var/www/certbot` with Nginx.
- **Rationale**: Keeps SSL completely self-contained within the repository. HTTP-01 webroot avoids needing API keys for DNS registrars.
- **Alternatives Considered**:
  - *Certbot Standalone*: Requires stopping Nginx during renewal, causing recurring downtime.
  - *Cloudflare / CDN proxy*: Adds third-party external dependency and potential network latency or filtering inside Iran.

### 2. Nginx Periodic Reload Loop over Docker Socket Hooks
- **Decision**: In `docker-compose.prod.yml`, run Nginx with an entrypoint/command loop:
  `sh -c "while :; do sleep 12h & wait \${!}; nginx -s reload; done & nginx -g 'daemon off;'"`
- **Rationale**: Periodically reloading Nginx guarantees that when Certbot silently renews the certificates, Nginx picks them up within 12 hours without dropping active connections. This avoids mounting `/var/run/docker.sock` into Certbot (which would be a major container breakout security risk).
- **Alternatives Considered**:
  - *Host crontab*: Requires manual server-level configuration outside Git repository control.
  - *Certbot deploy-hook with docker socket*: Security hazard to mount docker.sock.

### 3. "Dummy Certificate" Bootstrap Script (`init-ssl.sh`)
- **Decision**: Provide `deploy/init-ssl.sh` that checks if `/etc/letsencrypt/live/proteinirany.ir/fullchain.pem` exists in `certbot_conf`. If missing:
  1. Generates a temporary self-signed certificate using `openssl`.
  2. Starts the Nginx container so port 80 and 443 are listening.
  3. Deletes the dummy certificate and requests genuine certificates from Let's Encrypt via `certbot certonly --webroot`.
  4. Reloads Nginx gracefully (`docker compose exec nginx nginx -s reload`).
- **Rationale**: Eliminates the circular dependency where Nginx cannot boot with an SSL config without certificates on disk. Includes a `--staging` flag to test the flow against the Let's Encrypt Staging API without hitting strict production rate limits.

### 4. TLS Cipher Suite and Security Headers
- **Decision**: Follow Mozilla Intermediate TLS recommendations:
  - Protocols: `TLSv1.2 TLSv1.3`.
  - Ciphers: `ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384`.
  - Headers: `Strict-Transport-Security: max-age=31536000; includeSubDomains` always.
  - Forwarded headers: `X-Forwarded-Proto https`, `X-Forwarded-Port 443`.

## Risks / Trade-offs

- **[Risk] Let's Encrypt Rate Limits (5 failures per hour per domain)**:
  → *Mitigation*: `init-ssl.sh` supports a `--staging` parameter to verify the entire pipeline against ACME staging before issuing the real production certificate.
- **[Risk] Port 80 Blocked by Firewall**:
  → *Mitigation*: ACME challenge requires port 80. `deploy/setup-server.sh` already configures firewall rules for port 80 and 443 (`firewalld` and `ufw`).
- **[Risk] Enamad Verification Interruption**:
  → *Mitigation*: `location = /13642013.txt` is retained on port 80 and port 443 before redirects.

## Migration Plan

1. Apply Nginx configuration updates (`deploy/nginx/pws.conf`) and Docker Compose service additions (`pws-certbot`).
2. Update `deploy/.env.prod` with `APP_COOKIES_SECURE=true`, `CERTBOT_EMAIL=ali.saranj1384@gmail.com`, and `APP_ZARINPAL_CALLBACK_URL=https://proteinirany.ir/api/shop/payments/zarinpal/callback`.
3. Run `bash deploy/init-ssl.sh` on the server to obtain initial certificates.
4. Verify endpoints with `curl -Iv https://proteinirany.ir` and verify HTTP 301 redirection from `http://proteinirany.ir`.
5. Rollback: If certificates fail to issue, restore HTTP-only server block in `pws.conf` and restart Nginx.
