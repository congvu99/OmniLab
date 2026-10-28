# Tiêu chuẩn code — OmniLab v1 + Studio

## Tệp & Đặt tên

**Kebab-case**: `search-box-controller.ts`, `mark-complete-button.astro`, `progress-store.ts`. Tên dài là tốt (tự-ghi-chú cho LLM tools).

**Giới hạn kích thước**:
- Code file: <200 LOC (split tại ranh giới ngữ nghĩa)
- Test: cùng thư mục với source (`.test.mjs`)
- Markdown/JSON/config: không giới hạn

**Cấu trúc**:
```
src/
  components/
    icon/                  # Icon component + names + paths (Studio sprite)
    command-palette/       # ⌘K palette (new)
    islands/               # Interactive islands (client JS)
    lesson/                # Lesson body (RealLife, Figure, etc.)
    shell/                 # Layout shells (dock, sidebar, headers)
    domain/                # Domain cards, art, nav
  lib/                     # TypeScript utils (stores, helpers, controllers)
  layouts/                 # Astro layouts
  pages/                   # Routes (file-based)
  content/
    domains/               # YAML: domain metadata + accent
    lessons/               # MDX: lessons by domain/module/slug
  styles/
    tokens.css             # Studio design tokens
    base.css               # Utilities (.btn, .card, .row, etc.)
    prose.css              # Lesson body + syntax highlight
    view-transitions.css   # Depth push motion
```

## TypeScript / JavaScript

**Imports**: Named exports (tree-shaking tốt hơn).

**Type safety**: Strict mode. Inject dependency (không hardcode `window.localStorage`). Validate input (parse, NFD normalize).

**Comment**: JSDoc module-level ("why", contract). Inline chỉ khi logic không rõ.

**Error handling**: Defensive parsing (kiểm `typeof`, `obj.v === 1`). Fallback graceful.

Ví dụ search-normalize:
```typescript
export function foldDiacritics(input: string): string {
  return input.toLowerCase()
    .replace(/đ/g, 'd')              // Đ/đ → d
    .normalize('NFD')                // Decompose
    .replace(/[̀-ͯ]/g, '');          // Strip diacritics
}
```

## Astro Component

**Cấu trúc**:
```astro
---
import { Icon } from '../icon/icon.astro';
interface Props { title: string; items: any[] }
const { title, items } = Astro.props;
---
<div>{title}</div>
<Icon name="search" size={20} />
<style>
  /* auto-scoped */
</style>
```

**Island** (tương tác): Ở `src/components/islands/`. Re-init trên `astro:page-load` (soft nav).

**Icon usage**: 
```astro
import Icon from '../icon/icon.astro';
<Icon name="bookmark" size={20} stroke-width={1.5} label="..." />
```
- Size trong px; no scaling, không relative
- `label` → `aria-label` nếu icon-only button
- Names: 25 core + aliases; unknown → `domains` fallback

**Command palette**: 
```astro
import CommandPalette from '../command-palette/command-palette.astro';
<CommandPalette />
```
Mount một lần trong body. Event: `document.dispatchEvent(new CustomEvent('omnilab:open-palette'))`; shortcut: Cmd/Ctrl+K.

**State-bearing islands** (mark-complete, bookmark): Bind **all** instances via `querySelectorAll([data-mcb] / [data-bb])`, subscribe progress store → click one flips all instances across pages + vice versa. **No duplicate ids/landmarks/links** — aside uses `aside-*-` prefix.

**Reader aside slot** (reader-layout.astro):
```astro
<Fragment slot="aside">
  <!-- Shown >=1280px, sticky, scroll independent -->
</Fragment>
```
Inline copies + `.hide-at-aside-width` (visible <1280px) → exactly one version visible always.

**Data attributes**: 
- `data-lesson-id={id}` (JS target)
- `data-aside-*` (aside-specific selector)
- `data-open-palette` (palette trigger button)
- `data-kbd-mod` (platform, for ⌘/Ctrl display)
- `data-rotate`, `data-theme` (icon, component-specific)

## CSS & Tokens

