#!/bin/bash
set -e

# ── Docker ──
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker

# ── Traefik network ──
docker network create traefik 2>/dev/null || true

# ── Clone repo ──
# Requires: GH_TOKEN env var set before running, e.g.:
#   GH_TOKEN=ghp_xxx bash setup.sh
if [ -z "$GH_TOKEN" ]; then
  echo "ERROR: set GH_TOKEN=<your_github_token> before running"
  exit 1
fi

mkdir -p /opt/vstep
git clone "https://${GH_TOKEN}@github.com/nghyane/VSTEP.git" /opt/vstep || \
  (cd /opt/vstep && git pull)

# ── Production env ──
if [ ! -f /opt/vstep/.env ]; then
  cp /opt/vstep/.env.production.example /opt/vstep/.env
  echo ""
  echo "⚠  Edit /opt/vstep/.env and fill in:"
  echo "   DOMAIN, FRONTEND_DOMAIN, ACME_EMAIL, S3_* keys"
  echo "   Then run: cd /opt/vstep && docker compose --env-file .env up -d"
else
  echo ".env already exists, skipping"
fi

echo ""
echo "✓ Done. Next steps:"
echo "  1. Edit /opt/vstep/.env"
echo "  2. Point DNS: api.vstepgo.com → 5.223.87.142"
echo "  3. cd /opt/vstep && docker compose --env-file .env up -d"
