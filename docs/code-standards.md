# Tiêu chuẩn code — OmniLab v1

## Tệp & Đặt tên

**Kebab-case**: `search-box-controller.ts`, `mark-complete-button.astro`, `progress-store.ts`. Tên dài là tốt (tự-ghi-chú cho LLM tools).

**Giới hạn kích thước**:
- Code file: <200 LOC (split tại ranh giới ngữ nghĩa)
- Test: cùng thư mục với source (`.test.mjs`)
- Markdown/JSON/config: không giới hạn

**Cấu trúc**:
```
src/
  components/islands/        # Interactive (ship client JS)
  lib/                       # TypeScript utils
  layouts/                   # Layout templates
  pages/                     # Routes (file-based)
  content/domains/           # YAML metadata
  content/lessons/           # MDX (domain/module/slug)
  styles/                    # tokens.css, prose.css
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
interface Props { title: string; items: any[] }
const { title, items } = Astro.props;
---
<div>{title}</div>
<style>
  /* auto-scoped */
</style>
```

**Island** (tương tác): Ở `src/components/islands/`. Re-init trên `astro:page-load` (soft nav).

**Data attribute**: `data-lesson-id={id}` (JS target), không dùng class.

## CSS

**Tokens** (`src/styles/tokens.css`):
```css
:root {
  --color-text: #111;
  --spacing-md: 1rem;
  --font-sans: "Be Vietnam Pro", sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root { --color-text: #f0f0f0; }
}
```

**Shiki dual-theme**: Light inline (`style="color: ..."`), dark via `--shiki-dark-*` vars (apply trong `prose.css`).

**Specificity**: Use class, tránh `!important`. Astro auto-scope.

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
pnpm verify:fidelity  # Nội dung gốc bất biến
pnpm test             # 174/174 pass
pnpm check            # 0 errors (astro check)
pnpm build            # Full build → verify:fidelity + astro build
```

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

**Caddyfile** (Railpack serve):
- `script-src 'self'`: All external (vite.build.assetsInlineLimit: 0), no hashes
- `style-src 'self' 'unsafe-inline'`: Shiki inline style only
- `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`

**Kiểm chứng**: Sau build, grep `dist/**/*.html` tìm `<script>` không `src=` (should be 0).

## A11y

- Semantic HTML (`<button>`, `<nav>`)
- `aria-label` cho icon-only button
- Focus/keyboard: tab + enter/space hoạt động
- SVG: `role="img"` + `aria-labelledby="title-id"`

**Lighthouse**: Target ≥95 (xem QA report).

## Performance

**JS budget**: ≤30KB gzip/page. Home/domain/lesson: 6–7KB. Search: 13KB (includes MiniSearch).

**Lazy-load**: search-index.json chỉ load trên /tim-kiem (first keystroke).

---

Xem chi tiết: [`docs/system-architecture.md`](./system-architecture.md), [`docs/codebase-summary.md`](./codebase-summary.md)
