# Spec Delta: deployment/production

## MODIFIED Requirements

### Requirement: Unified Reverse Proxy Gateway
The system MUST provide a single reverse proxy entry point routing external requests to the appropriate internal services based on path, terminating TLS with modern encryption on port 443, and redirecting plaintext HTTP traffic and non-canonical hosts to canonical HTTPS.

#### Scenario: Customer storefront routing
- **WHEN** an HTTPS request arrives for path `/` or any storefront route on canonical host `proteinirany.ir`
- **THEN** the reverse proxy routes the request to the Next.js Storefront service and returns the rendered HTML response with HSTS headers

#### Scenario: Staff admin back-office routing
- **WHEN** an HTTPS request arrives for path `/admin` or `/admin/*` on canonical host `proteinirany.ir`
- **THEN** the reverse proxy serves the compiled static Single Page Application assets with HSTS headers

#### Scenario: Core API and media routing
- **WHEN** an HTTPS request arrives for path `/api/*` or `/media/*` on canonical host `proteinirany.ir`
- **THEN** the reverse proxy forwards the request with client IP and HTTPS scheme headers (`X-Forwarded-For`, `X-Forwarded-Proto: https`, `X-Forwarded-Port: 443`) to the Spring Boot Core API

#### Scenario: Plaintext HTTP to HTTPS redirection
- **WHEN** an HTTP request arrives on port 80 for any route other than ACME challenge or Enamad verification
- **THEN** the reverse proxy responds with an HTTP 301 permanent redirect to `https://proteinirany.ir` preserving the original request URI

#### Scenario: Non-canonical host redirection
- **WHEN** an HTTP or HTTPS request arrives for `www.proteinirany.ir` or the host IP `94.184.25.112`
- **THEN** the reverse proxy responds with an HTTP 301 permanent redirect to `https://proteinirany.ir` preserving the original request URI

## ADDED Requirements

### Requirement: Automated TLS Certificate Management
The system MUST support automated issuance, challenge verification, and background renewal of Let's Encrypt TLS certificates using Certbot and Nginx webroot validation.

#### Scenario: ACME challenge verification over HTTP
- **WHEN** an HTTP request arrives for `/.well-known/acme-challenge/*` on port 80
- **THEN** the reverse proxy serves the challenge file directly from the shared Certbot webroot volume without redirecting to HTTPS

#### Scenario: Background certificate auto-renewal
- **WHEN** the automated Certbot container executes its periodic renewal cycle
- **THEN** certificates nearing expiration are renewed in the shared configuration volume, and Nginx reloads the active certificates gracefully without downtime

#### Scenario: Initial bootstrap certificate provisioning
- **WHEN** the production environment is booted for the first time without existing certificates
- **THEN** the bootstrap workflow provisions temporary self-signed certificates to allow Nginx startup, obtains genuine Let's Encrypt certificates via ACME webroot, and reloads Nginx with production certificates
