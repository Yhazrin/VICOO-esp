#!/bin/bash
# ============================================
# VICOO — Backend Entrypoint Script
# Waits for MySQL, creates DB tables, seeds data
# ============================================

set -e

echo "Waiting for MySQL to be ready..."

# Wait for MySQL to accept connections (use root user since app user may not exist yet)
MAX_RETRIES=30
RETRY_INTERVAL=2
retries=0

until mysql -h"${MYSQL_HOST:-mysql}" -u"${MYSQL_ROOT_USER:-root}" -p"${MYSQL_ROOT_PASSWORD}" --skip-ssl -e "SELECT 1" &>/dev/null; do
    retries=$((retries + 1))
    if [ $retries -ge $MAX_RETRIES ]; then
        echo "ERROR: MySQL did not become ready in time."
        exit 1
    fi
    echo "MySQL not ready yet (attempt $retries/$MAX_RETRIES)... waiting ${RETRY_INTERVAL}s"
    sleep $RETRY_INTERVAL
done

echo "MySQL is ready!"

# Create database and app user if they don't exist
# Use IF NOT EXISTS so idempotent; capture real errors vs. "already exists"
db_output=$(mysql -h"${MYSQL_HOST:-mysql}" -u"${MYSQL_ROOT_USER:-root}" -p"${MYSQL_ROOT_PASSWORD}" --skip-ssl -e \
    "CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1) || {
    echo "ERROR: Database creation failed: $db_output" >&2
    exit 1
}

# Create app user with privileges if it doesn't exist
user_output=$(mysql -h"${MYSQL_HOST:-mysql}" -u"${MYSQL_ROOT_USER:-root}" -p"${MYSQL_ROOT_PASSWORD}" --skip-ssl -e \
    "CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}'; \
     GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'%'; \
     FLUSH PRIVILEGES;" 2>&1) || {
    echo "ERROR: App user creation failed: $user_output" >&2
    exit 1
}

echo "Database ready. Running Alembic migrations..."

# Run Alembic migrations (alembic.ini is in backend directory)
cd /app/backend
python -m alembic upgrade head

echo "Migrations complete."

# One-shot seed guard: /data/.seed_v1 marker file
# When the marker is present, skip auto-seed entirely (subsequent
# deployments must NOT re-seed). To force a re-seed:
#   1. Delete the marker
#   2. Run `python -m app.scripts.full_reseed` inside the container
#   3. Re-create the marker: `touch /data/.seed_v1`
SEED_MARKER="${SEED_MARKER:-/data/.seed_v1}"

if [ -f "$SEED_MARKER" ]; then
    echo "Seed marker present ($SEED_MARKER) — skipping demo seed."
else
    echo "No seed marker found. Running first-time demo seed..."
    UVICORN_RELOAD="${UVICORN_RELOAD:-0}"
    python - <<'PY'
import asyncio

from app.seed import maybe_seed_demo

asyncio.run(maybe_seed_demo())
PY

    # Reset seed user credentials (tester-proofing)
    echo "Resetting seed user credentials..."
    cd /app/backend
    python - <<'PY'
import asyncio
from app.seed import reset_seed_users
asyncio.run(reset_seed_users())
PY

    # Backfill rainbow fish trace photos
    echo "Backfilling rainbow fish trace photos..."
    cd /app/backend
    python - <<'PY'
import asyncio

from app.backfill_rainbow_fish_gallery import main

asyncio.run(main())
PY

    # Stamp the marker so this block never runs again
    mkdir -p "$(dirname "$SEED_MARKER")"
    echo "Stamping seed marker at $SEED_MARKER"
    date -u +"%Y-%m-%dT%H:%M:%SZ" > "$SEED_MARKER"
fi

echo "Starting VICOO API..."

# Docker 内默认关 reload（父进程 watchfiles + 长事务 seed 易放大启动问题）；本地热更新可设 UVICORN_RELOAD=1
if [ "${APP_ENV}" = "development" ] && [ "${UVICORN_RELOAD}" = "1" ]; then
    exec python -m uvicorn app.main:app \
        --host 0.0.0.0 \
        --port 8000 \
        --reload \
        --log-level debug \
        --proxy-headers
elif [ "${APP_ENV}" = "development" ]; then
    exec python -m uvicorn app.main:app \
        --host 0.0.0.0 \
        --port 8000 \
        --log-level debug \
        --proxy-headers
else
    exec python -m uvicorn app.main:app \
        --host 0.0.0.0 \
        --port 8000 \
        --workers 2 \
        --log-level info \
        --proxy-headers
fi
