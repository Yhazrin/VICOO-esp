#!/usr/bin/env bash
# 录制 Cursor Cloud Agent 云电脑真实桌面操作视频（X11 屏幕捕获 + 可见 Chrome）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/artifacts/cloud-screencast"
mkdir -p "$OUT_DIR"

export DISPLAY="${DISPLAY:-:1}"
SIZE="${SCREENCAST_SIZE:-1920x1200}"
FPS="${SCREENCAST_FPS:-24}"
RAW="$OUT_DIR/desktop-raw.mp4"
FINAL="$OUT_DIR/vicoo-cloud-agent-demo.mp4"

echo "==> 检查服务"
for url in \
  "http://127.0.0.1:8000/api/v1/health" \
  "http://127.0.0.1:9111/" \
  "http://127.0.0.1:5173/admin/"; do
  curl -sf "$url" >/dev/null || { echo "服务未就绪: $url"; exit 1; }
done

echo "==> 启动桌面录屏 ($DISPLAY, $SIZE)"
ffmpeg -y \
  -f x11grab -video_size "$SIZE" -framerate "$FPS" -i "$DISPLAY.0" \
  -c:v libx264 -preset ultrafast -pix_fmt yuv420p \
  "$RAW" &
FFMPEG_PID=$!

cleanup() {
  kill "$FFMPEG_PID" 2>/dev/null || true
  wait "$FFMPEG_PID" 2>/dev/null || true
}
trap cleanup EXIT

sleep 2

echo "==> 打开终端展示服务状态"
DISPLAY="$DISPLAY" xfce4-terminal \
  --title="VICOO Cloud Agent" \
  --geometry=110x28+40+40 \
  -e "bash -lc '
    echo \"=== VICOO 云端环境 ===\"
    echo \"时间: \$(date -Iseconds)\"
    echo
    echo \"--- API 健康 ---\"
    curl -s http://127.0.0.1:8000/api/v1/health | python3 -m json.tool
    echo
    echo \"--- 公益商品数量 ---\"
    curl -s \"http://127.0.0.1:8000/api/v1/products?is_impact_product=true\" | python3 -c \"import sys,json;d=json.load(sys.stdin);print(len(d.get(\\\"data\\\",[])), \\\"件\\\")\"
    echo
    echo \"--- 运行中的 tmux 会话 ---\"
    tmux -f /exec-daemon/tmux.portal.conf ls 2>/dev/null || echo \"(tmux)\"
    sleep 12
  '" &
TERM_PID=$!
sleep 4

echo "==> 启动可见 Chrome 自动演示"
cd "$ROOT/frontend/web-react"
DISPLAY="$DISPLAY" npx playwright test e2e/cloud-desktop-demo.spec.ts \
  --config=playwright.cloud-desktop.config.ts

sleep 2
kill "$TERM_PID" 2>/dev/null || true
pkill -f "xfce4-terminal.*VICOO Cloud Agent" 2>/dev/null || true

echo "==> 停止录屏并转码"
kill -INT "$FFMPEG_PID" 2>/dev/null || true
wait "$FFMPEG_PID" 2>/dev/null || true
trap - EXIT

ffmpeg -y -i "$RAW" \
  -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -movflags +faststart \
  "$FINAL" 2>/dev/null

DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL" 2>/dev/null || echo "?")
echo "完成: $FINAL (${DUR}s)"
