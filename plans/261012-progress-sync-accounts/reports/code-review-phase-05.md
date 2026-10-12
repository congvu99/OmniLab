# Code review: phase 05 (infra, deploy, backup)

Worktree `D:/project/OmniLab-progress-sync` (feat/progress-sync), uncommitted diff vs 09412ff + untracked files. Read-only review: no source edited.

## Scope
- Files: Caddyfile, Dockerfile, compose.yml, deploy/deploy.sh, deploy/backup-sync-db.sh (new), server/sync/sync-backup.ts (new), server/sync/sync-server-entry.ts, tests/sync-backup.test.mjs (new), .dockerignore, .gitignore
- LOC: about +125/-23 tracked, about +160 new
- Verified independently here, not taken from the impl report:
  - `pnpm test`: 22 files, 461 tests green
  - `pnpm check`: 0/0/0
  - `pnpm check:server`: clean
  - `pnpm build`: 73 pages
  - Ran the real Caddy 2.10.2 binary against the real sidecar (Node v24.15.0). Results below.
  - Ran a bash repro of the deploy.sh env check.
  - Ran `--backup` while the server took concurrent writes.

### Caddy/sidecar probe results (real binaries)
| Case | Result |
|---|---|
| `/api/health` | 200 `{"ok":true}`, `Cache-Control: no-store` (single value, no `no-cache` duplicate), CSP/nosniff/Referrer/Permissions present, no `Server`, **`Via: 1.1 Caddy` present** |
| `/api/me` anon | 401 `{"code":"unauthorized"}` passed through untouched |
| register | 201, `Set-Cookie: omnilab_session=…; HttpOnly; SameSite=Lax; Path=/api; Max-Age=…` preserved, `Vary: Cookie` preserved |
| 415 / 413 (600 KB, 2 MB with Content-Length, 2 MB chunked) | sidecar codes pass through (413 `too_large` in every case, not converted to 503) |
| sidecar killed (conn refused) | 503 `{"code":"unavailable"}`, `application/json`, `no-store`, 2 ms; `/` stays 200 |
| host `omnilab-sync` unresolvable (the Railpack case; HEAD Caddyfile unmodified) | Caddy starts. `/api/me` returns 503 JSON but takes **2.0 s** (dial_timeout hit). `/` 200 |
| 503 fallback headers | `Server: Caddy` present, no CSP/nosniff. The deferred security `header` block does not cover `handle_errors`. Same as the existing 404 HTML page (pre-existing) |
| `--backup` x2 during 6 concurrent registers | both ok. Snapshot `integrity_check=ok`, `journal_mode=delete`, all committed rows present (the live DB had all its data still in the `-wal` file, so VACUUM INTO read it correctly) |

### How the header directives combine (confirmed by the probe)
- The security `header` block contains `-Server`, which makes Caddy defer it. So it applies when the response is written, after reverse_proxy has copied the upstream headers. Its set ops win, and Set-Cookie is untouched.
- The `@astroAssets` and `@notHashed` header lines are not deferred, so they run before the proxy. Excluding `/api/*` from `@notHashed` works: the sidecar's `no-store` is the only Cache-Control.
- `try_files` runs before `handle` in Caddy's directive order. That is harmless because `dist/` has no `api/` path (`src/pages` has no api route).
- **trusted_proxies / X-Forwarded-For**: no effect here. `grep forwarded|remoteAddress server/sync` finds nothing. The login throttle keys on username and the register cap is global, so the client IP is never used.

