#!/bin/bash
# ============================================================
# EHN One - Production Deployment Script
# Run on VPS as deploy user
# Pattern: timestamped releases + symlink flip + health check
# ============================================================
set -euo pipefail

APP_DIR="/var/www/ehnone"
SHARED_DIR="$APP_DIR/shared"
CURRENT_LINK="$APP_DIR/current"
LOG_FILE="$APP_DIR/logs/deploy.log"
HEALTH_URL="http://127.0.0.1:4100/health"
PREVIOUS_RELEASE=""

# Accept release dir as argument (from CI/CD) or create one
if [ -n "${1:-}" ] && [ -d "$1" ]; then
  RELEASE_DIR="$1"
else
  RELEASE_DIR="$APP_DIR/releases/$(date +%Y%m%d_%H%M%S)"
fi

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }
die() { log "FATAL: $1"; exit 1; }

log "=== EHN One Deployment Started ==="

# 1. Record current release for rollback
if [ -L "$CURRENT_LINK" ]; then
  PREVIOUS_RELEASE=$(readlink -f "$CURRENT_LINK")
  log "Previous release: $PREVIOUS_RELEASE"
fi

# 2. Create shared directory for persistent files
mkdir -p "$SHARED_DIR"/{logs,uploads}
mkdir -p "$APP_DIR/logs"

# 3. Create new release directory (if not already created by CI)
mkdir -p "$RELEASE_DIR"
log "Release: $RELEASE_DIR"

# 4. Build frontend (if package.json exists but no build/)
if [ -f "$RELEASE_DIR/frontend/package.json" ] && [ ! -d "$RELEASE_DIR/frontend/build" ]; then
  log "Building frontend..."
  cd "$RELEASE_DIR/frontend"
  npm ci --ignore-scripts 2>/dev/null || npm install --legacy-peer-deps
  NODE_OPTIONS=--openssl-legacy-provider REACT_APP_API_URL=/api CI=false npm run build
  rm -rf node_modules
fi

# 5. Install backend production dependencies
if [ -f "$RELEASE_DIR/backend/package.json" ]; then
  log "Installing backend dependencies..."
  cd "$RELEASE_DIR/backend"
  npm ci --omit=dev 2>/dev/null || npm install --omit=dev
fi

# 6. Link shared .env file
if [ -f "$SHARED_DIR/.env" ]; then
  ln -sf "$SHARED_DIR/.env" "$RELEASE_DIR/backend/.env"
  log "Linked shared .env"
elif [ -f "$RELEASE_DIR/backend/.env" ]; then
  cp "$RELEASE_DIR/backend/.env" "$SHARED_DIR/.env"
  log "Created shared .env from release"
else
  die "No .env file found"
fi

# 7. Generate self-signed SSL if needed
if [ ! -f /etc/nginx/ssl/ehnone-selfsigned.crt ]; then
  log "Generating self-signed SSL..."
  mkdir -p /etc/nginx/ssl
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/ehnone-selfsigned.key \
    -out /etc/nginx/ssl/ehnone-selfsigned.crt \
    -subj "/CN=admin.kedvasshygieneproducts.com/O=EHN/C=IN" 2>/dev/null
fi

# 8. Deploy Nginx config (only touch ehnone, never touch other sites)
if [ -f "$RELEASE_DIR/nginx/ehnone.conf" ]; then
  cp "$RELEASE_DIR/nginx/ehnone.conf" /etc/nginx/sites-available/ehnone
  ln -sf /etc/nginx/sites-available/ehnone /etc/nginx/sites-enabled/zz-ehnone
  if nginx -t 2>/dev/null; then
    systemctl reload nginx
    log "Nginx config deployed and reloaded"
  else
    log "WARNING: Nginx config test failed, skipping reload"
  fi
fi

# 9. Health check current version before switching
if [ -L "$CURRENT_LINK" ]; then
  log "Checking current version health before switch..."
  if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
    log "Current version healthy"
  else
    log "WARNING: Current version unhealthy, proceeding anyway"
  fi
fi

# 10. Atomic symlink switch
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
log "Symlink switched to new release"

# 11. Restart PM2 with zero-downtime reload
cd "$CURRENT_LINK"
if pm2 describe ehnone-api > /dev/null 2>&1; then
  log "Reloading PM2 (zero-downtime)..."
  pm2 reload ecosystem.config.js --env production --update-env
else
  log "Starting PM2 (first deploy)..."
  pm2 start ecosystem.config.js --env production
fi
pm2 save
log "PM2 process updated"

# 12. Wait for health check
log "Waiting for health check..."
sleep 5
HEALTH_OK=false
for i in $(seq 1 15); do
  if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
    log "Health check passed on attempt $i"
    HEALTH_OK=true
    break
  fi
  sleep 2
done

# 13. Rollback if health check fails
if [ "$HEALTH_OK" = false ]; then
  log "HEALTH CHECK FAILED - Rolling back..."
  if [ -n "$PREVIOUS_RELEASE" ] && [ -d "$PREVIOUS_RELEASE" ]; then
    ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
    cd "$CURRENT_LINK"
    pm2 reload ecosystem.config.js --env production --update-env
    pm2 save
    log "Rolled back to $PREVIOUS_RELEASE"
    die "Deployment failed, rolled back successfully"
  else
    die "Deployment failed, no previous release to rollback to"
  fi
fi

# 14. Setup logrotate
cat > /etc/logrotate.d/ehnone << 'LOGROTATE'
/var/www/ehnone/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
LOGROTATE

# 15. Cleanup old releases (keep last 5)
ls -dt "$APP_DIR/releases"/*/ 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
log "Cleaned up old releases"

# 16. Record deployed version
echo "$(date -Iseconds) | $(git -C "$RELEASE_DIR" rev-parse --short HEAD 2>/dev/null || echo 'unknown') | $RELEASE_DIR" >> "$APP_DIR/deployments.log"

log "=== Deployment Complete ==="
log "Admin Panel: https://admin.kedvasshygieneproducts.com"
log "Health:      https://admin.kedvasshygieneproducts.com/health"
