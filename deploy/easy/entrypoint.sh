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
mysql -h"${MYSQL_HOST:-mysql}" -u"${MYSQL_ROOT_USER:-root}" -p"${MYSQL_ROOT_PASSWORD}" --skip-ssl -e \
    "CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" \
    2>/dev/null || echo "Database creation skipped (may already exist)"

# Create app user with privileges if it doesn't exist
mysql -h"${MYSQL_HOST:-mysql}" -u"${MYSQL_ROOT_USER:-root}" -p"${MYSQL_ROOT_PASSWORD}" --skip-ssl -e \
    "CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}'; \
     GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'%'; \
     FLUSH PRIVILEGES;" \
    2>/dev/null || echo "App user creation skipped (may already exist)"

echo "Database ready. Running Alembic migrations..."

# Run Alembic migrations (alembic.ini is in backend directory)
cd /app/backend
python -m alembic upgrade head

echo "Migrations complete."

# 空库时在本进程先灌演示数据，再启动 uvicorn —— 避免 lifespan 里长时间 seed 导致健康检查连不上 :8000
# （lifespan 仍会检测到已有用户并跳过 seed，兼容本地非 Docker 启动）
echo "Checking demo seed..."
UVICORN_RELOAD="${UVICORN_RELOAD:-0}"
python - <<'PY'
import asyncio
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User
from app.config import settings

async def maybe_seed():
    want = settings.APP_ENV == "development" or getattr(settings, "SEED_IF_EMPTY", False)
    if not want:
        print("Skip seed (APP_ENV/SEED_IF_EMPTY).")
        return
    async with AsyncSessionLocal() as session:
        r = await session.execute(select(User))
        if r.scalars().first() is not None:
            print("Skip seed (users already exist).")
            return
    print("Running demo seed before uvicorn...")
    from app.seed import seed
    await seed()

asyncio.run(maybe_seed())
PY

# Reset seed user credentials on every deployment (in case testers changed passwords)
echo "Resetting seed user credentials..."
cd /app/backend
python - <<'PY'
import asyncio
from app.seed import reset_seed_users
asyncio.run(reset_seed_users())
PY

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
