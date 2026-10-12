/**
 * DOM wiring for account-sync-panel.astro (pattern: saved-list-controller.ts).
 * The ProgressSync client is injected so the logic is unit-testable with a
 * fake DOM. All dynamic text (usernames, server errors) goes through
 * textContent only - never innerHTML.
 */
import type { ProgressSync } from './progress-sync-contract';
import type { SyncStatus } from './progress-sync-types';
import {
  errorText,
  fieldOfCode,
  logoutFailureText,
  normalizeUsername,
  validateAuthForm,
  viewOf,
  type AuthMode,
  type PanelSection,
} from './account-sync-panel-view';
import { type AccountPanelElements } from './account-sync-panel-elements';
import { attachWipe } from './account-sync-panel-wipe';

export { errorText, fieldOfCode, logoutFailureText, sidebarAccountView, validateAuthForm, viewOf } from './account-sync-panel-view';
export { readAccountPanelElements, type AccountPanelElements } from './account-sync-panel-elements';

export interface AccountPanelDeps {
  /** Clears progress stored on this device only (progress store `clear()`). */
  clearLocalProgress: () => void;
}

const SECTIONS = ['checking', 'form', 'unavailable', 'merge', 'account'] as const;
const SUBMIT_LABEL: Record<AuthMode, string> = { login: 'Đăng nhập', register: 'Tạo tài khoản' };
const FIELDS = ['username', 'password', 'confirm'] as const;
const BUSY_CONTROLS = [
  'submit', 'merge-keep', 'merge-use', 'merge-cancel', 'logout', 'logout-all', 'login-tab', 'register-tab',
] as const;

/** Wires one panel instance; returns cleanup to run before re-init. */
export function attachAccountPanel(els: AccountPanelElements, sync: ProgressSync, deps: AccountPanelDeps): () => void {
  let mode: AuthMode = 'login';
  let busy = false;
  /** True while a user-triggered action runs: only then may focus move on a section change. */
  let acting = false;
  let status: SyncStatus = { kind: 'checking' };
  let lastSection: PanelSection | null = null;
  let lastTone: 'neutral' | 'error' = 'neutral';
  const cleanups: Array<() => void> = [];

  const on = (target: HTMLElement, type: string, fn: (e: Event) => void) => {
    target.addEventListener(type, fn);
    cleanups.push(() => target.removeEventListener(type, fn));
  };

  /** The one polite live line for things worth announcing (never for sync ticks). */
  const notify = (text: string) => {
    els.notice.textContent = text;
  };

  function clearInvalid() {
    for (const f of FIELDS) {
      els[f].removeAttribute('aria-invalid');
      els[f].removeAttribute('aria-describedby');
    }
  }

  function markInvalid(field: (typeof FIELDS)[number]) {
    clearInvalid();
    els[field].setAttribute('aria-invalid', 'true');
    els[field].setAttribute('aria-describedby', field === 'username' ? 'ap-hint ap-error' : 'ap-error');
  }

  function applyBusy(value: boolean) {
    busy = value;
    for (const n of BUSY_CONTROLS) els[n].disabled = value;
    els.submit.textContent = value ? 'Đang xử lý…' : SUBMIT_LABEL[mode];
  }

  function applyMode(next: AuthMode) {
    mode = next;
    els['confirm-row'].hidden = next === 'login';
    els.password.setAttribute('autocomplete', next === 'login' ? 'current-password' : 'new-password');
    els['login-tab'].setAttribute('aria-pressed', String(next === 'login'));
    els['register-tab'].setAttribute('aria-pressed', String(next === 'register'));
    els.submit.textContent = SUBMIT_LABEL[next];
    els.error.textContent = '';
    clearInvalid();
  }

  function render(next: SyncStatus) {
    status = next;
    const view = viewOf(next);
    for (const s of SECTIONS) els[s].hidden = s !== view.section;
    els['wipe-block'].hidden = view.section === 'checking' || view.section === 'merge';
    els.unavailable.textContent = view.section === 'unavailable' ? view.headline : '';
    if (view.section === 'merge') els['merge-text'].textContent = view.headline;
    if (view.section === 'account') {
      els['account-name'].textContent = view.headline;
      els['account-status'].textContent = view.detail;
      els['account-status'].setAttribute('data-tone', view.tone);
      els.avatar.textContent = view.initial;
      els.dot.setAttribute('data-state', view.dot);
      // Only a change into/out of the error state is announced, not every sync tick.
      if (view.tone === 'error') notify(view.detail);
      else if (lastTone === 'error') notify('');
    }
    lastTone = view.section === 'account' ? view.tone : 'neutral';
    if (view.section === 'form' && lastSection !== 'form') {
      applyMode(mode);
      els['clear-local'].checked = false;
    }
    if (lastSection !== view.section) moveFocus(view.section);
    lastSection = view.section;
  }

  /** Keeps keyboard/screen-reader users oriented when the control they used disappears. */
  function moveFocus(section: PanelSection) {
    if (section === 'merge') els['merge-title'].focus(); // must not be missed, even on boot
    else if (!acting) return;
    else if (section === 'account') els['account-name'].focus();
    else if (section === 'form') els.username.focus();
  }

  async function guarded(action: () => Promise<unknown>) {
    if (busy) return;
    applyBusy(true);
    acting = true;
    try {
      await action();
    } finally {
      acting = false;
      applyBusy(false);
    }
  }

  /** logout()/logoutAll() resolve even when the server refused: check the resulting status. */
  async function endSession(run: () => Promise<void>) {
    notify('');
    await run();
    const failure = logoutFailureText(status);
    if (failure) notify(failure);
  }

  on(els['login-tab'], 'click', () => !busy && applyMode('login'));
  on(els['register-tab'], 'click', () => !busy && applyMode('register'));
  for (const f of FIELDS) on(els[f], 'input', () => els[f].removeAttribute('aria-invalid'));

  on(els.form, 'submit', (e) => {
    e.preventDefault();
    if (busy) return;
    const values = { username: els.username.value, password: els.password.value, confirm: els.confirm.value };
    const problem = validateAuthForm(mode, values);
    if (problem) {
      els.error.textContent = errorText(problem.code);
      markInvalid(problem.field);
      els[problem.field].focus();
      return;
    }
    els.error.textContent = '';
    clearInvalid();
    const username = normalizeUsername(values.username);
    void guarded(async () => {
      const result =
        mode === 'login'
          ? await sync.login(username, values.password)
          : await sync.register(username, values.password, values.confirm);
      if (result.ok) {
        els.password.value = '';
        els.confirm.value = '';
      } else {
        els.error.textContent = errorText(result.code);
        const field = fieldOfCode(result.code);
        if (field) markInvalid(field);
      }
    });
  });

  on(els['merge-keep'], 'click', () => void guarded(() => sync.resolveMerge('merge')));
  on(els['merge-use'], 'click', () => void guarded(() => sync.resolveMerge('use-account')));
  // Cancel: sign out of the new account, local data untouched.
  on(els['merge-cancel'], 'click', () => void guarded(() => endSession(() => sync.logout({ clearLocal: false }))));
  on(els.logout, 'click', () =>
    void guarded(() => endSession(() => sync.logout({ clearLocal: els['clear-local'].checked }))),
  );
  on(els['logout-all'], 'click', () =>
    void guarded(() => endSession(() => sync.logoutAll({ clearLocal: els['clear-local'].checked }))),
  );

  const detachWipe = attachWipe(els, deps.clearLocalProgress, notify);
  const unsubscribe = sync.subscribe(render);
  return () => {
    unsubscribe();
    detachWipe();
    for (const c of cleanups) c();
  };
}
