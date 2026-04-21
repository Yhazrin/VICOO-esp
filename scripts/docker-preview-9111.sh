#!/usr/bin/env bash
# 构建 frontend 镜像（含 /admin 静态资源），映射 http://localhost:9111/admin/
# 不启动 mysql/backend，仅验证 Nginx + 静态资源。
set -euo pipefail
cd "$(dirname "$0")/.."
IMAGE="${1:-vicoo-frontend:local}"
PORT="${2:-9111}"
NAME="${3:-vicoo-frontend-preview}"

docker rm -f "$NAME" 2>/dev/null || true
docker build -f deploy/easy/frontend.dockerfile -t "$IMAGE" .
docker run -d --name "$NAME" -p "${PORT}:80" \
  -v "$(pwd)/deploy/easy/nginx.static-local.conf:/etc/nginx/conf.d/vicoo.conf:ro" \
  "$IMAGE"

sleep 1
echo "主页:     http://127.0.0.1:${PORT}/"
echo "管理后台: http://127.0.0.1:${PORT}/admin/"
curl -sf -o /dev/null -w "GET /           → HTTP %{http_code}\n" "http://127.0.0.1:${PORT}/"
curl -sf -o /dev/null -w "GET /admin/     → HTTP %{http_code}\n" "http://127.0.0.1:${PORT}/admin/"
JS=$(curl -sf "http://127.0.0.1:${PORT}/admin/" | sed -n 's/.*src="\([^"]*\.js\)".*/\1/p' | head -1)
curl -sf -o /dev/null -w "GET admin JS   → HTTP %{http_code}  (%{url_effective})\n" "http://127.0.0.1:${PORT}${JS}"
echo "容器: $NAME （docker rm -f $NAME 可删）"