**Tokens** (`src/styles/tokens.css`): Studio palette (dark #0B0C0E / light #F3F4F6), Volt + domain hues, typography scale, spacing 4pt, motion 120–200ms, radius xs–xl, materials (glass + fallback solid), shell layout dimensions.

**VOLT RULE**: 
- `--volt` = **FILL ONLY** (buttons, indicators, disc badges) + `--on-volt` text (nearblack)
- `--volt-ink` = **TEXT variant** (links, eyebrows, active icons) — lime dark, olive light — dùng độc lập ở mọi surface
- Never `--volt` as text on light background

**Shared utilities** (`src/styles/base.css`) — **use these, don't custom CSS**:
- `.btn` / `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-sm` / `.btn-icon`: Buttons (44px min hit area)
- `.chip`: Filter pill (32px, `[aria-pressed=true]` = filled)
- `.card`: Surface + hairline + glow + shadow (radius 16)
- `.row`: 56px list row with `.idx` (mono index), `.tt` (b + small), `.chev` (chevron)
- `.bar`, `.seg`: Progress bar + segmented bar (`--p` width, `--c` color, `--n` columns)
- `.st`: Status dot (22px; `.done` disc, `.prog` arc %)
- `.field`: 46px input shell (icon + input + `.kbd` hint); border ≥3:1
- `.kbd` / `kbd`: Keycap hint (chỉ show nếu key thật hoạt động)
- `.eyebrow`: 11.5px mono uppercase label; `.b` = volt-ink accent
- `.mono` / `.tnum`: JetBrains Mono + tabular numerals
- `.dom-ic`: 40px domain icon tile, color `--c` (hue)
- `.tap-scale`: Press 0.985 scale feedback
- `.hide-at-aside-width`: Hidden ≥1280px (reader aside pattern)
- `.rise` / `ol-stagger-in`: Entrance stagger 30ms (page push dùng `ol-push-in` trong view-transitions.css — không trùng tên keyframe)
- `.sr-only`: Screen reader only

**Sử dụng tokens**: 
- Token cho mọi color, radius, space, duration, shadow (không hex/px magic)
- `--line-strong` cho control boundary ≥3:1. `--line-2`/`--line-3` = decorative chỉ
- `--gutter-l/r` cho safe area + notch (landscape)
- Motion: `--dur-1/2/3/4` (120–280ms), `--ease` (ease-out), `--stagger` (30ms per item)
- Hover states: bắt buộc `@media (hover: hover)` (desktop chỉ)
- Reduced motion: `@media (prefers-reduced-motion: reduce)` → duration 0.01ms (instant) or 120ms crossfade
- Contrast: Text ≥4.5:1 AA, control border ≥3:1; test via `token-contrast.test.mjs`

**Shiki dual-theme**: Light inline style, dark via `--shiki-dark-*` vars trong prose.css

**Specificity**: Class only, no `!important`. Astro auto-scopes.

## MDX (Bài học)

**Frontmatter**:
```mdx
---
domain: kien-truc
module: chu-de
order: 7
title: Bộ nhớ đệm (Cache)
summary: ...
examplesReviewed: false
source:
  snapshot: system-design/02-chu-de/07-cache.md
---
```

**RealLife** (≤90 từ, Việt Nam context, kết thúc "→ ..."):
```mdx
<RealLife title="Tủ lạnh ở nhà">
Nội dung ≤90 từ → liên kết ẩn dụ.
</RealLife>
```

**Figure**:
```mdx
import svg from '../../../../assets/illustrations/...svg?raw';
<Figure added svg={svg} alt="..." caption="..." />
```

**Verify-fidelity**: Loại bỏ RealLife/Figure/Disclaimer → so sánh snapshot (nội dung gốc phải giữ nguyên 100%).

## Testing

**Unit** (Vitest): `.test.mjs`, inject deps. Ví dụ:
```typescript
it('fold diacritics', () => {
  expect(foldDiacritics('bộ nhớ đệm')).toBe('bo nho dem');
});
```

**E2E** (Playwright): Test real browser, localStorage, private-mode fallback.

**Quality gate**: 
```bash
pnpm verify:fidelity  # Nội dung gốc bất biến (snapshot check)
pnpm test             # Toàn bộ test (Vitest) pass
pnpm check            # 0 errors (astro check + schema)
pnpm check:server     # Type-check server/sync (tsconfig.server.json, strict, erasableSyntaxOnly)
pnpm build            # Full build → verify:fidelity + astro build → dist/ (73 pages)
```

**Server (`server/sync/`)**: Node 24, chạy TypeScript bằng type stripping, nên chỉ dùng cú pháp erasable (không `enum`, không `namespace`, không parameter properties). Import tương đối giữ đuôi `.ts`. Module dùng chung với client (`src/lib/progress-state.ts`, `progress-merge.ts`, `progress-sync-types.ts`) phải là thuần, không DOM, không `window`. File mới nên dưới 200 dòng.

**Server (`server/tts/`)**: cùng quy ước với `server/sync/` (Node 24, type stripping, cú pháp erasable, import `.ts`, không npm dependency). Thêm: `speech-script-contract.ts` và `audio-manifest.ts` dùng chung giữa build, worker và trình duyệt nên phải thuần (không DOM, `window`, `astro:content`); tiến trình con (ffmpeg) chỉ nhận env tối thiểu (`PATH`), không bao giờ nhận `GEMINI_API_KEY`; khoá API chỉ đi vào header `x-goog-api-key`, không vào log, tên file hay thông báo lỗi (đã che). Ngưỡng vận hành không để người vận hành chỉnh nằm ở `server/tts/tts-config.ts`; mặc định giọng/model/cỡ đoạn nằm ở `server/tts/tts-defaults.ts`. Đổi quy tắc đọc ở bộ trích phải tăng `SPEECH_EXTRACTOR_VERSION`; đổi cách ghép hoặc nén audio phải tăng `AUDIO_PIPELINE_VERSION` (cả hai làm mọi bản nghe được tạo lại).

## Git & Commit

**Format**: `<type>(<scope>): <subject>`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`
- Subject: thì hiện tại ("add", không "added")
- Body: "why", không "what"
- Không ghi plan ID, phase number trong code comment

**Ví dụ**:
```
feat(search): implement Vietnamese diacritic folding via MiniSearch

Pagefind failed "bo nho dem" query (cache absent top 15).
MiniSearch + processTerm folding passes acceptance criteria.

fix(progress-store): [hidden] defeated by unconditional display rule

Added explicit .foo[hidden] { display: none; }.
```

**Không commit**: Secrets, `.env`, `node_modules/`, `dist/`, timestamp.

## CSP & Security

**Caddyfile** (repo, dùng cho VPS và Railpack):
- `script-src 'self'`: All external (vite.build.assetsInlineLimit: 0), no hashes
- `style-src 'self' 'unsafe-inline'`: Shiki inline style only
- `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`

**Kiểm chứng**: Sau build, grep `dist/**/*.html` tìm `<script>` không `src=` (should be 0).

## A11y

- Semantic HTML (`<button>`, `<nav>`, `<main>`, `<aside>`)
- `aria-label` cho icon-only button; `aria-labelledby` cho nav + aside (TOC)
- Focus/keyboard: tab + enter/space hoạt động; `:focus-visible` outline 2px accent
- SVG: `role="img"` + `aria-labelledby="title-id"`
- **Tap target**: ≥44px (min-height 44px + padding)
- **Contrast**: ≥4.5:1 AA (light + dark, all surfaces). Test: `token-contrast.test.mjs`
- **Reduced motion**: Respect `prefers-reduced-motion:reduce` (animation 0.01ms, no smooth-scroll)
- **TOC scrollspy**: `aria-current="location"` on active TOC link; scrollIntoView `instant` (no animation)

**Lighthouse**: Target ≥95 (xem QA report). Contrast tested 55 token pairs.

## Performance

**JS budget**: ≤30KB gzip/page. Home/domain/lesson: 6–7KB. Search: 13KB (includes MiniSearch).

**Nợ đã biết (mở)**: trang bài hiện tải 37,5KB gzip (đo mọi JS của một trang bài, gồm `prefs-init.js`), vượt budget. Mức nền trước trình phát nghe bài đã là 32,8KB; trình phát thêm ~4,35KB. Budget chưa được nâng; việc giảm phần nền theo dõi ở [project-roadmap.md](./project-roadmap.md). Component mới trên trang bài phải đo lại và không làm nợ này lớn thêm.

**Lazy-load**: search-index.json chỉ load trên /tim-kiem (first keystroke).

---

Xem chi tiết: [`docs/system-architecture.md`](./system-architecture.md), [`docs/codebase-summary.md`](./codebase-summary.md)
