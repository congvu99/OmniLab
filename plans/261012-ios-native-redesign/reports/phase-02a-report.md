# Phase 2a report — tab screens

## Changed (only owned files)
- domain-card.astro: `variant="card"` (App Store-like: 56px tinted icon tile, title2, tagline, meta, ring top-right; used on /linh-vuc) and `variant="row"` (`.ios-row` + chevron + ring, used in inset-grouped list on Học tiếp). Theme-resolved `--dc` accent (dark uses accentDark) drives icon, CTA, ring.
- progress-ring.astro: ring colour via `--ring-color` (fallback unchanged), track now `--fill-tint`.
- domain-hero.astro: tinted hero, 68px icon tile, tagline headline, stats, ring with fraction.
- lesson-row.astro: `.ios-row` w/ chevron, number badge -> check (done, green) / accent ring (reading). Script now also sets `data-state="reading"` + status text "Đang đọc" (visitedAt && !done). `data-lesson-id/data-domain/data-done`, `[data-lesson-status-text]` kept.
- continue-reading-card.astro: accent-filled hero (accent-on text), 3-line clamped title, progress bar, "Tiếp tục" pill; skeleton matches; all data-crc-* kept.
- index.astro: hero + "Lĩnh vực" ios-list rows; >=1024px 2-col (hero sticky left, list right).
- linh-vuc/index.astro: domain card grid (1 col, 2 col >=640), footer link.
- linh-vuc/[domain]/index.astro: hero + modules as ios-section-header + ios-list lesson rows (inset 60px).
- search-box.astro: `.ios-search` pill, results `.ios-list` rows with chevron, max 720 centred. Placeholder shortened ("Tìm bài học, ví dụ: cache") to fit 390px. Reduced-motion for spinner. All data-search-* kept.
- saved-list.astro: ios-card empty/skeleton, ios-list rows, remove button round 44px, 720 centred. data-saved-* kept.
- gioi-thieu.astro: sections as ios-cards, 720 centred; fixed missing spaces around inline tags (compressHTML ate them), credit links styled via :global; bullets removed.
- 404.astro: ios-card + Compass icon + `.btn-filled`.

## Shared-utility requests
None required. Observation: `.ios-row` has `width:100%`; fine in flex rows. Optional: `.ios-search` could take a subtle border for 3:1 (still not added).

## Notes
- Did not widen main column; 880px shell gives 2-col on home and 2-col grid on lĩnh vực without it. Desktop home leaves lower area empty when only 3 domains (acceptable).
- No new scripts; existing bundling pattern unchanged. No raw hex (only rgba-free token use; shadow uses tokens).
- No horizontal overflow at 320px on all 7 screens (scrollWidth - innerWidth = 0).
- Search "Huỷ" button not added (type=search native clear kept).

## Validation
pnpm test 332 pass, check 0 errors, build 73 pages. Screenshots: plans/261012-ios-native-redesign/reports/phase-02a/ (home, lv, domain, search, saved, about, 404 x 390/1440 x light/dark; search-results-m-light). Server on 4410 stopped.

Status: DONE
