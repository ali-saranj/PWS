# Proposal: Add Production HTTPS / SSL Support

## Why

Persian Web Store (Protein Irany) is preparing for public launch with active Enamad verification and Zarinpal payment integration. Operating over plaintext HTTP exposes customer mobile numbers, OTP tokens, staff credentials, and payment callback data to interception, and prevents modern browsers from honoring secure cookie policies (`Secure` flag on JWT cookies).

Enabling automated HTTPS via Let's Encrypt with Certbot ensures end-to-end transport security, enforces canonical domain routing (`proteinirany.ir`), and meets the security requirements for Iranian e-commerce trust seals and payment gateways.

## What Changes

- **Automated SSL/TLS Termination**: Configure Nginx to terminate TLSv1.2 and TLSv1.3 with modern ciphers and HSTS on port 443 for `proteinirany.ir`.
- **HTTP to HTTPS Canonical Redirection**: Redirect all plaintext HTTP requests (port 80), `www.proteinirany.ir`, and direct host IP access (`94.184.25.112`) to `https://proteinirany.ir` with HTTP 301 permanent redirects, while exempting ACME challenge (`/.well-known/acme-challenge/`) and Enamad verification (`/13642013.txt`).
- **Certbot Container & Automated Renewal**: Add a dedicated `certbot` service to `docker-compose.prod.yml` running an automated 12-hour renewal loop, with Nginx performing graceful background reload loops.
- **Initial SSL Bootstrap Script**: Provide `deploy/init-ssl.sh` to resolve the initial certificate bootstrap ("chicken-and-egg") problem using temporary self-signed placeholders, requesting genuine Let's Encrypt certificates via webroot, and reloading Nginx without service disruption.
- **Production Cookie & Gateway Security**: Enable `APP_COOKIES_SECURE=true` for HTTPS-only cookie transmission and configure `APP_ZARINPAL_CALLBACK_URL` to the canonical HTTPS callback endpoint.

## Capabilities

### New Capabilities
<!-- None: Reusing existing deployment capability -->

### Modified Capabilities
- `deployment/production`: Add requirements for TLS termination, HSTS, HTTP-to-HTTPS canonical redirection, and automated ACME certificate management.

## Impact

- **Nginx Gateway**: `deploy/nginx/pws.conf` will handle dual port 80/443 configurations with SSL parameters and redirection rules.
- **Docker Compose**: `deploy/docker-compose.prod.yml` will add the `pws-certbot` container and configure Nginx reload commands.
- **Deployment Scripts**: `deploy/init-ssl.sh` added for bootstrap; `deploy/deploy.sh` updated to verify HTTPS health and certificates.
- **Application Environment**: `deploy/.env.prod` and `.env.prod.example` will enable `APP_COOKIES_SECURE=true`, set `CERTBOT_EMAIL=ali.saranj1384@gmail.com`, and set `APP_ZARINPAL_CALLBACK_URL` with HTTPS.