## Requirement matrix (a)
| Requirement | Status | Evidence |
|---|---|---|
| sync only on `internal`, `internal: true`, alias omnilab-sync | OK | compose.yml:32-34, 51-52 |
| no `ports:` on sync | OK | compose.yml:23-47 |
| read_only rootfs, only /data writable | OK (plus tmpfs /tmp, which SQLite temp files need) | compose.yml:28-29,37 |
| mem_limit 192m | OK | compose.yml:45 |
| healthcheck /api/health | OK. busybox wget is in node:alpine | compose.yml:40-44 |
| `SESSION_SECRET :?` | OK | compose.yml:39 |
| `OMNILAB_DATA_DIR` default /srv/data/omnilab | OK | compose.yml:37 |
| stages build/app/sync, compose targets, image names | OK | Dockerfile:2,15,28; compose.yml:6,9,26-27 |
| .dockerignore data/.data/*.db/*.db-* | OK. Root-anchored only, which is enough here | .dockerignore:15-18 |
| app on web+internal, depends_on service_started | OK | compose.yml:13-20 |
| node:24.x-alpine pinned minor | OK: 24.15 (local node is v24.15.0, so the release exists). import.meta.main exists since 24.2; node:sqlite and type stripping need no flags | Dockerfile:28 |
| Runtime imports copied | OK. Transitive closure: entry → helpers, auth, store, backup → src/lib/{progress-sync-types, progress-state, progress-merge}; progress-state and progress-sync-types import nothing. package.json is copied for `"type":"module"` | Dockerfile:31-33 |
| USER node can write /data | OK only if the host dir is chown 1000:1000. Otherwise the startup write-probe fails, sync crash-loops, the gate fails and deploy rolls back (fails closed) | Dockerfile:35-36 |
| deploy gate: `/` AND `/api/health` must be 200 | OK. `wget -q` exits non-zero on a 503 | deploy.sh:27-28 |
| tag + prune both repos (keep TAG, PREV) | OK | deploy.sh:30-35 |
| rollback: app `--no-deps`, sync PREV or stop, `set +e` | OK, traced, exits 1 | deploy.sh:41-56 |
| backup script via `docker compose exec -T sync` | OK | backup-sync-db.sh:9 |
| `--backup`: mkdir, rm same-day, VACUUM INTO, prune >14 d | OK | sync-backup.ts:19-40 |
| Restore steps (stop, rm wal/shm, cp, chown, start) | OK | impl report checklist step 9 |

## Critical
None.

## High

**H1. Dockerfile:28: `sync` is now the LAST stage, so any untargeted `docker build .` produces the sidecar image instead of the site.**
- Before this diff the last stage was the caddy site.
- Who is exposed:
  - Compose is safe (explicit `target:`).
  - Vibe Deploy depends on its builder. The docs say it follows the Railpack/Railway convention (deployment-guide.md:142). Railway's convention is to build a root `Dockerfile` instead of Railpack when one exists, and the Dockerfile is already in the repo at HEAD.
  - If the host builds the Dockerfile, the next push ships `node server/sync/sync-server-entry.ts`. Without SESSION_SECRET it exits "SESSION_SECRET must be set", so the whole site is down.
  - If the host truly uses Railpack (as the docs claim), this is not triggered.
- I cannot confirm which builder Vibe Deploy uses from the repo.
- Fix (zero cost, removes the risk): put the `sync` stage BEFORE the `app` stage, so `app` stays the default/last stage. Compose targets are unchanged.

## Medium

**M1. deploy.sh:13: a missing SESSION_SECRET makes the script exit silently.**
- `SECRET=$(env_value SESSION_SECRET)` is a plain assignment. Under `set -euo pipefail`, when grep finds no line the pipeline returns 1 and `set -e` exits right there with code 1. The friendly message on line 14 is never printed. (The SITE_URL check does print its message, because its command substitution sits inside `[ ]`.)
- Reproduced with bash: `.env` containing only SITE_URL gives exit=1 and no output.
- Impact: it still fails closed, but the operator gets a blank failure on the very first deploy. That is exactly when this key is most likely missing.
- Fix: `SECRET=$(env_value SESSION_SECRET || true)`. To be safe, also add `|| true` inside `env_value`.

**M2. The first deploy after merge runs the OLD deploy.sh.**
- bash reads its script through an fd it already holds. `git pull` (deploy.sh:17) replaces deploy.sh with a new inode, so the rest of that run executes the HEAD version of the script.
- The HEAD version runs `docker compose build app` only, then `up -d --no-build` against the new compose.yml. `omnilab-sync:$TAG` does not exist, so compose tries to pull it, fails, and `set -e` aborts.
- Nothing gets swapped and the old stack keeps running. But the deploy fails, and the new SECRET check never ran.
- Running it a second time works, because `.deployed-tag` was not updated and the script on disk is now new.
- Fix (pick one):
  - Document in the VPS checklist: "first time: `git pull --ff-only` by hand, then `bash deploy/deploy.sh`".
  - Make deploy.sh re-exec itself after the pull when HEAD changed. The flock fd needs care.

**M3. The cron log path may stop backups from ever running (backup-sync-db.sh:4, impl report step 10).**
- `>> /srv/data/omnilab/backup.log` is opened by the shell as the `deploy` user. The directory is owned by 1000:1000 with mode 755.
- If `deploy` is not uid 1000, the redirect fails before `bash` starts. No backup runs, and the error has nowhere to go: cron mail is usually unconfigured.
- Fix: log to `$HOME/omnilab-backup.log`, or add `id -u deploy` = 1000 as a prerequisite in the checklist.

## Low

**L1. Caddyfile:42-49: proxied /api responses carry `Via: 1.1 Caddy`.**
- Caddy 2.10's reverse_proxy adds this header. It undercuts the intent of `-Server`.
- Fix: add `-Via` to the security header block, or `header_down -Via` in reverse_proxy.

**L2. Caddyfile:99-107: the /api 503 fallback has no CSP/nosniff and does send `Server: Caddy`.**
- The deferred security block does not wrap the error route.
- The same gap is pre-existing for the 404 HTML page: verified on `/khong-co` (no CSP, `Server: Caddy`). The impl's "header diff empty" result confirms it is not a regression.
- Fix (follow-up): repeat the security `header` block inside `handle_errors`.

**L3. On Railpack, every /api call takes up to dial_timeout (2 s) when `omnilab-sync` does not resolve.**
- Measured 2.0 s locally. Linux NXDOMAIN is usually fast, but resolvers with search domains can be slow.
- The account island's `/api/me` on every page load would sit pending until then.
- Fix: accept it and document, or lower `dial_timeout` to 1s. Check that the client has its own fetch timeout.

**L4. Backup and DB files are 0644 (container umask), and the dir is 755 when created by `sudo mkdir`.**
- Any host user can read usernames and scrypt hashes.
- Fix: add `sudo chmod 700 /srv/data/omnilab` to the prep step. The container uid 1000 still owns it.

**L5. sync-backup.ts:26: today's earlier snapshot is deleted before VACUUM INTO.**
- If the VACUUM fails (disk full, busy), that day's good snapshot is lost. Older days survive.
- Fix: VACUUM INTO `target + '.tmp'`, then `renameSync`.

**L6. sync-backup.ts:15: file names use the UTC date.**
- Cron 03:15 Vietnam time is 20:15 UTC of the previous day, so the file is named after the previous day. Cosmetic. Prune is mtime-based, so it is unaffected.

**L7. deploy.sh:10-13: the .env parsing differs from compose's dotenv.**
- An inline ` # comment` or a CRLF is counted toward the 32 characters, so a short secret can pass the check.
- Compose strips the comment and the sidecar then rejects the short secret, which leads to a crash loop, a failed gate and a rollback. Fails closed.
- A shell-exported SESSION_SECRET overrides `.env` in compose but is not checked.
- Fix: optional. `docker compose config --format json | jq` would read the effective value, but it is heavier.

**L8. compose.yml sync: no `cap_drop: [ALL]` or `security_opt: [no-new-privileges:true]`.**
- Hardening beyond the plan. Cheap to add: node needs no capabilities on port 3000.

## Edge cases from scouting
- An oversize body sent through the proxy still returns 413 rather than 503 (verified for chunked bodies and for Content-Length > 1 MB).
- First deploy fails with no omnilab-sync:PREV image: rollback stops sync. Because `restart: unless-stopped` and the container was explicitly stopped, it stays stopped after a reboot. Good.
- After that rollback there is no `omnilab-sync:latest`. A later manual `docker compose up -d` (without `--no-build`) would build sync from the failing HEAD. Operational note only.
- `FORCE=1` with TAG == PREV rebuilds over the PREV tag, so rollback cannot restore the old image. Pre-existing behavior.
- The backup prune only runs after a successful VACUUM, so a run of failures never deletes every snapshot.
- Global registration cap (30/h) can be exhausted by anyone. This was decided in phase 2; noting it only because the IP is not used anywhere.

## Side effects / regressions
- Headers for static pages, `/_astro`, 404 and `/health`: unchanged. The impl report has a before/after diff on real Caddy, and my 404 probe matches pre-existing behavior.
- Railpack: Caddy starts and the static site is unaffected. `/api/*` returns 503 JSON there (see L3 for the latency).
- `.gitignore` now ignores `*.db` and `*.db-*` repo-wide. No tracked .db files exist, so no loss.
- Dockerfile: the default build target changed from the site to the sidecar. See H1.
- The entry statically imports sync-backup.ts. That adds a trivial load cost and changes nothing in server behavior.
- `pnpm build` regenerated `dist/` in the worktree (gitignored).
- Test/check/build gates are all green; no regressions.

## Recommended actions
0. H1: move the `sync` stage above `app` in the Dockerfile.
1. M1: add `|| true` to the SECRET assignment.
2. M2: put the first-deploy note (manual `git pull`, then deploy.sh) in the VPS checklist or deploy guide.
3. M3: move the cron log to `$HOME`, or require uid 1000.
4. L1 and L4: `-Via` and `chmod 700`, one line each.
5. L5: optional, temp file plus rename.

## Metrics
- Tests: 461/461. New backup tests: 7 (real SQLite, CLI spawn). They are behavior tests, not phantom ones.
- Types: `check` 0 errors, `check:server` clean.
- Lint/shellcheck: not available. Manual pass found no unquoted expansions that matter; `$(seq …)` and `{{.Tag}}` are safe.

## Unresolved questions
- Does Vibe Deploy build the root Dockerfile or Railpack? This decides how severe H1 is; the fix is cheap either way.
- Is the VPS `deploy` user uid 1000? This decides M3.
- Does the account island set a fetch timeout shorter than or equal to 2 s on `/api/me`? This decides how much L3 matters on Railpack.
- Is anything (CI, docs, a user habit) running `docker build .` without `--target`?

Status: DONE_WITH_CONCERNS
Summary: 8/10. Critical 0, High 1 (conditional on the host's builder), Medium 3, Low 8. All phase-5 requirements met; Caddy proxy/fallback/header interplay verified with real binaries.
Concerns: Docker-only behaviors (compose config, networks, real rollback, container backup) are still unverified on this machine.
