#!/usr/bin/env bash
# 在「已能 ssh 登录」的前提下，在远端项目目录执行活动补种。
# 用法（本机已 ssh-copy-id 到服务器时）:
#   export VICOO_SSH=ubuntu@152.136.203.160
#   export VICOO_REMOTE_DIR=/opt/VICOO-esp   # 按你服务器上的实际路径改
#   ./deploy/easy/remote-exec-add-campaigns.sh
set -euo pipefail
: "${VICOO_SSH:?设 VICOO_SSH=ubuntu@你的IP（或你的登录用户@主机）}"
: "${VICOO_REMOTE_DIR:?设 VICOO_REMOTE_DIR=服务器上仓库根目录 如 /opt/VICOO-esp}"
ssh -o ConnectTimeout=20 "$VICOO_SSH" bash -s <<REMOTE
set -euo pipefail
cd "$VICOO_REMOTE_DIR/deploy/easy" || { echo "目录不存在: $VICOO_REMOTE_DIR/deploy/easy"; exit 1; }
docker compose -f docker-compose.yml -f docker-compose.host-nginx.yml ps >/dev/null 2>&1 && \\
  docker compose -f docker-compose.yml -f docker-compose.host-nginx.yml exec -T backend python -m app.add_campaigns_demo || \\
  (echo "未检测到 host-nginx compose 栈，可改为进入 backend 容器或本地 venv 后执行: python -m app.add_campaigns_demo" && exit 1)
REMOTE
echo "完成。"
