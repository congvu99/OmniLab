/**
 * Pure-ish DOM update for one progress-ring.astro instance (see that file's
 * DOM contract: `.progress-ring-slot[data-domain]` containing
 * `[data-progress-ring-fill]`/`[data-progress-ring-text]`/optional
 * `[data-progress-ring-fraction]`). Takes a minimal DOM-like interface
 * (not the full `HTMLElement`) so this is unit-testable without jsdom — see
 * tests/progress-ring-apply.test.mjs. Shared by domain-card.astro and
 * domain-hero.astro's own bootstrap scripts (each page only ever renders
 * one of the two, so each carries its own tiny `<script>` — see phase-05
 * report re: file-ownership constraints that ruled out a shared page-level
 * decorator island here).
 */
import type { ProgressState } from './progress-state';
import type { LessonIndexEntry } from './lessons-index-client';

export interface RingElementLike {
  dataset: { domain?: string };
  setAttribute(name: string, value: string): void;
  querySelector<T>(selector: string): T | null;
}

export interface RingCircleLike {
  getAttribute(name: string): string | null;
  style: { strokeDasharray: string; strokeDashoffset: string };
}

export interface RingTextLike {
  textContent: string | null;
}

export function applyProgressRing(
  ring: RingElementLike,
  state: ProgressState,
  lessons: Pick<LessonIndexEntry, 'id' | 'domain'>[],
): void {
  const domainId = ring.dataset.domain;
  if (!domainId) return;

  const domainLessons = lessons.filter((l) => l.domain === domainId);
  const total = domainLessons.length;
  const done = domainLessons.filter((l) => state.lessons[l.id]?.done).length;
  const ratio = total > 0 ? done / total : 0;
  const percent = Math.round(ratio * 100);

  const fill = ring.querySelector<RingCircleLike>('[data-progress-ring-fill]');
  if (fill) {
    const r = Number(fill.getAttribute('r'));
    const circumference = 2 * Math.PI * r;
    fill.style.strokeDasharray = `${circumference}`;
    fill.style.strokeDashoffset = `${circumference * (1 - ratio)}`;
  }

  const text = ring.querySelector<RingTextLike>('[data-progress-ring-text]');
  if (text) text.textContent = `${percent}%`;

  const fraction = ring.querySelector<RingTextLike>('[data-progress-ring-fraction]');
  if (fraction) fraction.textContent = `${done}/${total} bài`;

  ring.setAttribute('aria-label', `Đã hoàn thành ${done} trên ${total} bài — ${percent} phần trăm`);
}
