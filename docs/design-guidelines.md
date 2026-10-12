# Hướng dẫn Thiết kế — OmniLab Studio

**Cập nhật**: 2026-10-12 | **Phong cách**: Studio (calm dark-first, Volt signature) | **Font**: Be Vietnam Pro (UI/display) + JetBrains Mono (data)

OmniLab sử dụng "Studio" design system: giao diện bàn làm việc yên tĩnh (dark #0B0C0E / light #F3F4F6), một màu signature Volt lime (#D4FF3A dark / #C8F031 light), hairline border + glow trong, grid 24px kỹ thuật. **Design tokens** là source of truth; mỗi component chỉ dùng token, không raw hex hay px magic.

## 1. Hướng dẫn & Nguyên lý

### 3 từ khoá
**Chính xác** — Hairline borders, mono tabular nums, grid 24px; **Tập trung** — Dark là theme chủ, Volt duy nhất nối bật; **Nhanh nhạy** — Motion 120–200ms, depth push, glide, stagger.

### Chọn giao diện
- **Sáng** (#F3F4F6 bg / #FFFFFF surface): cool-paper, dùng trong ngày
- **Tối** (#0B0C0E bg / #1C1C1E surface): graphite, là theme chủ đạo
- Tự động theo `@media (prefers-color-scheme: dark)` (không toggle UI)

### Màu Volt — Quy tắc duy nhất
| Token | Dùng cho | Dark | Light | Ghi chú |
|---|---|---|---|---|
| `--volt` | **FILL chỉ** (nút, chỉ báo, disc) | #D4FF3A | #C8F031 | Luôn mang --on-volt text |
| `--volt-ink` | TEXT / line / icon (link, eyebrow, active) | #A8FF00 | #4A6B00 | Độc lập, dùng được ở mọi surface |
| `--on-volt` | Chữ trên volt fill | #0B0C0E | #0B0C0E | Nearblack, không thay đổi |

**Cảnh báo**: Không dùng `--volt` làm chữ trên nền sáng (contrast <4.5:1). Luôn dùng `--volt-ink` cho text/link.

### Domain hues (concept)
- **Kiến trúc**: #4B45D1 (đó) / #9B9BFF (sáng)
- **Tài chính**: #0B7259 (đó) / #4FD8B4 (sáng)  
- **Nghề tài chính**: #A4440C (đó) / #FFA766 (sáng)

Tất cả ≥4.5:1 trên nền tương ứng.

## 2. Color tokens

### Nền & Surface

| Token | Dark | Light | Dùng cho |
|---|---|---|---|
| `--bg` | #0B0C0E | #F3F4F6 | Nền trang toàn cảnh |
| `--bg-2` | #14151A | #ECEEF1 | Sidebar secondary canvas |
| `--surface` | #1C1C1E | #FFFFFF | Card, list container chính |
| `--surface-2` | #2C2C2E | #F8F9FA | Field, hover rows, secondary fill |
| `--surface-3` | #3C3C3E | #EDEFF2 | Track, pressed, skeleton |

### Chữ & Border (hairline)

| Token | Dark | Light | Dùng cho | Contrast |
|---|---|---|---|---|
| `--text` | #FFFFFF | #0C0E12 | Chữ chính | ≥4.5:1 |
| `--text-2` | #A1A1A6 | #4A505C | Chữ secondary | ≥4.5:1 |
| `--text-3` | #8A8A91 | #5F6672 | Meta, mono label | ≥4.5:1 |
| `--line` | rgba(255,255,255,0.08) | rgba(12,14,18,0.08) | Hairline decorative chỉ | — |
| `--line-2` | rgba(255,255,255,0.13) | rgba(12,14,18,0.13) | Card/control border | — |
| `--line-3` | rgba(255,255,255,0.24) | rgba(12,14,18,0.24) | Hover border, ring | — |
| `--line-strong` | #5A5A5F | #80858F | Input/button boundary | ≥3:1 |

### Volt + Domain

| Token | Dark | Light | Dùng cho |
|---|---|---|---|
| `--volt` | #D4FF3A | #C8F031 | **FILL CHỈ** (nút, badge, chỉ báo) |
| `--volt-ink` | #A8FF00 | #4A6B00 | TEXT/link/icon (độc lập) |
| `--on-volt` | #0B0C0E | #0B0C0E | Chữ trên volt fill |
| `--volt-soft` | rgba(140,190,0,0.14) | rgba(140,190,0,0.14) | Tinted wash behind volt-ink |
| `--arch` | #9B9BFF | #4B45D1 | Kiến trúc (hệ thống) |
| `--fin` | #4FD8B4 | #0B7259 | Tài chính (cá nhân) |
| `--pro` | #FFA766 | #A4440C | Nghề tài chính (kỹ năng) |
| `--accent` | Fallback `--volt-ink` hoặc domain hue từ YAML | Chữ/nền domain |
| `--danger` | #FF9A94 | #B3261E | Error, warning |
| `--success` | #6EE7B7 | #1C7455 | Done, complete |

### Material & Glow

| Token | Dark | Light | Ghi chú |
|---|---|---|---|
| `--material-bar` | rgba(28,28,30,0.72) | rgba(243,244,246,0.82) | Toolbar glass (fallback solid) |
| `--material-sidebar` | #14151A | #ECEEF1 | Sidebar (solid, không blur) |
| `--material-blur` | blur(14px) saturate(1.4) | blur(14px) saturate(1.4) | Applied nếu backdrop-filter support |
| `--material-overlay` | rgba(5,6,8,0.52) | rgba(5,6,8,0.52) | Modal scrim (palette) |
| `--glow` | inset 0 1px 0 rgba(255,255,255,0.06) | inset 0 1px 0 rgba(255,255,255,0.95) | Top inner highlight |
| `--shadow` | 0 1px 2px rgba(12,14,18,0.06), 0 12px 32px -14px rgba(12,14,18,0.22) | (same) | Card shadow |

### Dock (always ink-colored both themes)

| Token | Dark | Light | Ghi chú |
|---|---|---|---|
| `--dock` | #0E1014 | #0E1014 | Dock background |
| `--dock-text` | #A3A8B3 | #A3A8B3 | Dock icon/text |
| `--dock-text-strong` | #EDEEF0 | #EDEEF0 | Chữ chính trên nền mực (dock, toast) |
| `--dock-line` | rgba(255,255,255,0.08) | rgba(255,255,255,0.08) | Dock separator |
| `--dock-shadow` | 0 18px 40px -14px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06) | (same) | Dock elevation |

### Grain & Grid

| Token | Giá trị | Ghi chú |
|---|---|---|
| `--grain` | 0.04 | Opacity overlay; desktop ≥1024px chỉ |
| `--grid-line` | rgba(12,14,18,0.045) | Technical drawing grid background |

## 3. Typography

### Font & Weight
- **UI/Display**: Be Vietnam Pro 400/500/600/700/800 (latin + vietnamese)
- **Data/Code**: JetBrains Mono 400/500 (mono tabular numerals)

### Type Scale (CSS vars: `--text-*`)

| Token | Size | Weight | Dùng cho |
|---|---|---|---|
| `--text-nano` | 10.5px | 400 | Footnote sidenote |
| `--text-label` | 11.5px | 600 | Uppercase label, eyebrow |
| `--text-micro` | 12px | 400 | Caption, hint |
| `--text-caption` | 13px | 400 | Meta, secondary detail |
| `--text-small` | 14px | 400 | Body small |
| `--text-subhead` | 15px | 500 | Section subheading |
| `--text-callout` | 16px | 400 | Callout, search result |
| `--text-body` | 16px | 400 | Body default (input, field) |
| `--text-headline` | 17px | 600 | Headline, card title |
| `--text-read` | 17px | 400 | Lesson body (reading) |
| `--text-title3` | 20px | 600 | Lesson subheading |
| `--text-title2` | 22px | 700 | Page subtitle |
| `--text-title1` | 28px | 800 | Page title (mobile) |
| `--text-h1` / `-h2` / `-h3` | 32 / 24 / 18 | 800 / 700 / 600 | Heading hierarchy |
| `--text-large` | 34px | 800 | Large title (desktop) |
| `--text-display` | clamp(36px, 9vw, 52px) | 800 | Hero text |

### Line Height & Tracking

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--leading-large` | 1.05 | Title, headline (tighter) |
| `--leading-tight` | 1.25 | Subheading |
| `--leading-normal` | 1.6 | Body, default |
| `--leading-relaxed` | 1.72 | Long-form reading |
| `--track-display` | -0.045em | Display, hero text |
| `--track-title` | -0.035em | Title, h1–h2 |
| `--track-heading` | -0.025em | Heading, h3+ |
| `--track-tight` | -0.01em | UI label |
| `--track-label` | 0.08em | Uppercase eyebrow |

### Mono Usage (.mono, .tnum)
- `.mono`: JetBrains Mono; dùng cho numbers, code, tabular data
- `.tnum`: Tabular numerals (`font-feature-settings: "tnum"`) — align columns của số (đặc biệt lesson index "BÀI 01 / 27")
- Không italic, không weight—font không hỗ trợ

## 4. Spacing, Radius & Elevation

### Spacing (4pt grid)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--space-1` | 4px | Micro gap |
| `--space-2` | 8px | Small gap |
| `--space-3` | 12px | Padding, gap |
| `--space-4` | 16px | Default padding |
| `--space-5` | 20px | Card padding |
| `--space-6` | 24px | Section gap |
| `--space-7` | 32px | Large gap |
| `--space-8` | 48px | Major section |

### Radius (Studio corners: hard → soft)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--radius-xs` | 6px | Kbd, inline code |
| `--radius-sm` | 8px | Small button |
| `--radius-row` | 12px | Button, input, row (md) |
| `--radius-lg` | 16px | Card, figure, callout |
| `--radius-card` | 20px | Continue card, domain |
| `--radius-xl` | 22px | Gallery, section |
| `--radius-dock` | 24px | Dock bar |
| `--radius-full` | 999px | Pill button, chip |

### Elevation (hairline + glow)

| Mức | Dùng cho | Border | Glow | Shadow |
|---|---|---|---|---|
| 0 | Flat background | — | — | — |
| 1 | Surface, card | `--line-2` 1px | `--glow` inset top | `--shadow` |
| 2 | Floating (bar, modal) | `--line` 1px | `--glow` | `--dock-shadow` (dock) |

**Material fallback**: Nếu `backdrop-filter` không hỗ trợ hoặc `prefers-reduced-transparency: reduce`, sử dụng solid fill thay vì blur.

## 5. Motion tokens & rules

### Duration & Easing

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--dur-1` | 120ms | Snap, quick feedback |
| `--dur-2` | 160ms | Standard transition |
| `--dur-3` | 200ms | Page transition |
| `--dur-4` | 280ms | Stagger, complete check motion |
| `--ease` | cubic-bezier(.2, .8, .2, 1) | Standard ease-out |
| `--ease-snap` | cubic-bezier(.3, 1.35, .5, 1) | Spring (overshoot) |
| `--stagger` | 30ms | Per-item entrance delay |

### Motion patterns
- **Entrance**: Stagger 30ms per item, opacity + translate (slide từ dưới lên), 160–200ms
- **Depth push** (page transition): Old page lùi 0.97 scale + 200ms fade, new page vào +40px + fade 220ms (reversed on back); reduced motion = 120ms crossfade, no movement
- **Glide** (dock, sidebar, TOC): Static re-render with named transition group crossfade 120ms
- **Complete motion**: Ring → disc (snap) → tick draw + sparks (280ms total); reduced motion = 120ms crossfade, instant disc, no sparks
- **Toast**: Slide in từ dưới (bottom safe area), auto-dismiss 4s, pause on hover/focus

### Reduced motion
```css
@media (prefers-reduced-motion: reduce) {
  /* All animation/transition → 120ms crossfade hoặc instant */
  animation-duration: 0.01ms;
  transition-duration: 0.01ms;
}
```

## 6. Icon API & System

### Using icons
```astro
import Icon from '../components/icon/icon.astro';
<Icon name="search" size={20} stroke-width={1.5} label="Tìm kiếm" />
```

- **Component**: `<Icon name="..." />` (Astro, CSP-safe)
- **Rendering**: SVG `<use href="#i-{name}">` từ inline sprite
- **Size**: `size={px}` (default 1em); không relative scaling
- **Stroke**: `stroke-width={1.5}` (concept default 1.5)
- **Label**: `label="..."` → `aria-label` (nếu icon-only button, bắt buộc)
- **Data attr**: `data-...` forwarded to SVG (e.g., `data-rotate="90"`)

### Icon names (25 concept + extras)

**Core**: resume, domains, search, bookmark, network, wallet, briefcase, check, check-circle, clock, arrow-right, chevron-left, chevron-right, sun, moon, bulb, info, command, toc, type, close, history, doc, spark, replay, **omni** (brand mark)

**Extras**: circle, external, expand, loader, inbox, wifi-off

**Aliases**: YAML domain có thể map Lucide names → Studio names (e.g., `graduation-cap` → none tồn tại, fallback `domains` hoặc chỉ định custom name).

### Adding icons
1. Vẽ trên 24px grid, stroke 1.5, round cap/join, safe area 2px
2. Add `<symbol id="i-{name}">` to `src/components/icon/icon-paths.ts`
3. Export từ `icon-names.ts` (enum + resolveIcon function)
4. Test: `tests/icon-names.test.mjs`

### Domain YAML icon mapping
```yaml
domain: my-domain
... 
icon: custom-icon-name  # optional, fallback to domains glyph
```  

## 7. Command Palette (⌘K / Ctrl+K)

### Opening
- **Keyboard**: Cmd+K (macOS) or Ctrl+K (Windows/Linux) — detected via `data-kbd-mod` attribute
- **Button**: Sidebar search button with `data-open-palette` attribute
- **Event**: `document.dispatchEvent(new CustomEvent('omnilab:open-palette'))`

### Contents
- **Quick actions**: Tabs (home, domains, search, saved, about), recent lesson, domain shortcuts
- **Lesson search**: MiniSearch with diacritic folding (same engine as /tim-kiem)
- **Keyboard**: ↑/↓ navigate, Enter go, Esc close
- **Focus trap**: Tab stays on input; outside click refocuses input

### Styling
Sử dụng doc tokens: `--surface`, `--text`, `--accent`, `--volt-ink`, `--line`, `--glow`, etc. Backdrop rgba(5,6,8,.55) hard-coded (không token). z-index 1000.

## 8. Component utilities (src/styles/base.css)

Sử dụng class này thay vì CSS tùy chỉnh — **single source of truth** cho Studio look.

| Class | Dùng cho | Ghi chú |
|---|---|---|
| `.btn` | Button base | 44px hit, flex center |
| `.btn-primary` | Main action | Volt fill + --on-volt text |
| `.btn-secondary` | Secondary action | Surface-2 + hairline + glow |
| `.btn-ghost` | Tertiary | Transparent, surface-2 hover |
| `.btn-sm` | Small action | 34px visual, 44px hit |
| `.btn-icon` | Icon-only | Square, no padding |
| `.chip` | Filter pill | 32px, `[aria-pressed=true]` = filled |
| `.card` | Content card | Surface + hairline + glow + shadow |
| `.row` | List row | 56px, > `.idx` `.tt` `.chev` |
| `.bar` | Progress track | Width `--p`, color `--c` |
| `.seg` | Segment bar | `--n` columns, `i.on` filled |
| `.st` | Status dot | 22px; `.done` disc, `.prog` arc |
| `.field` | Input shell | 46px, icon + input + kbd hint |
| `.kbd` | Key hint | Keycap style; chỉ show thật |
| `.eyebrow` | Label | 11.5px mono uppercase |
| `.mono` | Mono text | JetBrains Mono |
| `.tnum` | Tabular nums | `font-feature-settings: "tnum"` |
| `.dom-ic` | Domain icon | 40px tinted tile, color `--c` |
| `.tap-scale` | Press feedback | Scale 0.985 on active |
| `.hide-at-aside-width` | Responsive hide | Hidden ≥1280px (aside pattern) |
| `.rise` | Entrance stagger | keyframe `ol-stagger-in` (khác `ol-push-in` của page push) |
| `.sr-only` | Screen reader only | Visually hidden, in a11y tree |

## 9. Layout & Breakpoints

### Responsive widths
- **<1024px** (mobile/tablet): Single column, full-bleed reading, floating dock bottom
- **≥1024px** (desktop): Sidebar 256px + main (68ch content-max, centered)
- **≥1280px** (wide desktop): + reader aside 300px (sticky, scroll independent)

### Shell dimensions (tokens)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--shell-navbar-h` | 44px | Top bar height |
| `--shell-tabbar-h` | 66px | Dock height + safe area |
| `--shell-tabbar-gap` | 12px | Spacing around dock |
| `--shell-sidebar-w` | 256px | Sidebar width |
| `--shell-aside-w` | 300px | Reader aside width |
| `--shell-content-max` | 1072px | Max page width (3-col) |
| `--shell-measure` | 68ch | Reading line length |

### Gutters (safe area aware)

| Token | Dùng cho |
|---|---|
| `--gutter` | Default horizontal padding (20px mobile, 56px ≥1024) |
| `--gutter-l`, `--gutter-r` | Left/right safe area insets (handles notch, landscape) |

### Reader aside slot contract (reader-layout.astro)
```astro
<Fragment slot="aside">
  <!-- Shown >=1280px, sticky, scrolls independently -->
  <!-- Must use aside-*- prefix for ids/data attr -->
</Fragment>
```
- Inline copies carry `.hide-at-aside-width` (visible <1280px only)
- State-bearing islands (mark-complete, bookmark) bind **all** instances via `[data-mcb]` / `[data-bb]`

## 10. Accessibility

### Contrast
- Text on surface ≥4.5:1 (AA standard); verified via `tests/token-contrast.test.mjs` (55 pairs)
- Control border `--line-strong` ≥3:1 vs background
- Domain accent + text color ≥4.5:1 on all surfaces, both themes

### Tap target & touch
- All interactive ≥44px (button, row, input)
- Padding ≥12px around icon/text
- No hover-only info; test `@media (hover: hover)` for desktop

### Keyboard & focus
- `:focus-visible` outline 2px volt (dark) or volt-ink (light), 2px offset
- Natural DOM tab order; skip-link → `#reader-content`
- Semantic: `<button>`, `<nav>`, `<main>`, `<aside>`, `<form>`
- ARIA: `aria-label` icon buttons, `aria-current="location"` active nav

### Motion & reduced motion
```css
@media (prefers-reduced-motion: reduce) {
  /* Duration 0.01ms (instant); no movement, crossfade only */
}
```
Scroll, stagger, complete check, entrance — tất cả instant hoặc static.

### Screen reader
- `.sr-only`: visually hidden, accessible
- Landmarks: `<nav>`, `<main id="reader-content">`, `<aside aria-label="...">`
- Live region: errors announced (search, etc.)
- Headings: h1 page title, h2–h4 content (no skip levels)

## 11. Verification checklist

```bash
pnpm test             # All tests pass (contrast included)
pnpm check            # 0 errors, schema valid
pnpm build            # Fidelity gate OK, output verified
```

Manual checks:
- Screenshot 390×844 light/dark (mobile), 1440×900 light/dark (desktop)
- No horizontal scroll 320–1440px
- Tap targets ≥44px (DevTools inspect)
- Reduced motion: all animations off
- Dark mode: colors, SVG inline (if used), grain off on mobile
- Keyboard: ⌘K/Ctrl+K opens palette, Tab traps inside, Esc closes

## 12. Do's & Don'ts

### DO
✓ Use token for every color, radius, space, duration  
✓ Motion 120–200ms, easing `--ease` standard  
✓ Entrance stagger 30ms per item  
✓ Safe area insets via `--gutter-l/r` (notch aware)  
✓ Mobile-first, test 320–1440px  
✓ Flex/grid (no absolute pos)  
✓ Respect `prefers-reduced-motion`  
✓ Links/buttons 44px min, tab order semantic  
✓ Inline copies + `.hide-at-aside-width` for reader aside pattern

### DON'T
✗ Hardcoded hex/RGB or px magic numbers  
✗ `--volt` as text on light background (use `--volt-ink`)  
✗ `backdrop-filter` without fallback (material tokens handle)  
✗ Hover-only affordance (test `@media (hover: hover)`)  
✗ Scrolling container inside sticky container (aside)  
✗ Duplicate landmark ids / nav links (aside uses `aside-*-`)  
✗ Inline style motion without reduced-motion check  
✗ Grain on mobile (<1024px)

---

**Reference**: `src/styles/tokens.css` · `src/styles/base.css` · `src/styles/view-transitions.css`  
**Tests**: `tests/token-contrast.test.mjs`  
**Concept**: `plans/261012-full-restyle-concepts/concept-b-studio/README.md`
