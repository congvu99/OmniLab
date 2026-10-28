#!/usr/bin/env bash
# git pull → build 3 image (app + sync + tts, tag = commit) → thay container → đợi / và /api/health đều 200 → lỗi thì quay về bản cũ
# tts (tạo bản nghe) là tuỳ chọn: build hay khởi động tts lỗi chỉ in WARN, giữ container tts cũ, không chặn deploy site.
# Chạy trên VPS bằng user deploy: bash deploy/deploy.sh  (FORCE=1 để build lại cùng commit)
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -z "${OMNILAB_REEXEC:-}" ]; then
  exec 9>/tmp/omnilab-deploy.lock
  flock -n 9 || { echo "deploy khác đang chạy"; exit 1; }
fi

[ -f .env ] || { echo "thiếu .env (cần SITE_URL=https://… và SESSION_SECRET ≥ 32 ký tự)"; exit 1; }
# Giá trị .env như compose đọc: bỏ CR, nháy bao quanh, comment cuối dòng " # …", khoảng trắng thừa.
env_value() {
  { grep -E "^$1=" .env || true; } | tail -n1 | cut -d= -f2- | tr -d '\r' | sed -E \
    -e 's/^"([^"]*)".*$/\1/;t' -e "s/^'([^']*)'.*\$/\1/;t" -e 's/[[:space:]]+#.*$//' -e 's/[[:space:]]+$//'
}
[ -n "$(env_value SITE_URL)" ] || { echo ".env thiếu SITE_URL"; exit 1; }
SECRET=$(env_value SESSION_SECRET || true)
[ "${#SECRET}" -ge 32 ] || { echo ".env: SESSION_SECRET phải dài ≥ 32 ký tự (vd: openssl rand -hex 32)"; exit 1; }
unset SECRET
# Không bắt buộc: thiếu key thì tts vẫn chạy nhưng chỉ dọn dẹp và ngủ, chưa tạo bản nghe. Không in giá trị key.
[ -n "$(env_value GEMINI_API_KEY)" ] || echo "lưu ý: .env chưa có GEMINI_API_KEY, tts sẽ chạy nhưng chưa tạo bản nghe"
# Thư mục audio trên host phải có sẵn và thuộc uid 1000 (cả public/), nếu không Docker tự tạo bằng root và tts
# không ghi được (chỉ thấy EACCES trong log tts). Chỉ cảnh báo, không chặn deploy site.
# Cùng thứ tự compose dùng: biến môi trường shell, rồi file cấu hình, rồi mặc định.
AUDIO_DIR=${OMNILAB_AUDIO_DIR:-$(env_value OMNILAB_AUDIO_DIR)}
AUDIO_DIR=${AUDIO_DIR:-/srv/data/omnilab-audio}
for dir in "$AUDIO_DIR" "$AUDIO_DIR/public"; do
  if [ ! -d "$dir" ] || [ "$(stat -c %u "$dir" 2>/dev/null || true)" != "1000" ]; then
    echo "WARN: $dir chưa có hoặc không thuộc uid 1000, tts sẽ không ghi được bản nghe. Sửa: sudo install -d -o 1000 -g 1000 \"$AUDIO_DIR\" \"$AUDIO_DIR/public\""
    break
  fi
done

SELF_SUM=$(cksum < "$0")
git pull --ff-only
# Script vừa được pull về khác bản đang chạy (bash đọc file cũ qua fd): chạy lại bản mới, một lần.
if [ -z "${OMNILAB_REEXEC:-}" ] && [ "$(cksum < "$0")" != "$SELF_SUM" ]; then
  echo "deploy.sh đã cập nhật, chạy lại bản mới"
  OMNILAB_REEXEC=1 exec bash "$0" "$@"
fi
TAG=$(git rev-parse --short HEAD)
PREV=$(cat .deployed-tag 2>/dev/null || true)
if [ "$TAG" = "$PREV" ] && [ -z "${FORCE:-}" ]; then echo "already at $TAG, nothing to deploy"; exit 0; fi

IMAGE_TAG=$TAG docker compose build app sync
# tts build riêng: lỗi (apk, mạng…) không dừng script; TTS_BUILT quyết định tag/dọn/rollback của tts bên dưới.
TTS_BUILT=0
if IMAGE_TAG=$TAG docker compose build tts; then
  TTS_BUILT=1
else
  echo "WARN: tts build failed, keeping previous tts container"
fi
IMAGE_TAG=$TAG docker compose up -d --no-build app sync
if [ "$TTS_BUILT" = 1 ] && ! IMAGE_TAG=$TAG docker compose up -d --no-build tts; then
  echo "WARN: tts start failed ($TAG), site deploy continues"
  TTS_BUILT=0
fi

# Cổng deploy: "/" (dist thật sự có trong image) VÀ /api/health qua chính app (proxy → sync) đều phải 200.
# wget -q thoát != 0 khi HTTP lỗi, nên "có phản hồi" không đủ để qua.
for _ in $(seq 1 30); do
  if docker compose exec -T app wget -q -O /dev/null http://127.0.0.1:8080/ 2>/dev/null \
    && docker compose exec -T app wget -q -O /dev/null http://127.0.0.1:8080/api/health 2>/dev/null; then
    echo "$TAG" > .deployed-tag
    docker tag "omnilab:$TAG" omnilab:latest
    docker tag "omnilab-sync:$TAG" omnilab-sync:latest
    REPOS="omnilab omnilab-sync"
    # tts không lên được thì container tts cũ còn dùng image cũ: không tag, không dọn image tts nào.
    if [ "$TTS_BUILT" = 1 ]; then
      docker tag "omnilab-tts:$TAG" omnilab-tts:latest
      REPOS="$REPOS omnilab-tts"
    fi
    for repo in $REPOS; do
      docker images "$repo" --format '{{.Tag}}' | grep -vxE "latest|$TAG|${PREV:-none}" \
        | xargs -r -I{} docker rmi "$repo:{}" >/dev/null 2>&1 || true
    done
    echo "deploy ok: $TAG"; exit 0
  fi
  sleep 2
done

# --- Rollback: cố ý KHÔNG set -e, mỗi bước lỗi vẫn phải chạy tiếp bước sau ---
set +e
docker compose logs --tail 60 app sync tts
# tts chỉ bị đụng khi lần này đã thay nó. Quay về omnilab-tts:latest (bản tts cuối cùng qua cổng; cũ hơn PREV nếu lần
# PREV build tts lỗi); chưa có (lần deploy tts đầu) thì dừng tts. Không cần PREV nên chạy cả khi chưa có bản cũ.
if [ "$TTS_BUILT" = 1 ]; then
  if docker image inspect omnilab-tts:latest >/dev/null 2>&1; then
    IMAGE_TAG=latest docker compose up -d --no-build --no-deps tts
  else
    docker compose stop tts
  fi
fi
if [ -n "$PREV" ]; then
  IMAGE_TAG=$PREV docker compose up -d --no-build --no-deps app
  if docker image inspect "omnilab-sync:$PREV" >/dev/null 2>&1; then
    IMAGE_TAG=$PREV docker compose up -d --no-build --no-deps sync
  else
    # Lần deploy sync đầu tiên: chưa có image sync cũ → dừng sync, site tĩnh vẫn chạy (/api/* trả 503).
    docker compose stop sync
  fi
  echo "deploy FAILED ($TAG), rolled back to $PREV"
else
  echo "deploy FAILED ($TAG), chưa có bản cũ để quay về"
fi
exit 1
