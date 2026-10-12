/**
 * Reader aside: TOC scrollspy + reading-progress readout.
 *
 * Pure helpers (`pickActiveIndex`, `readingPercent`) hold the logic and are
 * unit-tested; `attachTocScrollspy` is the thin DOM binding (IntersectionObserver
 * + rAF-throttled scroll) used by lesson-aside.astro.
 */

/**
 * Index of the heading that is "current": the last one whose top edge has
 * reached the activation line (`offset` px from the viewport top). Returns -1
 * while the reader is still above the first heading. `tops` must be in
 * document order.
 */
export function pickActiveIndex(tops: readonly number[], offset: number): number {
  let active = -1;
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] <= offset) active = i;
    else break;
  }
  return active;
}

/** Whole-number reading progress 0-100; 0 when the page does not scroll. */
export function readingPercent(scrollY: number, scrollable: number): number {
  if (!Number.isFinite(scrollY) || !Number.isFinite(scrollable) || scrollable <= 0) return 0;
  return Math.round(Math.min(1, Math.max(0, scrollY / scrollable)) * 100);
}

/**
 * Scroll delta that brings [itemTop, itemBottom] fully inside
 * [boxTop, boxBottom] with the least movement (0 when already visible).
 * Items taller than the box align to the box top.
 */
export function nearestScrollDelta(itemTop: number, itemBottom: number, boxTop: number, boxBottom: number): number {
  if (itemTop < boxTop || itemBottom - itemTop > boxBottom - boxTop) return itemTop - boxTop;
  if (itemBottom > boxBottom) return itemBottom - boxBottom;
  return 0;
}

export interface ScrollspyOptions {
  /** Headings in document order. */
  headings: HTMLElement[];
  /** TOC links, same order and length as `headings`. */
  links: HTMLElement[];
  /** Distance (px) from the viewport top where a heading becomes current. */
  offset: number;
  /** Called with the reading percentage after each scroll tick. */
  onProgress?: (percent: number) => void;
  /**
   * Independently scrolling element holding the links (the sticky aside).
   * Only this element is scrolled to keep the active link visible — never
   * the page, so the scrollspy cannot fight the reader's own scrolling.
   */
  scrollContainer?: HTMLElement | null;
  /**
   * Called whenever the current heading changes (index -1 = above the first
   * heading) so callers can move a visual marker. Not called for no-op ticks.
   */
  onActiveChange?: (index: number, link: HTMLElement | null) => void;
}

/**
 * Highlights the TOC link of the current heading (`aria-current="location"`)
 * and reports reading progress. Returns a teardown function.
 */
export function attachTocScrollspy(opts: ScrollspyOptions): () => void {
  const { headings, links, offset, onProgress, scrollContainer, onActiveChange } = opts;
  if (headings.length === 0 || headings.length !== links.length) return () => {};

  let current = -2; // force the first paint
  function update() {
    const next = pickActiveIndex(
      headings.map((h) => h.getBoundingClientRect().top),
      offset,
    );
    if (next === current) return;
    current = next;
    links.forEach((link, i) => {
      if (i === next) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    onActiveChange?.(next, next >= 0 ? links[next] : null);
    // Keep the active entry visible when the TOC itself scrolls (long lists).
    // Element.scrollIntoView would also scroll the window whenever the link
    // sits outside the viewport, yanking the page mid-read; adjust only the
    // container. Skipped while the container is display:none (zero rect).
    if (next >= 0 && scrollContainer && scrollContainer.clientHeight > 0) {
      const box = scrollContainer.getBoundingClientRect();
      const item = links[next].getBoundingClientRect();
      const delta = nearestScrollDelta(item.top, item.bottom, box.top, box.bottom);
      if (delta !== 0) scrollContainer.scrollTop += delta;
    }
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
      if (onProgress) {
        const doc = document.documentElement;
        onProgress(readingPercent(window.scrollY, doc.scrollHeight - doc.clientHeight));
      }
    });
  }

  // IntersectionObserver reacts to headings entering/leaving the viewport
  // (including layout shifts and resizes that fire no scroll event); the
  // scroll listener covers fast jumps where a heading skips the viewport.
  const observer =
    typeof IntersectionObserver === 'function' ? new IntersectionObserver(update, { threshold: [0, 1] }) : null;
  headings.forEach((h) => observer?.observe(h));
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
  onProgress?.(readingPercent(window.scrollY, document.documentElement.scrollHeight - document.documentElement.clientHeight));

  return () => {
    observer?.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}
