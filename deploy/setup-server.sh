#!/usr/bin/env bash
# ==============================================================================
# Persian Web Store (PWS) - Production Server Bootstrap Script
# Supports AlmaLinux / RHEL / CentOS (EL10) and Ubuntu / Debian
# Configures 4GB Swap, DNS anti-sanction mirror, Container Runtime & Tools
# ==============================================================================

set -euo pipefail

echo "==> [1/6] Verifying Root Privileges..."
if [ "$(id -u)" -ne 0 ]; then
    echo "ERROR: setup-server.sh must be run as root (or with sudo)." >&2
    exit 1
fi

echo "==> [2/6] Configuring Anti-Sanction DNS & NetworkManager..."
# Preserves DNS across network reloads to prevent 403 blocks on Docker Hub & registries
if [ -f /etc/NetworkManager/NetworkManager.conf ]; then
    if ! grep -q 'dns=none' /etc/NetworkManager/NetworkManager.conf; then
        sed -i '/^\[main\]/a dns=none' /etc/NetworkManager/NetworkManager.conf 2>/dev/null || true
    fi
fi
mkdir -p /etc/NetworkManager/conf.d
cat << 'EOF' > /etc/NetworkManager/conf.d/80-podman.conf
[keyfile]
unmanaged-devices=interface-name:podman*;interface-name:veth*
EOF
command -v nmcli &>/dev/null && nmcli general reload || true
cat << 'EOF' > /etc/resolv.conf
nameserver 178.22.122.100
nameserver 185.51.200.2
nameserver 8.8.8.8
EOF

echo "==> [3/6] Configuring 4GB Swap Space..."
SWAP_TOTAL=$(free -m | awk '/^Swap:/ {print $2}')
if [ "${SWAP_TOTAL}" -lt 2000 ]; then
    if [ -f /swapfile ]; then
        swapoff /swapfile 2>/dev/null || true
        rm -f /swapfile
    fi
    echo "Allocating 4GB swapfile..."
    fallocate -l 4G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=4096 status=progress
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile

    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo "Swap space successfully created."
else
    echo "Swap space already present (${SWAP_TOTAL} MB)."
fi

# Set optimal swappiness for 2GB host
sysctl -w vm.swappiness=10
cat << 'EOF' > /etc/sysctl.d/99-pws-swap.conf
vm.swappiness=10
EOF

echo "==> [4/6] Installing Container Runtime & Tools..."
if command -v dnf &>/dev/null; then
    # AlmaLinux / RHEL / CentOS
    echo "Detected Enterprise Linux (dnf). Installing podman, podman-docker, git, nodejs..."
    dnf install -y podman podman-docker curl git nodejs nodejs-npm
    systemctl enable --now podman.socket

    # Install standalone Docker Compose v2 plugin and CLI
    echo "Installing Docker Compose v2..."
    curl -SL https://github.com/docker/compose/releases/download/v2.32.4/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    mkdir -p /usr/local/lib/docker/cli-plugins
    ln -sf /usr/local/bin/docker-compose /usr/local/lib/docker/cli-plugins/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
elif command -v apt-get &>/dev/null; then
    # Debian / Ubuntu
    echo "Detected Debian/Ubuntu (apt). Installing docker, git, nodejs..."
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg git nodejs npm ufw
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc 2>/dev/null || true
    chmod a+r /etc/apt/keyrings/docker.asc 2>/dev/null || true
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin || apt-get install -y docker.io docker-compose
    systemctl enable --now docker
fi

echo "==> [5/6] Configuring Firewall (Ports 22, 80, 443)..."
if command -v firewall-cmd &>/dev/null && systemctl is-active --quiet firewalld; then
    firewall-cmd --permanent --add-service=ssh || true
    firewall-cmd --permanent --add-service=http || true
    firewall-cmd --permanent --add-service=https || true
    firewall-cmd --reload || true
    echo "firewalld rules applied."
elif command -v ufw &>/dev/null; then
    ufw allow 22/tcp || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    ufw --force enable || true
    echo "ufw rules applied."
else
    echo "No active host firewall blocking traffic. Default allow for ports 22, 80, 443."
fi

echo "==> [6/6] Bootstrap Verification Summary:"
echo "--------------------------------------------------"
free -h
echo "--------------------------------------------------"
docker --version 2>/dev/null || podman --version
docker compose version 2>/dev/null || docker-compose version
node -v
git --version
echo "--------------------------------------------------"
echo "Server bootstrap completed successfully!"
