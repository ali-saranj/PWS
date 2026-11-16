# deployment/production Specification

## Purpose
Defines operational requirements and behavioral contracts for deploying the PWS system into a production host environment with container isolation, reverse proxy routing, persistent data storage, memory governance, and safe fallbacks.

## Requirements

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

### Requirement: Memory Governance for Constrained Hosts
The system MUST configure memory caps on JVM and container processes to prevent host Out-Of-Memory (OOM) termination on a 2GB RAM environment.

#### Scenario: JVM heap ceiling enforcement
- **WHEN** the Spring Boot API container starts in production
- **THEN** the JVM executes with `-Xmx512m` to guarantee its heap consumption does not exceed 512 megabytes

#### Scenario: Swap space availability during build
- **WHEN** software packages and container images are built on the server
- **THEN** the host provides at least 4GB of swap space to absorb transient compilation and bundling memory spikes

### Requirement: Unconfigured Third-Party Service Fallback
The system MUST operate gracefully in staging/pre-launch mode without crashing when third-party SMS or payment gateway credentials are not yet supplied.

#### Scenario: Missing SMS provider credentials
- **WHEN** `APP_SMS_PROVIDER` is set to `logging`
- **THEN** the API logs generated OTP codes to stdout without throwing connection or credential exceptions

#### Scenario: Missing payment gateway merchant ID
- **WHEN** `APP_ZARINPAL_SANDBOX` is set to `true`
- **THEN** payment verification endpoints handle test callbacks without failing due to missing live merchant contracts

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
