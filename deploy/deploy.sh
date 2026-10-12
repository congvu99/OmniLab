#!/usr/bin/env bash
# git pull → build 2 image (app + sync, tag = commit) → thay container → đợi / và /api/health đều 200 → lỗi thì quay về bản cũ
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
IMAGE_TAG=$TAG docker compose up -d --no-build

# Cổng deploy: "/" (dist thật sự có trong image) VÀ /api/health qua chính app (proxy → sync) đều phải 200.
# wget -q thoát != 0 khi HTTP lỗi, nên "có phản hồi" không đủ để qua.
for _ in $(seq 1 30); do
  if docker compose exec -T app wget -q -O /dev/null http://127.0.0.1:8080/ 2>/dev/null \
    && docker compose exec -T app wget -q -O /dev/null http://127.0.0.1:8080/api/health 2>/dev/null; then
    echo "$TAG" > .deployed-tag
    docker tag "omnilab:$TAG" omnilab:latest
    docker tag "omnilab-sync:$TAG" omnilab-sync:latest
    for repo in omnilab omnilab-sync; do
      docker images "$repo" --format '{{.Tag}}' | grep -vxE "latest|$TAG|${PREV:-none}" \
        | xargs -r -I{} docker rmi "$repo:{}" >/dev/null 2>&1 || true
    done
    echo "deploy ok: $TAG"; exit 0
  fi
  sleep 2
done

# --- Rollback: cố ý KHÔNG set -e, mỗi bước lỗi vẫn phải chạy tiếp bước sau ---
set +e
docker compose logs --tail 60 app sync
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
