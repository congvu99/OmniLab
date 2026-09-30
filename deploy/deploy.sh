#!/usr/bin/env bash
# git pull → build image (tag = commit) → thay container → đợi trang chủ 200 → lỗi thì quay về bản cũ
# Chạy trên VPS bằng user deploy: bash deploy/deploy.sh  (FORCE=1 để build lại cùng commit)
set -euo pipefail
cd "$(dirname "$0")/.."
exec 9>/tmp/omnilab-deploy.lock
flock -n 9 || { echo "deploy khác đang chạy"; exit 1; }

[ -f .env ] || { echo "thiếu .env (cần SITE_URL=https://…)"; exit 1; }

git pull --ff-only
TAG=$(git rev-parse --short HEAD)
PREV=$(cat .deployed-tag 2>/dev/null || true)
if [ "$TAG" = "$PREV" ] && [ -z "${FORCE:-}" ]; then echo "already at $TAG, nothing to deploy"; exit 0; fi

IMAGE_TAG=$TAG docker compose build app
IMAGE_TAG=$TAG docker compose up -d --no-build

# "/" (không phải /health) để chắc dist thật sự có trong image, không chỉ Caddy sống
for _ in $(seq 1 30); do
  if docker compose exec -T app wget -q -O /dev/null http://127.0.0.1:8080/ 2>/dev/null; then
    echo "$TAG" > .deployed-tag
    docker tag "omnilab:$TAG" omnilab:latest
    docker images omnilab --format '{{.Tag}}' | grep -vxE "latest|$TAG|${PREV:-none}" \
      | xargs -r -I{} docker rmi "omnilab:{}" >/dev/null 2>&1 || true
    echo "deploy ok: $TAG"; exit 0
  fi
  sleep 2
done

docker compose logs --tail 60 app
if [ -n "$PREV" ]; then
  IMAGE_TAG=$PREV docker compose up -d --no-build app
  echo "deploy FAILED ($TAG), rolled back to $PREV"
else
  echo "deploy FAILED ($TAG), chưa có bản cũ để quay về"
fi
exit 1
