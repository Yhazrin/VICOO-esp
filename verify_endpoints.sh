#!/bin/bash
# API 路径验证脚本 (简化路径版)

BASE_URL="http://localhost"

echo "Checking simplified API endpoints (without v1)..."

# 1. 验证简化后的路径 (预期 422 或 401, 不应是 404)
PATH_TO_CHECK="/api/auth/login"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}${PATH_TO_CHECK}")
echo "POST ${PATH_TO_CHECK} -> Status: ${STATUS} (Expected: !404)"

if [ "$STATUS" == "404" ]; then
    echo "ERROR: Backend is still returning 404 at /api. Check if backend container is running and main.py is correctly reloaded."
else
    echo "SUCCESS: /api endpoint is alive and responding."
fi
