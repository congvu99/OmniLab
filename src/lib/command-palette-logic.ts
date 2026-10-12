/**
 * Pure logic for the ⌘K command palette (no DOM, no fetch) so it is unit-testable:
 * quick-action list building, query filtering of those actions, result
 * ranking/limiting and the keyboard selection state machine.
 */
import { foldDiacritics } from './search-normalize';
import { navItems } from '../components/shell/nav-items';
import type { LessonIndexEntry } from './lessons-index-client';
import type { SearchResult } from './search-index';

export const MAX_RESULTS = 8;

export type PaletteGroup = 'Tiếp tục' | 'Điều hướng' | 'Lĩnh vực' | 'Bài học';

export interface PaletteItem {
  /** Stable DOM id suffix / dedupe key. */
  key: string;
  group: PaletteGroup;
  title: string;
  /** Right-aligned secondary text (domain, minutes, ...). */
  meta: string;
  url: string;
  /** Per-domain accent (search results only); undefined falls back to CSS default. */
  accent?: string;
  accentDark?: string;
  /** Folded MiniSearch terms, for title highlighting (search results only). */
  terms?: string[];
}

export function buildTabItems(): PaletteItem[] {
  return navItems.map((n) => ({ key: `tab:${n.href}`, group: 'Điều hướng', title: n.label, meta: 'Trang', url: n.href }));
}

/** Distinct domains derived from the (light) lessons index, in index order. */
export function buildDomainItems(lessons: readonly LessonIndexEntry[]): PaletteItem[] {
  const seen = new Map<string, PaletteItem>();
  const counts = new Map<string, number>();
  for (const l of lessons) {
    counts.set(l.domain, (counts.get(l.domain) ?? 0) + 1);
    if (!seen.has(l.domain)) {
      seen.set(l.domain, { key: `domain:${l.domain}`, group: 'Lĩnh vực', title: l.domainTitle, meta: '', url: `/linh-vuc/${l.domain}` });
    }
  }
  for (const [id, item] of seen) item.meta = `${counts.get(id)} bài`;
  return [...seen.values()];
}

export function buildContinueItem(lessons: readonly LessonIndexEntry[], lessonId: string | null): PaletteItem[] {
  if (!lessonId) return [];
  const l = lessons.find((x) => x.id === lessonId);
  if (!l) return [];
  return [{ key: `continue:${l.id}`, group: 'Tiếp tục', title: l.title, meta: `${l.domainTitle} · ${l.readingMinutes}′`, url: l.url }];
}

/** Empty-query list: continue-reading, the 4 tabs, then the domains. */
export function buildQuickActions(lessons: readonly LessonIndexEntry[], continueLessonId: string | null): PaletteItem[] {
  return [...buildContinueItem(lessons, continueLessonId), ...buildTabItems(), ...buildDomainItems(lessons)];
}

/** Accent-insensitive substring filter for tabs/domains when a query is typed. */
export function filterActions(items: readonly PaletteItem[], query: string): PaletteItem[] {
  const q = foldDiacritics(query.trim());
  if (!q) return [...items];
  return items.filter((i) => foldDiacritics(i.title).includes(q));
}

export function resultToItem(r: SearchResult): PaletteItem {
  return {
    key: `lesson:${r.id}`,
    group: 'Bài học',
    title: r.title,
    meta: r.domainTitle,
    url: r.url,
    accent: r.domainAccent,
    accentDark: r.domainAccentDark,
    terms: r.terms,
  };
}

/**
 * Query-state list: matching tabs/domains first (cheap, exact intent), then
 * ranked lesson results (MiniSearch order preserved), capped at `limit` total.
 */
export function buildQueryItems(
  actions: readonly PaletteItem[],
  results: readonly SearchResult[],
  query: string,
  limit = MAX_RESULTS,
): PaletteItem[] {
  const nav = filterActions(
    actions.filter((a) => a.group === 'Điều hướng' || a.group === 'Lĩnh vực'),
    query,
  ).slice(0, 3);
  const lessons = results.map(resultToItem).slice(0, Math.max(0, limit - nav.length));
  return [...nav, ...lessons].slice(0, limit);
}

/* ---------------- keyboard state machine ---------------- */

export interface PaletteKeyState {
  open: boolean;
  selected: number;
  count: number;
}

export type PaletteKeyAction = 'none' | 'open' | 'close' | 'move' | 'activate';

export interface KeyInput {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  isComposing?: boolean;
}

export function isToggleShortcut(e: KeyInput): boolean {
  return (!!e.metaKey || !!e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k';
}

/** Wrap-around selection; 0 when the list is empty. */
export function moveSelection(selected: number, delta: number, count: number): number {
  if (count <= 0) return 0;
  return (((selected + delta) % count) + count) % count;
}

export function reduceKey(state: PaletteKeyState, e: KeyInput): { state: PaletteKeyState; action: PaletteKeyAction; preventDefault: boolean } {
  if (isToggleShortcut(e)) {
    return { state: { ...state, open: !state.open, selected: 0 }, action: state.open ? 'close' : 'open', preventDefault: true };
  }
  if (!state.open || e.isComposing) return { state, action: 'none', preventDefault: false };
  switch (e.key) {
    case 'Escape':
      return { state: { ...state, open: false }, action: 'close', preventDefault: true };
    case 'ArrowDown':
      return { state: { ...state, selected: moveSelection(state.selected, 1, state.count) }, action: 'move', preventDefault: true };
    case 'ArrowUp':
      return { state: { ...state, selected: moveSelection(state.selected, -1, state.count) }, action: 'move', preventDefault: true };
    case 'Home':
      return { state: { ...state, selected: 0 }, action: 'move', preventDefault: true };
    case 'End':
      return { state: { ...state, selected: Math.max(0, state.count - 1) }, action: 'move', preventDefault: true };
    case 'Enter':
      return { state, action: state.count > 0 ? 'activate' : 'none', preventDefault: true };
    default:
      return { state, action: 'none', preventDefault: false };
  }
}
