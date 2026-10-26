# PWS — deli & grocery store (فروشگاه پروتئینی و سوپرمارکتی)

Spring Boot API (`api/`) and React admin (`admin/`). Phase 1: staff auth, audit log, catalog (categories, brands,
products, variants, volume tiers, images) and inventory for sausages, cold cuts, pickles, sauces, breads, chips, and canned goods.

## Prerequisites

- Java 17 (Maven wrapper included, no system Maven needed)
- Node 22+ with npm. On some machines `node` on PATH is a symlink into another app's bundle (for example
  `/opt/homebrew/bin/node` pointing into ChatGPT.app) and cannot load Vite's native binding
  ("Cannot find native binding"). Install a standard Node (nodejs.org, nvm or Homebrew `node`) and put it first on PATH.

## Run (development)

API (port 8080), with an embedded PostgreSQL 16 on port 5433 (data in `api/.devdb`, no Docker needed):

    cd api && ./mvnw -q spring-boot:test-run

The `dev` profile applies the dev seed (`api/src/main/resources/db/dev`: categories, brands, 3 products with variants,
tiers and stock) and creates the owner account `owner` / `ChangeMe12345` (mobile `09120000000`).
To reset the dev data, stop the API and delete `api/.devdb`.

Admin (port 5173, proxies `/api` and `/media` to the API):

    cd admin && npm install && npm run dev

Open http://localhost:5173 and log in. Login is two-step: after the password, the SMS code is printed in the **API log**
(`LoggingSmsSender`), not sent anywhere. Copy it from the terminal running the API.

### Alternative: PostgreSQL in Docker

`deploy/docker-compose.dev.yml` starts `postgres:16` on 5432 (db/user/password `pws`, volume `pgdata`) for machines
with Docker. It is an alternative to the embedded database and is not verified in this repository's dev environment;
you must also point the API's datasource at it (`spring.datasource.*`).

    docker compose -f deploy/docker-compose.dev.yml up -d

## Tests

    cd api && ./mvnw -q verify                              # API (embedded Postgres, no Docker)
    cd admin && npx vitest run && npx tsc -b && npx vite build

## Layout

    api/      Spring Boot 3 service (package ir.pws.store); Flyway migrations in src/main/resources/db/migration
    admin/    Vite + React + TypeScript + MUI admin (Persian RTL default, English LTR)
    deploy/   docker-compose.dev.yml
    docs/superpowers/specs/2026-10-25-grocery-deli-store-design.md     deli & grocery store design spec
    docs/superpowers/plans/2026-10-26-grocery-deli-alignment.md        catalog alignment plan
