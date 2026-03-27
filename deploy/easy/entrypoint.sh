#!/bin/bash
# ============================================
# VICOO — Backend Entrypoint Script
# Waits for MySQL, creates DB tables, seeds data
# ============================================

set -e

echo "Waiting for MySQL to be ready..."

# Wait for MySQL to accept connections
MAX_RETRIES=30
RETRY_INTERVAL=2
retries=0

until mysql -h"${MYSQL_HOST:-mysql}" -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" -e "SELECT 1" &>/dev/null; do
    retries=$((retries + 1))
    if [ $retries -ge $MAX_RETRIES ]; then
        echo "ERROR: MySQL did not become ready in time."
        exit 1
    fi
    echo "MySQL not ready yet (attempt $retries/$MAX_RETRIES)... waiting ${RETRY_INTERVAL}s"
    sleep $RETRY_INTERVAL
done

echo "MySQL is ready!"

# Create database if it doesn't exist
mysql -h"${MYSQL_HOST:-mysql}" -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" -e \
    "CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" \
    2>/dev/null || echo "Database creation skipped (may already exist or permission denied)"

echo "Database ready. Starting VICOO API..."

# Run uvicorn
exec python -m uvicorn backend.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 2 \
    --log-level info \
    --proxy-headers
