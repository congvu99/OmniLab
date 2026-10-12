/**
 * Reader toast controller (markup: src/components/lesson/reader-toast.astro,
 * mounted once by reader-layout). One toast at a time: a new call replaces the
 * visible one. Elements are looked up per call because the router swaps <body>
 * on every navigation, so nothing DOM-related is cached across pages.
 *
 * Accessibility: the visible card is aria-hidden; the message is announced via
 * a separate permanently-rendered live region (toggling [hidden] and text on
 * the same node in one tick is unreliable for screen readers). The auto-dismiss
 * timer pauses while the pointer or keyboard focus is on the toast so "Hoàn
 * tác" cannot vanish mid-reach (WCAG 2.2.1).
 */

import { prefersReducedMotion } from './reduced-motion';

export type ReaderToastIcon = 'check' | 'bookmark' | 'close';

export interface ReaderToastOptions {
  icon: ReaderToastIcon;
  title: string;
  sub?: string;
  /** When set, a "Hoàn tác" button is shown; it runs this then dismisses. */
  onUndo?: () => void;
  durationMs?: number;
}

const DEFAULT_DURATION_MS = 4000;
const EASE = 'cubic-bezier(.2,.8,.2,1)';

let timer: ReturnType<typeof setTimeout> | undefined;
let undoHandler: (() => void) | undefined;
let bound: HTMLElement | null = null;

const reducedMotion = prefersReducedMotion;

function parts() {
  const root = document.querySelector<HTMLElement>('[data-rt]');
  if (!root) return null;
  return {
    root,
    title: root.querySelector<HTMLElement>('[data-rt-title]'),
    sub: root.querySelector<HTMLElement>('[data-rt-sub]'),
    undo: root.querySelector<HTMLButtonElement>('[data-rt-undo]'),
    announce: document.querySelector<HTMLElement>('[data-rt-announce]'),
  };
}

function animateIn(root: HTMLElement) {
  root.getAnimations().forEach((a) => a.cancel());
  if (reducedMotion()) {
    root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 });
    return;
  }
  root.animate(
    [
      { opacity: 0, transform: 'translate(-50%, 14px) scale(.96)' },
      { opacity: 1, transform: 'translate(-50%, 0) scale(1)' },
    ],
    { duration: 200, easing: EASE },
  );
}

/** Hides the toast (animated out unless `immediate`). Safe to call when none is open. */
export function hideReaderToast(immediate = false): void {
  clearTimeout(timer);
  undoHandler = undefined;
  const p = parts();
  if (!p || p.root.hidden) return;
  const { root } = p;
  // Hand focus back to the page instead of dropping it to <body>.
  const hadFocus = root.contains(document.activeElement);
  const finish = () => {
    root.hidden = true;
    if (hadFocus) document.querySelector<HTMLElement>('[data-mcb-button]')?.focus();
  };
  if (immediate) {
    root.getAnimations().forEach((a) => a.cancel());
    finish();
    return;
  }
  const out = root.animate(
    reducedMotion()
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [
          { opacity: 1, transform: 'translate(-50%, 0)' },
          { opacity: 0, transform: 'translate(-50%, 6px)' },
        ],
    { duration: reducedMotion() ? 120 : 160, easing: EASE },
  );
  out.finished.then(finish, finish);
}

function schedule(ms: number) {
  clearTimeout(timer);
  timer = setTimeout(() => hideReaderToast(), ms);
}

function bindOnce(root: HTMLElement, durationMs: number) {
  if (bound === root) return;
  bound = root;
  const pause = () => clearTimeout(timer);
  const resume = (ev: Event) => {
    const next = (ev as FocusEvent).relatedTarget;
    if (next instanceof Node && root.contains(next)) return;
    if (ev.type === 'pointerleave' && root.contains(document.activeElement)) return;
    if (!root.hidden) schedule(durationMs);
  };
  root.addEventListener('focusin', pause);
  root.addEventListener('focusout', resume);
  // Mouse only: touch fires a synthetic enter with no reliable leave.
  root.addEventListener('pointerenter', (ev) => ev.pointerType === 'mouse' && pause());
  root.addEventListener('pointerleave', (ev) => ev.pointerType === 'mouse' && resume(ev));
  root.querySelector<HTMLButtonElement>('[data-rt-undo]')?.addEventListener('click', () => {
    const run = undoHandler;
    hideReaderToast();
    run?.();
  });
}

export function showReaderToast(opts: ReaderToastOptions): void {
  const p = parts();
  if (!p || !p.title) return;
  const durationMs = opts.durationMs ?? DEFAULT_DURATION_MS;
  bindOnce(p.root, durationMs);

  p.root.dataset.icon = opts.icon;
  p.title.textContent = opts.title;
  if (p.sub) {
    p.sub.textContent = opts.sub ?? '';
    p.sub.hidden = !opts.sub;
  }
  undoHandler = opts.onUndo;
  if (p.undo) p.undo.hidden = !opts.onUndo;
  if (p.announce) p.announce.textContent = opts.sub ? `${opts.title}. ${opts.sub}` : opts.title;

  p.root.hidden = false;
  animateIn(p.root);
  schedule(durationMs);
}

/** Router swaps <body>; drop timers/handlers that point into the old page. */
export function resetReaderToast(): void {
  clearTimeout(timer);
  undoHandler = undefined;
  bound = null;
}
