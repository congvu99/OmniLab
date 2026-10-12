# Phase 05 impl report (infra, deploy, backup)

Worktree D:/project/OmniLab-progress-sync (feat/progress-sync), uncommitted.

## Files
- MOD Caddyfile: `handle /api/* { reverse_proxy omnilab-sync:3000 { transport http { dial_timeout 2s } } }`; `@notHashed` = `not path /_astro/* /api/*`; `handle_errors` split: `@api path /api/*` -> `no-store` + `application/json` + `respond` 503 `{"code":"unavailable"}` (placeholder opener escaped as `\{`), else old `rewrite /{err.status_code}.html` + file_server. CSP threat-model comment rewritten (session cookie, username, script-src 'self', unsafe-inline style justified by textContent). CSP value unchanged.
- MOD Dockerfile: stages `build`, `app` (was unnamed caddy stage), new `sync` (`node:24.15-alpine`; copies package.json, server/sync, src/lib/progress-state.ts, progress-merge.ts, progress-sync-types.ts; USER node; /data chowned node; CMD node server/sync/sync-server-entry.ts). Sync stage copies from build context (not from `build`), so `--target sync` needs no SITE_URL. Runtime imports checked transitively: only those 3 src/lib files + node: builtins.
- MOD compose.yml: `app` target app, networks web(alias omnilab)+internal, depends_on sync service_started; `sync` target sync, image omnilab-sync:${IMAGE_TAG:-latest}, only `internal` (internal: true, alias omnilab-sync), no ports, read_only, tmpfs /tmp, bind `${OMNILAB_DATA_DIR:-/srv/data/omnilab}:/data`, SESSION_SECRET `:?`, healthcheck wget /api/health, mem_limit 192m.
- MOD deploy/deploy.sh: env check (SITE_URL, SESSION_SECRET >= 32, quotes stripped), build `app sync`, gate `/` AND `/api/health` via app (wget -q => non-2xx fails), tag+prune latest for both repos (keep TAG, PREV), rollback after `set +e`: app->PREV `--no-deps`; sync->PREV if image exists else `compose stop sync`.
- NEW deploy/backup-sync-db.sh: `docker compose exec -T sync node server/sync/sync-server-entry.ts --backup`; cron line in header comment.
- NEW server/sync/sync-backup.ts (5th sidecar file): `backupFileName`, `runBackup(dataDir, now)`, `backupMain(env)` (exit code). Fails if omnilab.db missing (no empty DB created), mkdir backups, rm same-day target, `VACUUM INTO`, prune `omnilab-YYYY-MM-DD.db` with mtime > 14d (other files untouched). Uses DATA_DIR (default /data); needs no SESSION_SECRET.
- MOD server/sync/sync-server-entry.ts (199 -> 198 lines): one-line `--backup` dispatch before config; merged duplicate type imports to make room.
- NEW tests/sync-backup.test.mjs (7 tests).
- MOD .dockerignore (+data, .data, *.db, *.db-*), .gitignore (+*.db, *.db-*).

## Verified locally
- TDD: test red (module missing) then 7 green: dated name, snapshot has data, twice same day (second sees new row), prune (20d gone, 7d kept, unrelated txt kept), restore procedure (rm wal/shm, copy backup -> alice present, post-backup carol absent), CLI `--backup` via DATA_DIR with only PATH env (exit 0, "backup ok <path>"), CLI on empty dir -> non-zero, no db created.
- Gates: `pnpm test` 22 files / 461 tests, `pnpm check` 0/0/0, `pnpm check:server` clean, `pnpm build` 73 pages.
- REAL Caddy 2.10.2 (windows binary in scratchpad) against built dist:
  - `caddy validate` OK on new Caddyfile.
  - Header capture (gzip) of `/`, a lesson page, `/_astro/*.css`, unknown 404, `/health`, `/favicon.svg`: before vs after diff EMPTY.
  - Host `omnilab-sync` unresolvable (Railpack case): Caddy starts; GET /api/me and POST /api/x -> 503, `Cache-Control: no-store`, `Content-Type: application/json`, body exactly `{"code":"unavailable"}`.
  - With real sidecar on 127.0.0.1:3000 (temp Caddyfile swapping host only): /api/health 200 JSON no-store passed through, `/` 200.
