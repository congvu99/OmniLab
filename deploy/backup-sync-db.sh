#!/usr/bin/env bash
# Backup SQLite của sidecar sync: VACUUM INTO /data/backups/omnilab-YYYY-MM-DD.db, giữ 14 ngày.
# Chạy trong container (cùng uid với DB nên không lỗi quyền). Cron user deploy, 03:15:
#   15 3 * * * cd /srv/apps/omnilab && bash deploy/backup-sync-db.sh >> $HOME/omnilab-backup.log 2>&1
# Khuyến nghị: rclone copy /srv/data/omnilab/backups <remote>: để có bản ngoài VPS.
set -euo pipefail
cd "$(dirname "$0")/.."
echo "[$(date -u +%FT%TZ)] backup start"
docker compose exec -T sync node server/sync/sync-server-entry.ts --backup
