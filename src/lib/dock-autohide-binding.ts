/**
 * DOM binding for the reader's auto-hiding dock (decision logic lives in
 * dock-autohide.ts). Active only below 1024px, where the dock exists.
 *
 * Hidden state is exposed as `data-scroll-hidden` on the dock (CSS slides /
 * fades it) plus the `inert` property, so a hidden dock is neither focusable
 * nor read by assistive tech. Keyboard users get it back on Tab (revealed
 * before focus moves, so the first dock link can take it) and on any focus
 * landing inside the dock.
 *
 * Returns a cleanup that removes every listener; callers run it before the
 * next soft navigation (see page-lifecycle.ts) so listeners never stack up.
 */
import { createDockScrollState, stepDockScroll, type DockScrollState } from './dock-autohide';

const MOBILE_QUERY = '(max-width: 1023.98px)';

export function bindDockAutohide(bar: HTMLElement): () => void {
  const mq = window.matchMedia(MOBILE_QUERY);
  let state: DockScrollState = createDockScrollState(window.scrollY);
  let frame = 0;
  // Programmatic scrolls (resume position restore in reader-progress-tracker,
  // router back/forward restore) are a downward jump from 0 that would hide
  // the dock the moment a lesson opens. Until the user touches / wheels /
  // presses a key, scroll samples only re-anchor the state.
  let userDriven = false;
  const onUserInput = () => {
    userDriven = true;
  };

  const apply = (hidden: boolean) => {
    bar.dataset.scrollHidden = hidden ? 'true' : 'false';
    bar.inert = hidden;
  };

  const sample = () => {
    frame = 0;
    if (!mq.matches) return;
    if (!userDriven) {
      state = createDockScrollState(window.scrollY);
      return;
    }
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    const next = stepDockScroll(state, window.scrollY, maxY);
    if (next.hidden !== state.hidden) apply(next.hidden);
    state = next;
  };

  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(sample);
  };

  const reveal = () => {
    if (!state.hidden) return;
    // Re-anchor at the current position so the next downward scroll has to
    // travel again before it hides the dock a second time.
    state = { ...createDockScrollState(window.scrollY), hidden: false };
    apply(false);
  };

  const onKeyDown = (ev: KeyboardEvent) => {
    userDriven = true;
    if (ev.key === 'Tab' && mq.matches) reveal();
  };

  const onMediaChange = () => {
    state = createDockScrollState(window.scrollY);
    apply(false);
  };

  apply(false);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('touchstart', onUserInput, { passive: true });
  window.addEventListener('wheel', onUserInput, { passive: true });
  window.addEventListener('pointerdown', onUserInput, { passive: true });
  bar.addEventListener('focusin', reveal);
  mq.addEventListener('change', onMediaChange);

  return () => {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('touchstart', onUserInput);
    window.removeEventListener('wheel', onUserInput);
    window.removeEventListener('pointerdown', onUserInput);
    bar.removeEventListener('focusin', reveal);
    mq.removeEventListener('change', onMediaChange);
    bar.inert = false;
    delete bar.dataset.scrollHidden;
  };
}