- deploy.sh: `bash -n` OK both scripts. Control flow run with stubbed git/docker/flock/sleep: short SESSION_SECRET rejected; gate failing with PREV and no prev sync image -> `up --no-deps app` at PREV, `image inspect`, `compose stop sync`, "rolled back to <PREV>"; prev sync image present -> sync `up --no-deps` at PREV; no PREV -> "chưa có bản cũ". Stubs exercise control flow only, not Docker.

## Deferred (no docker/shellcheck here)
Dockerfile build, `docker compose config`, networks, ss, real rollback, container backup/restore, cron. shellcheck not run (only bash -n). Checklist below.

## VPS checklist (user deploy, repo dir)
0. Prep once: `sudo mkdir -p /srv/data/omnilab && sudo chown 1000:1000 /srv/data/omnilab`; `.env` has SITE_URL and `SESSION_SECRET=$(openssl rand -hex 32)`; optional OMNILAB_DATA_DIR.
1. Baseline BEFORE deploy (old stack up): for p in `/`, `/hoc/kien-truc/bai-tap/mint`, `/_astro/<file>.css`, `/khong-co`, `/health`: `curl -sI -H 'Accept-Encoding: gzip' https://SITE$p | grep -vi '^date\|^etag\|^last-mod' > base-N.txt`. Repeat after deploy; `diff` must be empty.
2. `docker compose config`: sync has `target: sync`, networks only `internal`, NO `ports`, volume `/srv/data/omnilab:/data`, mem_limit 201326592; app networks web+internal, depends_on sync service_started. Unset SESSION_SECRET -> error "SESSION_SECRET chưa đặt".
3. `bash deploy/deploy.sh` -> "deploy ok: <tag>". `docker compose ps`: sync healthy, app up.
4. `docker network inspect web --format '{{range .Containers}}{{.Name}} {{end}}'` contains app, NOT sync. `docker network inspect omnilab_internal --format '{{.Internal}}'` -> true. `sudo ss -tlnp | grep -E ':3000\b'` -> empty. `docker inspect <sync> --format '{{.HostConfig.ReadonlyRootfs}} {{.Config.User}}'` -> `true node`; `docker compose exec sync id` -> uid=1000.
5. `curl -si https://SITE/api/health` -> 200 `{"ok":true}`, no-store. Register/login/PUT/GET in browser or curl.
6. Sync down: `docker compose stop sync`; `curl -si https://SITE/api/me` -> 503 `{"code":"unavailable"}` no-store application/json; `curl -so /dev/null -w '%{http_code}' https://SITE/` -> 200; UI shows unavailable. `docker compose start sync` -> /api/me 401 anon.
7. First-deploy rollback simulation (before the first real sync deploy, or with no omnilab-sync:PREV image): force gate failure (e.g. OMNILAB_DATA_DIR pointing at a root-owned dir so sync crashes) and run deploy.sh; expect logs, app back at PREV, sync stopped, "deploy FAILED (...), rolled back to <PREV>", `/` 200, /api 503 JSON. Restore state afterwards.
8. Backup x2: `bash deploy/backup-sync-db.sh` twice same day -> "backup ok /data/backups/omnilab-YYYY-MM-DD.db" both; `ls -l /srv/data/omnilab/backups` owner 1000:1000, one file for today.
9. Restore drill: `docker compose stop sync; cd /srv/data/omnilab; sudo rm -f omnilab.db-wal omnilab.db-shm; sudo cp backups/omnilab-YYYY-MM-DD.db omnilab.db; sudo chown 1000:1000 omnilab.db; docker compose start sync` -> known account logs in, progress as at backup time.
10. Cron (crontab -e as deploy): `15 3 * * * cd /home/deploy/omnilab && bash deploy/backup-sync-db.sh >> /srv/data/omnilab/backup.log 2>&1`. Check the log next day. Recommend `rclone copy /srv/data/omnilab/backups <remote>:omnilab` off-VPS.
11. After success: `docker images omnilab; docker images omnilab-sync` -> only latest, TAG, PREV.

