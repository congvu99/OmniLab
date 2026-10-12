# Phase 2b report - lesson reader

Validation: pnpm check 0/0/0; pnpm build OK (73 pages, fidelity OK); pnpm test 415 pass, 1 FAIL = tests/saved-list-controller.test.mjs (saved-list.astro, owned by phase 2a, edited concurrently; not touched by 2b). No horizontal overflow at 320/1024/1440 (scrollWidth == clientWidth).
Shots: reports/phase-02b/ (arch = Kien truc "cache" lesson with figures/real-life/translator+review notes; fin = tai-chinh "chong-gia-mao" with disclaimer): arch-m-dark-top, arch-m-light-{top,scrolled,complete}, arch-d-dark-{top,scrolled,complete}, fin-m-dark-{top,scrolled}, fin-d-light-top; concept refs concept-{mobile,desktop}-reader. Server :4530 stopped. Nothing committed.

## Changes
- Header (new lesson-header.astro, lesson-meta.astro rewritten; lesson-cover.astro deleted): concept art-head = mono eyebrow (domain / module . Bai NN/N), 28px/800 h1 (44px desktop), summary dek, ruled meta strip (reading time, short source . license, "Da soat vi du" only when reviewed). Optional frontmatter cover still rendered as image under header.
- Title once: header holds the page h1; body heading that duplicates the title (first heading only; h1 in Kien truc, h2 in finance) hidden via inline `[id=..]{display:none}` (CSP allows inline style) and dropped from TOC. Top bar title still appears only after h1 scrolls away. Fallback h1/h2: layout rules now hide fallback h1 when article has h1 (always) and fallback h2 unless article has `data-h2-filler` (first visible body heading deeper than h2).
- Layout (reader-layout.astro): 700px column, 300px aside with hairline divider >=1280, shared toast mounted, CommandPalette mount untouched, aside slot contract unchanged.
- Top bar: transparent at top, material+hairline after 24px scroll; progress line unchanged (2px volt-ink glow); back label wider (42vw).
- Aside (lesson-aside.astro): concept progress box (48px ring, "con N phut . P%"), "Trong bai nay" rail with gliding volt marker (new `onActiveChange` option in toc-scrollspy.ts + test), actions: save, complete, next. Inline TOC card (mono section numbers) kept for <1280.
- Completion (mark-complete-button.astro + lib/complete-check-motion.ts): done-zone card with badge ring -> disc (snap) -> tick draw + 8 sparks + button bounce; button tick draws; hint text swaps; aside compact variant. Reduced motion = 120ms crossfade, no sparks. Plays only for user clicks (not on load/cross-tab). Multi-instance sync via progress store kept.
- Toast (reader-toast.astro + lib/reader-toast.ts): concept dark toast, shared by complete ("Da hoan thanh bai", n/N . domain, Hoan tac 44px) and bookmark; timer pauses on hover/focus; separate sr live region.
- Bookmark: 44px icon button, volt-ink + filled when saved, pop animation, labeled variant for aside.
- Prose (prose.css): 16.5/1.72 (18px >=1024), h2 800 with CSS-counter section numbers (hanging, mono volt-ink), blockquote pull-quote, tables (hairline card, mono caps th), JetBrains Mono code, links = ink text + 2px volt underline with +0.4em vertical tap padding (running text only).
- Components restyled with Studio tokens, no legacy aliases: note, real-life (tinted gradient, mono tag, Nhap badge kept), review-note (dashed), translator-note, disclaimer (info note), figure (hairline card, caption footer, 44px zoom button), attribution (ruled mono footer), next-lesson (volt arrow tile).
- New lib lesson-reader-model.ts (+ tests): title-dup detect, heading filler, summary cleaning (drops scraped fragments), minutes left, short source/license labels.

## Deviations from concept
- No "Co chu" (type size) button: feature does not exist; not faked. Desktop keeps sticky top bar instead of crumbs (phase 1 contract); no J/K/B hints (keys not implemented).
- Aside appears >=1280 (existing contract), not 1024. Complete button also duplicated in aside (compact) in addition to the concept done-zone.
- Done-zone gets a ring/disc/tick badge (concept shows it only in motion lab) because user asked for that motion on completion; ring arc/disc outline use volt-ink for light-theme visibility.
- Done button label stays constant ("Danh dau da xong", state via aria-pressed) for label-in-name; concept swaps label.
- Summary shown only when it reads as a sentence (>=40 chars, not "05 / ..." fragments); many finance summaries are scraped stubs.
- Raster figures from source (e.g. cache diagram) are not themed: black label on transparent PNG is unreadable in dark ("Worker Pool"); content asset, not edited.
- Meta strip uses shortened source/license (full credit in footer).

## Notes
- No edits to tokens.css/base.css. `.hide-at-aside-width` still used by inline TOC only.
- Legacy alias tokens no longer referenced in owned files (grep clean for --ink/--separator/--fill-tint/--shadow-card/--ease-out etc. in lesson/*, prose.css, islands reader, top bar, layout).
- progress-ring.astro (not mine) still uses legacy aliases.

Status: DONE_WITH_CONCERNS
Summary: Reader rebuilt to concept layout/hierarchy/motion; check/build green, tests green except a saved-list-controller test in 2a's files.
Concerns/Blockers: saved-list-controller test failing (phase 2a area); dark-mode raster figures unthemed (content).
