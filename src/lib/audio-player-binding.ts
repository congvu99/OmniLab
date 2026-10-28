/**
 * Thin DOM binding of the lesson audio player (lesson-audio-player.astro +
 * lesson-audio-mini-bar.astro). Only when the manifest has this lesson: fills
 * the card, adds "listen" buttons after matching `h2`/`h3`, binds every
 * `[data-audio-ui]` copy to one controller, shows the mini bar while playing
 * with the card off screen. Manifest text is assigned with textContent only.
 */
import type { AudioEntry } from './audio-manifest';
import { audioSourceUrl, fetchLessonAudioEntry } from './audio-manifest-client';
import { createAudioPositionStore } from './audio-position-store';
import { createAudioPlayerController } from './audio-player-controller';
import { formatClock, formatListenMinutes, headingButtonLabel, PLAYER_MESSAGES, resolveAudioView, SKIP_SECONDS } from './audio-player-logic';
import type { AudioView, MediaSessionAdapter, PlayerSnapshot } from './audio-player-logic';

const HEADING_TEXT = { 2: PLAYER_MESSAGES.headingChapter, 3: PLAYER_MESSAGES.headingMark } as const;

interface PlayerParts {
  article: HTMLElement;
  card: HTMLElement;
  audio: HTMLAudioElement;
  live: HTMLElement | null;
  mini: HTMLElement | null;
}

function findParts(): PlayerParts | null {
  const article = document.querySelector<HTMLElement>('.lesson-article[data-lesson-id][data-script-hash]');
  const card = document.querySelector<HTMLElement>('[data-audio-player]');
  const audio = card?.querySelector<HTMLAudioElement>('audio[data-audio-el]');
  if (!article || !card || !audio) return null;
  const live = document.querySelector<HTMLElement>('[data-audio-live]');
  return { article, card, audio, live, mini: document.querySelector<HTMLElement>('[data-audio-mini]') };
}

function setText(root: ParentNode, selector: string, text: string): void {
  const el = root.querySelector(selector);
  if (el) el.textContent = text;
}

/** Clones a server-rendered `<template>` so Astro's scoped styles still apply. */
function cloneTemplate(card: HTMLElement, name: string): HTMLElement | null {
  const node = card.querySelector<HTMLTemplateElement>(`template[data-audio-${name}-template]`)?.content.firstElementChild?.cloneNode(true);
  return node instanceof HTMLElement ? node : null;
}

function fillChapterList(card: HTMLElement, view: AudioView): HTMLButtonElement[] {
  const list = card.querySelector('[data-audio-chapters]');
  setText(card, '[data-audio-chapter-count]', String(view.chapters.length));
  const buttons: HTMLButtonElement[] = [];
  for (const [index, chapter] of view.chapters.entries()) {
    const item = cloneTemplate(card, 'chapter');
    const button = item?.querySelector('button');
    if (!item || !button) continue;
    button.dataset.chapterIndex = String(index);
    button.dataset.depth = String(chapter.depth);
    setText(item, '[data-audio-chapter-time]', formatClock(chapter.startSec));
    setText(item, '[data-audio-chapter-title]', chapter.title);
    if (!chapter.approx) item.querySelector('[data-audio-chapter-approx]')?.remove();
    list?.append(item);
    buttons.push(button);
  }
  return buttons;
}

function insertHeadingButtons({ article, card }: PlayerParts, view: AudioView): HTMLElement[] {
  const inserted: HTMLElement[] = [];
  for (const [index, chapter] of view.chapters.entries()) {
    const heading = chapter.hasHeadingButton ? document.getElementById(chapter.id) : null;
    const button = heading && article.contains(heading) ? cloneTemplate(card, 'heading') : null;
    if (!heading || !button) continue;
    button.dataset.chapterIndex = String(index);
    setText(button, '[data-audio-heading-label]', HEADING_TEXT[chapter.depth]);
    button.setAttribute('aria-label', headingButtonLabel(chapter.depth, chapter.title, chapter.approx));
    heading.after(button);
    inserted.push(button);
  }
  return inserted;
}

function pageHeadings(article: HTMLElement) {
  return Array.from(article.querySelectorAll<HTMLElement>('.lesson-body h2[id], .lesson-body h3[id]'), (h) => ({
    id: h.id,
    depth: h.tagName === 'H2' ? 2 : 3,
  }));
}

