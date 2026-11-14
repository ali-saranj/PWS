#!/usr/bin/env bash
# ==============================================================================
# Persian Web Store (PWS) - Production Deployment Script
# Builds Admin SPA, starts Docker containers, and runs live smoke verification
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

echo "=================================================="
echo "    Persian Web Store (PWS) - Deploying Prod      "
echo "=================================================="

# Check for production env file
ENV_FILE="${REPO_ROOT}/deploy/.env.prod"
if [ ! -f "${ENV_FILE}" ]; then
    echo "WARNING: ${ENV_FILE} not found."
    if [ -f "${REPO_ROOT}/deploy/.env.prod.example" ]; then
        echo "Creating default ${ENV_FILE} from example template..."
        cp "${REPO_ROOT}/deploy/.env.prod.example" "${ENV_FILE}"
        echo "PLEASE NOTE: Review ${ENV_FILE} to set your production database and staff passwords."
    else
        echo "ERROR: Missing ${ENV_FILE} and example template." >&2
        exit 1
    fi
fi

# 1. Build Admin SPA statically
echo "==> [1/4] Building Admin SPA assets..."
cd "${REPO_ROOT}/admin"
npm install --no-audit --prefer-offline 2>/dev/null || npm install
npm run build
cd "${REPO_ROOT}"

# 2. Build and launch Docker Compose services
echo "==> [2/4] Starting Docker services (PostgreSQL, Spring API, Next.js Shop, Nginx)..."
COMPOSE_CMD="docker compose"
if ! docker compose version &>/dev/null; then
    COMPOSE_CMD="docker-compose"
fi

${COMPOSE_CMD} -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build --remove-orphans

# Ensure persistent media volume has correct ownership and permissions for the non-root API container user (UID 1001)
echo "==> Ensuring media volume permissions (pws:pws 1001:1001, mode 775)..."
${COMPOSE_CMD} -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod exec -u 0 -T api chown -R pws:pws /media 2>/dev/null || true
${COMPOSE_CMD} -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod exec -u 0 -T api chmod -R u=rwX,g=rwX,o=rX /media 2>/dev/null || true

# 3. Wait for services to become healthy
echo "==> [3/4] Waiting for services to become healthy..."
MAX_ATTEMPTS=30
ATTEMPT=0
HEALTHY=false

while [ "${ATTEMPT}" -lt "${MAX_ATTEMPTS}" ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "Checking service health (attempt ${ATTEMPT}/${MAX_ATTEMPTS})... "
    
    if curl -s -f http://localhost/api/actuator/health | grep -q '"UP"' 2>/dev/null; then
        echo "Core API is UP!"
        HEALTHY=true
        break
    else
        echo "waiting..."
        sleep 3
    fi
done

if [ "${HEALTHY}" = false ]; then
    echo "ERROR: Core API did not become healthy within 90 seconds."
    echo "Checking container logs:"
    ${COMPOSE_CMD} -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod logs --tail=50 api
    exit 1
fi

# 4. Smoke Verification
echo "==> [4/4] Verifying Endpoints..."
echo -n "  Testing Storefront (/)... "
curl -sf -o /dev/null -w "%{http_code}\n" http://localhost/

echo -n "  Testing Admin (/admin/)... "
curl -sf -o /dev/null -w "%{http_code}\n" http://localhost/admin/

echo -n "  Testing API Health (/api/actuator/health)... "
curl -s http://localhost/api/actuator/health
echo ""

echo "--------------------------------------------------"
${COMPOSE_CMD} -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod ps
echo "--------------------------------------------------"
echo "PWS Production Deployment successfully finished!"