## Deviations
1. Caddy `reverse_proxy` has no `@down status 5xx` handle_response (phase had "..."): the sidecar's own 503 `busy` must reach the client; only dial failures (502) go to handle_errors. Added `dial_timeout 2s`.
2. 5th sidecar file sync-backup.ts (entry would exceed 200 lines).
3. sync image also copies package.json (`"type":"module"`).
4. Caddyfile/Dockerfile/.gitignore forced LF; entry/auth/helpers remain CRLF in working copy (autocrlf, git normalizes on commit).
5. sync tmpfs /tmp added; harmless.

## Unresolved / notes
- `internal: true` network gives sync no egress (intended).
- If another stack on the VPS uses alias `omnilab-sync`, rename in compose + Caddyfile.
- Total failed first deploy with no PREV rolls nothing back (pre-existing behavior).

Status: DONE_WITH_CONCERNS
Summary: Caddy/Dockerfile/compose/deploy/backup done; backup TDD green, Caddy verified with real Caddy (static headers identical, 503 JSON when sidecar host missing); full gates green.
Concerns/Blockers: Docker-dependent steps (build, compose config, networks, ss, real rollback, container backup/restore, cron) unverified here; run VPS checklist. shellcheck not run.

## Review fixes (code-review-phase-05.md)
Gates: `pnpm test` 22 files / 463 tests, `pnpm check` 0/0/0, `pnpm check:server` clean, `pnpm build` 73 pages, `bash -n` both scripts OK. Real Caddy: validate OK, static header diff vs baseline still EMPTY, proxied /api/health has no `Via`.
- H1: Dockerfile order is build, sync, app (app LAST, comment explains Railpack/Vibe Deploy bare `docker build .`). Compose targets unchanged.
- M1: `env_value` tolerates no match (`|| true`), `SECRET=$(env_value ... || true)`; stub run prints the SESSION_SECRET error when var missing.
- M2: deploy.sh stores `cksum` of itself before `git pull`; if changed and `OMNILAB_REEXEC` unset, `OMNILAB_REEXEC=1 exec bash "$0" "$@"` (lock fd 9 inherited, lock not retaken on re-exec). Stub run: git stub modified the script, re-exec happened exactly once, no loop.
- M3: cron/log path now `$HOME/omnilab-backup.log` (backup-sync-db.sh header).
- L1: `-Via` added in the deferred security `header` block (a `header_down -Via` in reverse_proxy was tried first and did NOT work: Via is added later). Static diff still empty.
- L4: add `sudo chmod 700 /srv/data/omnilab` to checklist step 0.
- L5: VACUUM INTO `<target>.tmp` then `renameSync`; tmp removed on failure. Tests: failed run (corrupt source) keeps same-day snapshot and leaves only that file; twice-same-day test still green. (Tests written together with the code, not strictly red-first.)
- L6: file date uses Vietnam day (fixed UTC+7); test: 20:15 UTC -> next day, 16:59 UTC -> same day.
- L7: `env_value` strips CR, surrounding quotes, trailing ` # comment`, trailing blanks (verified on sample .env).
- L8: sync `cap_drop: [ALL]`, `security_opt: [no-new-privileges:true]`.
- Skipped per instruction: L2, L3.

Checklist updates: step 0 also `sudo chmod 700 /srv/data/omnilab`; step 10 cron log is `>> $HOME/omnilab-backup.log 2>&1` (not under /srv/data); step 3 note: first run after merging this phase may print "deploy.sh đã cập nhật, chạy lại bản mới" (self re-exec), that is expected; also confirm `docker compose ps` shows sync running with cap_drop (`docker inspect <sync> --format '{{.HostConfig.CapDrop}} {{.HostConfig.SecurityOpt}}'` -> `[ALL] [no-new-privileges:true]`).

Status: DONE
Summary: H1, M1-M3, L1, L4-L8 fixed; gates green; Caddy static diff empty.
Concerns/Blockers: Docker-only behaviors still need the VPS checklist. Whether `deploy` user is uid 1000 no longer matters (log in $HOME).
