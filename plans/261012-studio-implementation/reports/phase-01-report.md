# Phase 1 report - Studio foundation

pnpm test (393 pass), pnpm check (0/0/0), pnpm build (73 pages, fidelity ok): green. Nothing committed.
Shots (390x844, 1440x900, light+dark; home, /linh-vuc, lesson): `reports/phase-01/{home,domains,lesson}-{m,d}-{light,dark}.png`. Compared to concept (file://) - dock, sidebar, tokens, fonts match. Server on :4500 stopped.

## Tokens (src/styles/tokens.css) - for phase 2
Theme = prefers-color-scheme only. VOLT RULE: `--volt` fill + `--on-volt` text; `--volt-ink` is the text/line variant (lime dark, olive light).
- Color: `--bg --bg-2 --surface --surface-2 --surface-3`, `--line --line-2 --line-3` (rgba hairlines), `--line-strong` (hex, >=3:1 control boundary), `--text --text-2 --text-3`, `--volt --volt-ink --on-volt --volt-soft`, `--arch --fin --pro` (domain hues), `--accent` (domain hue or volt-ink fallback), `--accent-on`, `--accent-tint` (color-mix w/ @supports fallback to volt-soft), `--danger --success`.
- Depth: `--glow` (inner top highlight), `--shadow`, `--dock --dock-text --dock-line --dock-shadow`, `--grain`, `--grid-line` (24px/16px technical grid mask backgrounds).
- Material: `--material-bar` (82% bg), `--material-blur`, `--material-sidebar`, `--material-border`, `--material-overlay` (palette scrim). Solid fallbacks: `@supports not backdrop-filter`, `prefers-reduced-transparency`.
- Radius: `--radius-xs 6, -sm 8, -row 12, -lg 16, -card 20, -xl 22, -dock 24, -full`.
- Space `--space-1..8` (4pt grid, unchanged). Gutters `--gutter` (20px; 56px >=1024), `--gutter-l/-r` (safe-area aware).
- Motion: `--dur-1 120, --dur-2 160, --dur-3 200, --dur-4 280`, `--ease` (.2,.8,.2,1), `--ease-snap` (.3,1.35,.5,1), `--stagger 30ms`.
- Type: `--font-ui`, `--font-mono`; sizes `--text-nano 10.5, -label 11.5, -micro 12, -caption 13, -small 14, -subhead 15, -callout 16, -body 16, -headline 17, -read 17, -title3 20, -title2 22, -title1 28, -large 34, -h1 32, -h2 24, -h3 18, -display-d 44, -display clamp(36..52)`; tracking `--track-display -.045em, -title -.035em, -heading -.025em, -tight -.01em, -label .08em`; leading `--leading-large 1.05, -tight 1.25, -normal 1.6, -relaxed 1.72`.
- Shell: `--shell-navbar-h 44, -tabbar-h 66, -tabbar-gap 12, -sidebar-w 256, -aside-w 300, -content-max 1072, -measure 68ch`. z: `--z-nav/overlay/toast`.

## Utilities (src/styles/base.css)
`.btn` + `.btn-primary|secondary|ghost|sm|icon` (sm = 34px visual, 44px hit via ::after), `.chip` (`[aria-pressed=true]`/`.on`), `.card`, `.row` (> `.idx .tt(b,small) .chev`), `.bar > i` (`--p --c`), `.seg > i.on` (`--n --c`), `.st(.done|.prog)`, `.field`, `kbd/.kbd`, `.eyebrow`, `.mono`, `.tnum`, `.dom-ic` (`--c`), `.tap-scale`, `.skeleton`, `mark`, `::selection`, focus-visible (dark volt ring; light ink ring + volt halo), grain (desktop >=1024px, off with reduced-transparency), `.icon-sprite`, `.ic`, `.ic--filled`. Legacy kept, restyled Studio: `.ios-list/.ios-row/.ios-section-header|footer/.ios-card/.ios-search`, `.btn-filled`(=primary), `.hide-at-aside-width`.
Phase 2 notes: `.field`/`.ios-search` use `--line-strong` border (not concept's `--line-2`) to keep 3:1 input boundary. Only show `kbd` hints for keys that work. `.note/.empty` utilities intentionally NOT defined (collide with scoped component classes).

## Icon API (src/components/icon/)
`<Icon name="search" size={20} stroke-width={1.5} filled label="..." class data-* />`. Sprite-based (`<use href="#i-name">`), CSP-safe, aria-hidden unless `label`; size omitted = 1em; rest attrs forwarded (Astro scoped styles keep working). `<IconSprite/>` rendered by both layouts. Helpers: `icon-names.ts` (`resolveIcon`, `ICON_NAMES`), `icon-paths.ts`. Unknown names -> `domains` glyph. Test: tests/icon-names.test.mjs.
Names (26 concept = 25 + `omni` brand mark): resume, domains, search, bookmark, network, wallet, briefcase, check, check-circle, clock, arrow-right, chevron-left, chevron-right, sun, moon, bulb, info, command, toc, type, close, history, doc, spark, replay, omni.
Extras (same grid/stroke, added for former Lucide usage): circle, external, expand, loader, inbox, wifi-off.
Aliases: YAML `network`->network, `wallet`->wallet, `briefcase-business`->briefcase; plus layers, graduation-cap, circle-check, bookmark-check, lightbulb, x, maximize-2, external-link, loader-circle, party-popper (->spark), compass (->omni), chevron-down/up (chevron-right rotated via `data-rotate`).
All `@lucide/astro` imports replaced across src (icon swap only in non-owned files: domain-*, lesson-row, bookmark/mark-complete/saved-list/search-box, lesson/*, 404); package removed (pnpm-lock updated).

## Shell
- Ink dock (tab-bar.astro): ink in both themes, sliding volt indicator (`--i` server-rendered), 4 items, hides on text-input focus, `view-transition-name: ol-dock`. app-layout only -> reader pages have NO dock (confirmed; focus mode). `<body data-shell="tabs|reader">` added as a hook.
- Sidebar: concept layout (brand mark, search link, 4 nav, domains w/ color square + lesson count), active pill + volt edge marker, `ol-sidebar` transition name. Stays on reader pages (concept desktop keeps it).
- Large title: 34px/800 (44px desktop), collapsing navbar. Reader top bar: volt-ink back, 14.5/700 collapsing title, 2px volt-ink progress with glow. Fixed pre-existing bug: title was always visible (observer picked the display:none fallback h1).
- Page transition: depth push (new +40px/fade 220ms, old scale .97 200ms; back reversed), chrome stays still via named groups; reduced motion = 120ms crossfade, no movement. Verified `startViewTransition` runs on dock nav.
- Fonts: Be Vietnam Pro latin+vietnamese 400/500/600/700/800, JetBrains Mono 400/500 (@fontsource, no new deps). theme-color/manifest: #F3F4F6 light, #0B0C0E dark meta.

## Content YAML (accent/accentDark only)
kien-truc #4B45D1/#9B9BFF, tai-chinh #0B7259/#4FD8B4, nghe-tai-chinh #A4440C/#FFA766 (concept hues). Fidelity passes; contrast test covers them.

## Legacy aliases (temporary)
`--ink`->`--text`, `--ink-2`->`--text-2`, `--separator`->`--line`, `--fill-tint`->`--surface-3`, `--shadow-card`, `--shadow-float`, `--material-tab`->`--dock`, `--dur-fast/--dur/--dur-exit`, `--ease-out`->`--ease`, `--ease-in`, `--ease-spring`->`--ease-snap`, `--text-footnote`, `--radius-card-sm`. Value shifts: `--text-body` 17->16 (use `--text-read` for reading), `--radius-card` 22->20, `--shell-sidebar-w` 264->256, `--leading-large` 1.2->1.05, `--leading-normal` 1.5->1.6.
Contrast test: tokens renamed (text/text-2/text-3/volt-ink/arch/fin/pro/danger/success on bg/surface/surface-2 >=4.5; line-strong >=3; on-volt on volt, accent-on on every accent + volt-ink, dock-text on dock). Thresholds unchanged.

## Deviations from concept
- Dock indicator does not "glide" across pages (static re-render; named view-transition group crossfades). Persisting dock was rejected: snapshot would hide the glide anyway.
- Sidebar search is a link to /tim-kiem with no ⌘K hint (palette not mounted yet; phase 2c can add the kbd). Sidebar lacks concept's "Đã lưu" list and progress footer (client data; phase 2a).
- Desktop reader keeps the sticky top bar (concept shows breadcrumbs instead); required by existing reader contract.
- Sidebar rows 36px (concept) on fine pointers, 44px on coarse pointers.
- Field borders use `--line-strong` (accessibility) vs concept `--line-2`.
- Favicon/PNG icons (public/favicon.svg, public/icons) still indigo - outside ownership; manifest colors updated only.
- Theme-color/manifest follow light value (dark meta tag handles browsers).

## Notes for phase 2
- Desktop gutter is now 56px via `--gutter-l/-r`; existing pages use hardcoded 16px margins, so the large title and content are misaligned until 2a switches to the gutter tokens.
- Remaining <44px targets on lesson pages are phase 2b content (inline links, `.figure__zoom` 28px).
- Existing components still use `--accent` (domain color) for fills (e.g. continue card renders lime fill because `--accent` = volt-ink fallback); restyle with `--volt`/`.btn-primary`.

Status: DONE
Summary: Studio tokens, fonts, 32-icon sprite + Icon component, utilities, ink dock/sidebar/headers and depth-push transition are in; Lucide removed; test/check/build green.
Concerns/Blockers: none blocking; see deviations and gutter note for phase 2.