function mount(parts: PlayerParts, entry: AudioEntry, mediaSession?: MediaSessionAdapter): () => void {
  const { article, card, audio, mini } = parts;
  const view = resolveAudioView(entry, article.dataset.scriptHash ?? '', pageHeadings(article));
  const uis = Array.from(document.querySelectorAll<HTMLElement>('[data-audio-ui]'));
  const chapterButtons = fillChapterList(card, view);
  const headingButtons = insertHeadingButtons(parts, view);
  const rateSelect = card.querySelector<HTMLSelectElement>('[data-audio-rate]');
  const errorText = card.querySelector<HTMLElement>('[data-audio-error]');
  const note = card.querySelector<HTMLElement>('[data-audio-note]');
  if (note) note.hidden = !view.isPreviousVersion;
  setText(card, '[data-audio-duration]', formatListenMinutes(entry.durationSec));

  let cardInView = true;
  let last: PlayerSnapshot | null = null;

  function render(s: PlayerSnapshot): void {
    last = s;
    const time = `${formatClock(s.position)} / ${formatClock(s.duration)}`;
    for (const ui of uis) {
      ui.dataset.playing = String(s.playing);
      ui.querySelector('[data-audio-action="toggle"]')?.setAttribute('aria-label', s.playing ? PLAYER_MESSAGES.pause : PLAYER_MESSAGES.play);
      setText(ui, '[data-audio-time]', time);
      setText(ui, '[data-audio-now-title]', view.chapters[s.chapterIndex]?.title ?? '');
    }
    card.style.setProperty('--audio-progress', `${s.duration > 0 ? Math.min(100, (s.position / s.duration) * 100) : 0}%`);
    if (rateSelect) rateSelect.value = String(s.rate);
    if (errorText) errorText.hidden = !s.hasError;
    chapterButtons.forEach((b, i) => {
      if (i === s.chapterIndex) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    if (mini) mini.hidden = !(s.playing && !cardInView);
  }

  const controller = createAudioPlayerController({
    audio,
    entry,
    lessonId: article.dataset.lessonId ?? '',
    src: audioSourceUrl(entry),
    store: createAudioPositionStore(),
    metadata: { title: card.dataset.lessonTitle ?? '', album: card.dataset.domainTitle ?? '' },
    mediaSession,
    onChange: render,
    announce: (message) => {
      if (parts.live) parts.live.textContent = message;
    },
  });

  // Handlers call the controller synchronously: play() must stay inside the gesture (iOS).
  const onClick = (event: Event) => {
    const target = (event.target as Element | null)?.closest<HTMLElement>('[data-audio-action], [data-chapter-index]');
    const action = target?.dataset.audioAction;
    if (action === 'toggle') controller.togglePlay();
    else if (action === 'back') controller.skip(-SKIP_SECONDS);
    else if (action === 'forward') controller.skip(SKIP_SECONDS);
    else if (target?.dataset.chapterIndex) controller.playChapter(Number(target.dataset.chapterIndex));
  };
  const onRate = () => rateSelect && controller.setRate(Number(rateSelect.value));
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') controller.savePosition();
  };
  const onPageHide = () => controller.savePosition();
  const observer = new IntersectionObserver(([record]) => {
    cardInView = record?.isIntersecting ?? true;
    if (last) render(last);
  });

  const clickRoots = [...uis, ...headingButtons];
  clickRoots.forEach((el) => el.addEventListener('click', onClick));
  rateSelect?.addEventListener('change', onRate);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
  observer.observe(card);
  card.hidden = false;

  return () => {
    controller.dispose();
    observer.disconnect();
    clickRoots.forEach((el) => el.removeEventListener('click', onClick));
    rateSelect?.removeEventListener('change', onRate);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
    headingButtons.forEach((el) => el.remove());
    if (mini) mini.hidden = true;
  };
}

/**
 * Binds the current lesson page's player; returns the cleanup for
 * `onPageLoad`. Nothing shows unless the page has a `data-script-hash` and the
 * manifest has an entry for this lesson. `mediaSession` drives lock-screen controls.
 */
export function bindLessonAudioPlayer(mediaSession?: MediaSessionAdapter): () => void {
  const parts = findParts();
  if (!parts) return () => undefined;
  let disposed = false;
  let teardown: (() => void) | undefined;
  fetchLessonAudioEntry(parts.article.dataset.lessonId ?? '')
    .then((entry) => {
      if (!disposed && entry && parts.card.isConnected) teardown = mount(parts, entry, mediaSession);
    })
    .catch((error: unknown) => {
      // Markup out of sync with this binding: the page stays usable, the player hidden.
      console.warn('[audio] player not mounted', error);
    });
  return () => {
    disposed = true;
    teardown?.();
  };
}
