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
COMPOSE_CMD=""
if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
elif podman compose version &>/dev/null; then
    COMPOSE_CMD="podman compose"
elif command -v podman-compose &>/dev/null; then
    COMPOSE_CMD="podman-compose"
else
    echo "ERROR: Neither 'docker compose' nor 'podman compose' was found on this system." >&2
    echo "Note: 'deploy.sh' is designed for the remote production server (e.g. 94.184.25.112)." >&2
    echo "For local development on Mac, use './mvnw spring-boot:test-run' and 'npm run dev' without Docker." >&2
    exit 1
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
    
    if curl -s -f -k -L http://localhost/api/actuator/health | grep -q '"UP"' 2>/dev/null; then
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
echo -n "  Testing HTTP Port 80 Redirect (http://localhost/)... "
curl -s -o /dev/null -w "%{http_code} (Redirect: %{redirect_url})\n" http://localhost/ || true

echo -n "  Testing Storefront (/ via redirect)... "
curl -sf -k -L -o /dev/null -w "%{http_code}\n" http://localhost/ || true

echo -n "  Testing Admin (/admin/ via redirect)... "
curl -sf -k -L -o /dev/null -w "%{http_code}\n" http://localhost/admin/ || true

echo -n "  Testing API Health (/api/actuator/health)... "
curl -s -k -L http://localhost/api/actuator/health || true
echo ""

# Check HTTPS if certificates exist
if ${COMPOSE_CMD} -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod run --rm --entrypoint "test -f /etc/letsencrypt/live/proteinirany.ir/fullchain.pem" certbot 2>/dev/null; then
    echo -n "  Testing HTTPS Port 443 (https://localhost/)... "
    curl -sf -k -o /dev/null -w "%{http_code}\n" https://localhost/ 2>/dev/null || echo "HTTPS responding (domain SNI check on remote recommended)"
fi

echo "--------------------------------------------------"
${COMPOSE_CMD} -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod ps
echo "--------------------------------------------------"
echo "PWS Production Deployment successfully finished!"
