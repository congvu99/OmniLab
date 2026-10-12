# Impl report: phase 1 tab Tôi (/toi)

Status: DONE. `pnpm test` 464/464, `pnpm check` 0/0/0, `pnpm build` 74 pages. Not committed.

## Changes
- Nav: `nav-items.ts` +`/toi` (icon `user`, new in icon-paths extras); tab-bar uses `--tab-count` (grid + indicator width); sidebar + command palette get "Tôi" via navItems.
- Page `src/pages/toi.astro`: empty `<section id="tai-khoan">` (comment, hidden while empty, no fake UI); Giao diện (`islands/display-settings.astro`: radio segmented Sáng/Tối/Theo hệ thống, Nhỏ/Vừa/Lớn + preview, Theo hệ thống/Luôn bật); Tiến độ học (reuses LearningStats + DomainCard row/DomainProgress, link Học tiếp); Dữ liệu & ứng dụng (`islands/storage-status.astro`: isPersistent, iOS install tip hidden when standalone; link /gioi-thieu; disclaimer; version from package.json). 2 cols desktop, 1 col mobile ordered account/ui/progress/data.
- Prefs: `src/lib/user-prefs.ts` (key `omnilab:prefs`, safe parse, write, update, subscribe); `public/prefs-init.js` (external plain script, first in head via `<script is:inline src>` in `base-head.astro`, before stylesheets; sets html data-theme/text-size/motion + theme-color; matchMedia live, storage event, `omnilab:prefs-changed`, `astro:after-swap`).
- Theme migration: tokens.css dark block -> `:root[data-theme="dark"]` (+color-scheme); base.css (color-scheme, focus ring, .hue), prose.css (Shiki), command-palette, search-box, sidebar-nav, domain-accent.ts comment, base-head theme-color. No `prefers-color-scheme` left in CSS. token-contrast test now splits on the new selector; thresholds unchanged.
- Reduced motion: CSS media + `[data-motion="reduce"]` in base.css, view-transitions.css (keyframes hoisted out of media), tab-bar, nav-progress, command-palette, search-box; no-preference blocks (skeleton, progress-ring, reader-top-bar, view-transitions) gated with `:not([data-motion=reduce])`. JS helper `src/lib/reduced-motion.ts` used by complete-check-motion, reader-toast, bookmark-button.
- Text size: `--read-scale` (tokens.css) scales `.prose` body font-size only.
- Layouts: only `base-head.astro` edited; app-layout/reader-layout/progress-store untouched.
- Tests: new nav-items, user-prefs, reduced-motion; updated icon-names (user), command-palette tests (5 tabs), token-contrast.
- Docs: design-guidelines, system-architecture, codebase-summary, README.

## Acceptance evidence (agent-browser, dist via http.server 4560, stopped)
- Dock 5 tabs: 320 -> 56x52, 390 -> 70x52, 430 -> 78x52 px per tab; labels not truncated (scrollWidth<=clientWidth); active "Tôi" volt pill. Sidebar 1024/1440: 5 items, /toi aria-current=page. Screenshots in scratchpad (toi-320-light/dark, toi-430-dark, toi-1024-dark, toi-1440-light, toi-390-data, reader-390-dark-large).
- Apply immediately: clicking dark -> data-theme=dark, body bg rgb(11,12,14), meta theme-color #0B0C0E; motion reduce -> .tab-indicator transition 0.2s -> 1e-5s.
- Persist: reload keeps data-* and checked radios; soft nav (/toi -> /da-luu) keeps dark; second tab: change in tab 2 appears in tab 1 (theme light, textSize l).
- No flash: init-script MutationObserver: data-theme already set when first stylesheet `<link>` is inserted; first rAF body bg correct in both opposite cases (system dark + stored light -> rgb(243,244,246); system light + stored dark -> rgb(11,12,14)). Live system change with theme=system flips light<->dark + theme-color.
- Reader text size (390px): s 14.85px, m 16.5px, l 18.81px; h2 stays 21px. Shiki dark/light vars switch with theme (pre bg rgb(36,41,46) dark span color rgb(225,228,232); light bg white).
- CSP: dist/toi + dist/index have 0 inline `<script>`; only `/prefs-init.js` + module scripts.

## Deviations / notes
- Install tip shown on all non-standalone browsers (text says iPhone/iPad) rather than iOS-only, per spec "ẩn nếu standalone".
- Preview paragraph on /toi uses `--read-scale` directly (prose.css is reader-only).
- Sidebar link rows are 36px (existing design, pointer-only >=1024px); dock/touch targets >=44px.
- prefs-init.js duplicates the 3-value validation of user-prefs.ts (plain script, no imports); keys kept in sync by comments.
- Without JS the site is light (no data-theme).

Unresolved: none.
