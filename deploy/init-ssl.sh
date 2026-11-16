#!/usr/bin/env bash
# ==============================================================================
# Persian Web Store (PWS) - Production SSL Initialization & Bootstrap Script
# Solves the initial Nginx "chicken-and-egg" startup problem:
# 1. Creates a temporary self-signed certificate so Nginx can start on port 443
# 2. Boots Nginx to handle ACME challenge on port 80
# 3. Requests production Let's Encrypt certificate via Certbot webroot
# 4. Gracefully reloads Nginx with production TLS certificates
#
# Usage:
#   bash deploy/init-ssl.sh           # Issue real production certificate
#   bash deploy/init-ssl.sh --staging # Test issuance against Let's Encrypt Staging API
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

echo "=================================================="
echo "    Persian Web Store (PWS) - SSL Bootstrap       "
echo "=================================================="

# Check for production env file
ENV_FILE="${REPO_ROOT}/deploy/.env.prod"
if [ ! -f "${ENV_FILE}" ]; then
    echo "ERROR: ${ENV_FILE} not found. Copy deploy/.env.prod.example to deploy/.env.prod first." >&2
    exit 1
fi

DOMAIN="proteinirany.ir"
ALIAS_DOMAIN="www.proteinirany.ir"

# Extract CERTBOT_EMAIL from .env.prod or use default
EMAIL=$(grep -E '^CERTBOT_EMAIL=' "${ENV_FILE}" | cut -d '=' -f2- | tr -d ' "' || true)
if [ -z "${EMAIL}" ]; then
    EMAIL="ali.saranj1384@gmail.com"
fi

STAGING_FLAG=""
if [ "${1:-}" = "--staging" ]; then
    echo "NOTICE: Running in STAGING mode (--staging). Certificate will not be trusted by browsers."
    STAGING_FLAG="--staging"
fi

# Detect compose command
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
    echo "Note: 'init-ssl.sh' must be executed on the remote production server (e.g. 94.184.25.112)" >&2
    echo "where DNS for 'proteinirany.ir' points and the container runtime is installed." >&2
    exit 1
fi

COMPOSE_FILE="deploy/docker-compose.prod.yml"

echo "Domains: ${DOMAIN}, ${ALIAS_DOMAIN}"
echo "Alert Email: ${EMAIL}"
echo "Compose Command: ${COMPOSE_CMD}"
echo ""

# 1. Check if genuine certificate already exists
CERT_EXISTS=false
if ${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" run --rm --entrypoint "test -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem" certbot 2>/dev/null; then
    # Verify it is not a dummy cert (dummy cert has issuer CN=localhost)
    if ${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" run --rm --entrypoint "sh -c 'openssl x509 -in /etc/letsencrypt/live/${DOMAIN}/fullchain.pem -text -noout | grep -q \"CN = localhost\"'" certbot 2>/dev/null; then
        echo "Detected existing temporary dummy certificate. Proceeding with genuine issuance..."
    else
        echo "Genuine TLS certificate already exists for ${DOMAIN}."
        echo "To force re-issuance, remove the certbot_conf volume or run certbot certonly with --force-renewal."
        CERT_EXISTS=true
    fi
fi

if [ "${CERT_EXISTS}" = false ]; then
    echo "==> [1/4] Generating temporary self-signed certificate for initial Nginx boot..."
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" run --rm --entrypoint "sh -c '\
        mkdir -p /etc/letsencrypt/live/${DOMAIN} && \
        openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
            -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
            -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
            -subj \"/CN=localhost\"'" certbot

    echo "==> [2/4] Starting Nginx with temporary certificate..."
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d nginx

    echo "==> [3/4] Requesting Let's Encrypt certificate via Certbot ACME Webroot..."
    # Remove dummy certificate so certbot creates the canonical lineage
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" run --rm --entrypoint "sh -c '\
        rm -rf /etc/letsencrypt/live/${DOMAIN} \
               /etc/letsencrypt/archive/${DOMAIN} \
               /etc/letsencrypt/renewal/${DOMAIN}.conf'" certbot

    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" run --rm --entrypoint "certbot certonly \
        --webroot -w /var/www/certbot \
        -d ${DOMAIN} -d ${ALIAS_DOMAIN} \
        --email ${EMAIL} \
        --rsa-key-size 4096 \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        ${STAGING_FLAG}" certbot

    echo "==> [4/4] Reloading Nginx with production TLS certificate..."
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec nginx nginx -s reload
else
    echo "Starting / updating all production services..."
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d
fi

echo ""
echo "--------------------------------------------------"
echo "SSL Initialization successfully completed!"
echo "Verify in browser: https://${DOMAIN}"
echo "--------------------------------------------------"
