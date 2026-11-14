# deployment/production Specification

## Purpose
Defines operational requirements and behavioral contracts for deploying the PWS system into a production host environment with container isolation, reverse proxy routing, persistent data storage, memory governance, and safe fallbacks.

## Requirements

### Requirement: Unified Reverse Proxy Gateway
The system MUST provide a single reverse proxy entry point routing external requests to the appropriate internal services based on path.

#### Scenario: Customer storefront routing
- **WHEN** an HTTP/HTTPS request arrives for path `/` or any storefront route
- **THEN** the reverse proxy routes the request to the Next.js Storefront service and returns the rendered HTML response

#### Scenario: Staff admin back-office routing
- **WHEN** an HTTP/HTTPS request arrives for path `/admin` or `/admin/*`
- **THEN** the reverse proxy serves the compiled static Single Page Application assets

#### Scenario: Core API and media routing
- **WHEN** an HTTP/HTTPS request arrives for path `/api/*` or `/media/*`
- **THEN** the reverse proxy forwards the request with standard client IP headers (`X-Forwarded-For`, `X-Forwarded-Proto`) to the Spring Boot Core API

### Requirement: Container Orchestration and Persistence
The system MUST orchestrate services using Docker Compose with dedicated persistent storage volumes for database and media assets.

#### Scenario: Database data persistence across restarts
- **WHEN** the PostgreSQL container is restarted or recreated
- **THEN** all committed database records, schema versions, and stock ledger entries are preserved in the persistent volume

#### Scenario: Product media asset persistence
- **WHEN** product images are uploaded or served
- **THEN** the files are stored on a persistent volume accessible by both the API and Nginx

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
