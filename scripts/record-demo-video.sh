#!/usr/bin/env bash
# 云端/本地：启动验证并录制 VICOO 用户文档功能演示视频
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/artifacts/demo-video"
mkdir -p "$OUT_DIR"

echo "==> 检查服务..."
for url in \
  "http://127.0.0.1:8000/api/v1/health" \
  "http://127.0.0.1:9111/" \
  "http://127.0.0.1:5173/admin/"; do
  curl -sf "$url" >/dev/null || {
    echo "服务未就绪: $url"
    echo "请先启动 backend(8000)、frontend(9111)、admin(5173)"
    exit 1
  }
done
echo "    全部服务正常"

echo "==> Playwright 录屏..."
cd "$ROOT/frontend/web-react"
npm run demo:video

RESULT_DIR="$(find "$OUT_DIR/test-results" -mindepth 1 -maxdepth 1 -type d | head -1)"
if [[ -z "$RESULT_DIR" ]]; then
  echo "未找到录屏目录"
  exit 1
fi

CONCAT_LIST="$OUT_DIR/concat-list.txt"
: > "$CONCAT_LIST"
for f in "$RESULT_DIR"/video*.webm; do
  [[ -f "$f" ]] || continue
  echo "file '$f'" >> "$CONCAT_LIST"
done

FULL_WEBM="$OUT_DIR/vicoo-demo-full.webm"
MP4="$OUT_DIR/vicoo-demo.mp4"
echo "==> 合并分段录屏"
ffmpeg -y -f concat -safe 0 -i "$CONCAT_LIST" -c copy "$FULL_WEBM" 2>/dev/null
echo "==> 转码为 MP4: $MP4"
ffmpeg -y -i "$FULL_WEBM" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -movflags +faststart "$MP4" 2>/dev/null

echo "完成:"
echo "  WebM: $FULL_WEBM"
echo "  MP4:  $MP4"
