# Phase 2a report - tab screens

pnpm test (422 pass, 23 files), pnpm check (0/0/0), pnpm build (73 pages, fidelity ok): green. Nothing committed. Server :4520 stopped.
Shots: `reports/phase-02a/` (`{home,domains,domain,search,saved,about,404}-{m,d}-{light,dark}.png`, empty states, 320px, tablet, search states, palette, plus `concept-m-*-dark.png` = concept prototype screens for side-by-side). Seeded localStorage via `omnilab:v1:state` (6 done, 1 reading @42%, 3 bookmarks).

## What changed (layout, not recolor)
- Home: mono date eyebrow + 34/44px title + search action; concept `.cont` continue card (hue glow, grid mask, mono domain chip, "BÀI 01 / 27", 22/34px 800 title, 12-seg bar, mono meta, ONE volt btn); stats strip (mobile 3-cell, desktop stacked big mono numbers); domain rows w/ mini % + fill bar (mobile) / art cards 3-col (desktop); "Tiếp theo" list (mobile rows, desktop table with #/Bài học/Lĩnh vực/Thời lượng/Trạng thái). Date + stats + next list fill client-side from existing store only.
- Lĩnh vực: art-header cards (generative line art per domain id, dotted fallback), mono index, tagline, footer counts + live bar; fluid grid.
- Domain page: pinned nav bar (‹ Lĩnh vực, collapsing title, search), hero (tinted icon, 32px title, mono KPIs, one volt CTA retargeted to first unfinished lesson: "Học tiếp/Bắt đầu/Ôn lại: bài NN"), module filter chips, per-module list with mono index + status dot (done disc / progress arc / empty ring) + "done/total" counters. Desktop: framed card w/ art band, ring + CTA right, framed lists.
- Tìm kiếm: sticky field with clear button, domain filter chips, mono result count, "Thử tìm" chips + "Bắt đầu từ đây" rows (empty state), dashed-icon empty/error states, rows with colored square domain + highlighted snippet.
- Đã lưu: concept rows (index, title, "■ domain · N phút", 44px remove), live "N bài" eyebrow, dashed-icon empty state with "Khám phá lĩnh vực".
- Giới thiệu/404: concept card sections with mono numbering / empty-state layout.
- Shell (owned files): sidebar search = button `data-open-palette` with ⌘K/Ctrl K kbd (platform swap via `data-kbd-mod`), "Đã lưu" (3 latest) section, progress footer (ring + N/64); dock "Đã lưu" count badge; large-title header rebuilt (eyebrow, actions slot, back link/nav slot, `bare` mode, desktop 40px top + gutter alignment, navbar hidden >=1024).
- Entrance stagger (30ms) on cards/rows/stat cells, press scale (.985 cards), bar/segment fills, reduced-motion = no animation.
- Deleted `components/domain/domain-artwork.astro` (grep: unused).

## Files
New: `components/domain/domain-art.astro`, `components/islands/{domain-progress,learning-stats,up-next-list,domain-page-controls}.astro`, `lib/{domain-progress,domain-meta,build-domain-meta,format-today-vi,kbd-platform}.ts`, `tests/domain-progress.test.mjs`.
Rewritten: pages (index, linh-vuc/index, linh-vuc/[domain]/index, tim-kiem, da-luu, gioi-thieu, 404), domain-{card,hero}, lesson-row, continue-reading-card, progress-ring (tokens), saved-list, search-box, sidebar-nav, large-title-header, tab-bar.
Pages now render `<LargeTitleHeader>` themselves (as first child of the layout slot) instead of passing `largeTitle` to AppLayout (needs per-page eyebrow/actions). app-layout.astro untouched; its `largeTitle` prop remains for other callers.

## Edits outside the ownership list (small, additive, optional-field; call out for review)
- `src/lib/search-box-controller.ts`: optional `countLabel`, `filters`, `clearButton`, `suggestions` (domain chips filter fetched results client-side, clear, suggested-query chips, row stagger index). Existing behavior/search logic unchanged; +5 tests in `tests/search-box-controller.test.mjs`.
- `src/lib/saved-list-controller.ts`: optional `meta` (domain hue), `countLabels`, fills `[data-saved-row-index|minutes]`; `readSavedListElements` returns the new keys as `undefined` when markup lacks them (old test contract intact); +1 test in `tests/saved-list-controller.test.mjs`.
- `src/styles/base.css` appended: `.hue` (domain hue -> `--c` by system theme, from YAML accent/accentDark via `--hue-l/--hue-d`), `.rise` + `ol-rise` (stagger entrance), `.sec-h` (mono section head + action), `.rows`/`.rows--idx` (hairline-separated row list, `--inset`).
- localStorage: read-only, no new keys. No inline scripts (CSP ok). Lessons index fetch is the existing memoized one.

## Deviations from concept (and why)
- Home domain row links to the domain page (concept) rather than the first lesson ("Bắt đầu từ bài 1" CTA removed); the domain page carries the volt start/continue CTA.
- Search chips use full domain titles (concept: "Kiến trúc/Tài chính/Nghề"); YAML has no short name and content.config.ts is not mine. Row scrolls horizontally at 390. Suggest adding optional `shortTitle` to the schema.
- No "Tìm gần đây" recents (would need a new localStorage key); replaced by static "Thử tìm" query chips + one entry lesson per domain.
- Lesson meta shows "N phút đọc" (module is already the section header); concept shows "Module · N phút".
- Domain page desktop and Tìm kiếm/Đã lưu desktop are my extrapolation (concept shows desktop only for Học tiếp/reader/palette).
- Desktop keeps no sticky nav bar on tab screens; sidebar keeps nav. No `G H`-style nav kbd hints in the sidebar (those shortcuts do not exist); only ⌘K/Ctrl K shown.
- Sidebar "Đã lưu" shows the 3 most recent bookmarks (concept: first 3).
- Badge on dock uses `--dock-text` fill (grey) so it reads on ink and on the volt pill.
- Dock indicator still static re-render (phase 1 note).

## Verification
- Overflow: no element beyond viewport at 320/390/768/1023/1024/1440 on all tab pages (element-level check; html has overflow-x hidden).
- axe (dark+light, 390): 0 violations on all tab pages; "incomplete" color-contrast entries are nodes mid entrance-animation. Tap targets >=44px except inline credit links on /gioi-thieu (pre-existing inline text links, exempt) .
- Soft-nav (ClientRouter) checked: home -> saved (remove row: count, badge, focus) -> domains -> domain (chips filter, counters, CTA) all re-bind.
- Palette opens from sidebar button and header "Tìm bài" button.

## Notes for next phases
- Lesson reader can reuse `.hue`, `.rows`, `.sec-h`, `domain-meta.ts`, `kbd-platform.ts`.
- `progress-ring.astro` now only used by the domain hero (desktop).
- Unresolved: favicon/PNG icons still indigo (phase 1); `shortTitle` for search chips; whether to keep stat leading zeros on desktop (concept pads "06"); not browser-tested on a real iOS device.

Status: DONE_WITH_CONCERNS
Summary: All tab screens rebuilt to the concept's layout/hierarchy (continue card, stats, art cards, domain page, search, saved, about, 404) with live progress, sidebar/dock additions and stagger/press motion; test/check/build green and screenshots compared screen by screen.
Concerns/Blockers: touched two lib controllers + appended base.css utilities outside the listed ownership (additive, tested); search chips use full domain titles (no short name in content schema).
