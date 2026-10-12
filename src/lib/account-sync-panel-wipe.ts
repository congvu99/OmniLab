/**
 * "Xoá tiến độ trên máy" two-step flow: first click only reveals the
 * confirmation; the second, explicit click clears local progress. The server
 * copy of an account is never touched here.
 */
import type { AccountPanelElements } from './account-sync-panel-elements';

export function attachWipe(
  els: AccountPanelElements,
  clearLocalProgress: () => void,
  announce: (text: string) => void,
): () => void {
  const subs: Array<() => void> = [];
  const on = (t: HTMLElement, type: string, fn: (e: Event) => void) => {
    t.addEventListener(type, fn);
    subs.push(() => t.removeEventListener(type, fn));
  };

  function close(refocus: boolean) {
    els['wipe-confirm'].hidden = true;
    els.wipe.setAttribute('aria-expanded', 'false');
    if (refocus) els.wipe.focus();
  }

  on(els.wipe, 'click', () => {
    els['wipe-confirm'].hidden = false;
    els.wipe.setAttribute('aria-expanded', 'true');
    // Default focus goes to the safe choice.
    els['wipe-no'].focus();
  });
  on(els['wipe-no'], 'click', () => close(true));
  on(els['wipe-confirm'], 'keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Escape') close(true);
  });
  on(els['wipe-yes'], 'click', () => {
    clearLocalProgress();
    close(true);
    announce('Đã xoá tiến độ trên máy này.');
  });

  return () => {
    for (const s of subs) s();
  };
}
