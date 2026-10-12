---
name: sync-sidecar-review-hotspots
description: OmniLab progress-sync (node:sqlite sidecar + schema v2 merge) recurring review risks found 2026-10-12
metadata:
  type: project
---
Progress sync (plan 261012-progress-sync-accounts) review hotspots:
- Throttle checked before async scrypt and recorded after it, so parallel attempts bypass it. Probe with 10 parallel wrong logins.
- Vietnamese audience: passwords need NFC normalization (Unikey composed vs precomposed).
- v2 LESSON_ID_PATTERN silently drops non-conforming ids on every store re-read (mutate re-migrates storage). Check there is a content-level guard test.
- Server .ts is not covered by astro check; @types/node is only transitive. Plain `tsc -p tsconfig.json` does include server/.
- Plan port is 3000; code defaulted to 3001.
- Infra (phase 5): a real Caddy 2.10 exe sits in the session scratchpad (`caddy/caddy.exe`). Swap the upstream host to 127.0.0.1 and probe for real.
- Caddy findings: a `header` block containing `-Server` is deferred and does NOT cover handle_errors (no CSP on 404/503). reverse_proxy adds `Via: 1.1 Caddy`.
- Dockerfile last stage = default build target. The repo ships the same Dockerfile to Vibe Deploy, so keep `app` as the last stage.
- deploy.sh pitfalls:
  - `VAR=$(pipeline)` under `set -e` + pipefail exits silently.
  - `git pull` inside the script means the first run executes the OLD script (bash keeps its fd on the old inode).

- Client sync (phase 3/4):
  - Auth identity is held in per-tab memory, but the cookie is shared across tabs, and the server's progress responses carry no username. Stale tabs push into the wrong account. Probe: logout/login in one tab, then go back to the other.
  - Test fakes that fire `storage` listeners synchronously inside setItem hide microtask-ordering bugs. Browsers run a microtask checkpoint between UA-dispatched listeners.
  - Check that logout flushes the pending debounced push. Also check what happens when a push is already in flight: `push()` returns the stale flight.
  - A local-only wipe (`store.clear()`) while signed in is undone by the next sync, because the merge has no tombstones for "cleared". Probe it with a scratch vitest config (`root` = scratchpad) that imports the worktree src and a server PUT built from mergeStates.

**Why:** these pass CI but break prod/security; tests use fixed fixtures.
**How to apply:** re-check in phase 3-5 reviews (client sync, Caddy, compose).
