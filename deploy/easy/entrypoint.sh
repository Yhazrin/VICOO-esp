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

echo "Database ready. Starting VICOO API..."

# Run uvicorn
exec python -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 2 \
    --log-level info \
    --proxy-headers
