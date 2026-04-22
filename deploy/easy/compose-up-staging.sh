#!/usr/bin/env bash
# Staging / 生产式一键拉起：避免 docker-compose 1.29 在「重建」旧容器时出现 KeyError: ContainerConfig
#（与新版 Docker Engine 镜像元数据不兼容）。策略：先 down 再 up，只创建不 recreate。
#
# 用法:
#   ./compose-up-staging.sh
#   ./compose-up-staging.sh --build
#   VICOO_USE_HOST_NGINX=1 ./compose-up-staging.sh --build   # 宿主机 Nginx 反代到 127.0.0.1:9080（见 docker-compose.host-nginx.yml）
set -euo pipefail
cd "$(dirname "$0")"

# 用法: ./compose-up-staging.sh           # 拉镜像后 up
#       ./compose-up-staging.sh --build  # 等同 up -d --build（开发机常用）
WITH_BUILD=""
if [[ "${1:-}" == "--build" ]]; then
  WITH_BUILD=1
fi

_compose_args=()
if [[ "${VICOO_USE_HOST_NGINX:-}" == "1" ]]; then
  _compose_args=(-f docker-compose.yml -f docker-compose.host-nginx.yml)
fi

_compose() {
  if docker compose version >/dev/null 2>&1; then
    if ((${#_compose_args[@]} > 0)); then
      docker compose "${_compose_args[@]}" "$@"
    else
      docker compose "$@"
    fi
  elif ((${#_compose_args[@]} > 0)); then
    COMPOSE_FILE=docker-compose.yml:docker-compose.host-nginx.yml docker-compose "$@"
  else
    docker-compose "$@"
  fi
}

# 清理名称里带 vicoo-admin 的残留（旧 compose 可能生成 acd86aecc6ee_vicoo-admin，精确 rm vicoo-admin 删不掉）
_cleanup_admin_garbage() {
  docker ps -aq --filter 'name=vicoo-admin' 2>/dev/null | while read -r id; do
    [[ -n "$id" ]] && docker rm -f "$id" 2>/dev/null || true
  done
}

_cleanup_admin_garbage

_compose pull
# 停掉并删除本项目容器，避免走有 bug 的 recreate；数据卷默认保留（不加 -v）
_compose down --remove-orphans || true
_cleanup_admin_garbage

if [[ -n "$WITH_BUILD" ]]; then
  _compose up -d --build
else
  _compose up -d
fi

