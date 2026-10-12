/**
 * DOM wiring for account-sync-panel.astro (pattern: saved-list-controller.ts).
 * The ProgressSync client is injected so the logic is unit-testable with a
 * fake DOM. All dynamic text (usernames, server errors) goes through
 * textContent only - never innerHTML.
 */
import type { ProgressSync } from './progress-sync-contract';
import type { SyncStatus } from './progress-sync-types';
import {
  normalizeUsername,
  validateAuthForm,
  viewOf,
  errorText,
  type AuthMode,
  type PanelSection,
} from './account-sync-panel-view';

export { errorText, validateAuthForm, viewOf } from './account-sync-panel-view';

const NAMES = [
  'checking', 'form', 'unavailable', 'merge', 'account', 'login-tab', 'register-tab', 'username',
  'password', 'confirm', 'confirm-row', 'submit', 'error', 'merge-text', 'merge-keep', 'merge-use',
  'merge-title', 'account-name', 'account-status', 'logout', 'logout-all', 'clear-local',
] as const;
type Name = (typeof NAMES)[number];
export type AccountPanelElements = Record<Name, HTMLElement & HTMLInputElement & HTMLButtonElement & HTMLFormElement>;

const SECTIONS: PanelSection[] = ['checking', 'form', 'unavailable', 'merge', 'account'];
const SUBMIT_LABEL: Record<AuthMode, string> = { login: 'Đăng nhập', register: 'Tạo tài khoản' };

/** Collects `[data-ap="name"]` nodes; `null` if any is missing. */
export function readAccountPanelElements(root: Pick<ParentNode, 'querySelector'>): AccountPanelElements | null {
  const out: Partial<AccountPanelElements> = {};
  for (const n of NAMES) {
    const node = root.querySelector(`[data-ap="${n}"]`);
    if (!node) return null;
    out[n] = node as AccountPanelElements[Name];
  }
  return out as AccountPanelElements;
}

/** Wires one panel instance; returns cleanup to run before re-init. */
export function attachAccountPanel(els: AccountPanelElements, sync: ProgressSync): () => void {
  let mode: AuthMode = 'login';
  let busy = false;
  let lastSection: PanelSection | null = null;
  const cleanups: Array<() => void> = [];

  function on(target: HTMLElement, type: string, fn: (e: Event) => void) {
    target.addEventListener(type, fn);
    cleanups.push(() => target.removeEventListener(type, fn));
  }

  function applyBusy(value: boolean) {
    busy = value;
    for (const n of ['submit', 'merge-keep', 'merge-use', 'logout', 'logout-all', 'login-tab', 'register-tab'] as const) {
      els[n].disabled = value;
    }
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
  }

  function render(status: SyncStatus) {
    const view = viewOf(status);
    for (const s of SECTIONS) els[s].hidden = s !== view.section;
    els.unavailable.textContent = view.section === 'unavailable' ? view.headline : '';
    if (view.section === 'merge') {
      els['merge-text'].textContent = view.headline;
    }
    if (view.section === 'account') {
      els['account-name'].textContent = view.headline;
      els['account-status'].textContent = view.detail;
      els['account-status'].setAttribute('data-tone', view.tone);
    }
    if (view.section === 'form' && lastSection !== 'form') {
      applyMode(mode);
      els['clear-local'].checked = false;
    }
    // A merge prompt must not be missed: move focus to it when it appears.
    if (view.section === 'merge' && lastSection !== 'merge') els['merge-title'].focus();
    lastSection = view.section;
  }

  async function guarded(action: () => Promise<unknown>) {
    if (busy) return;
    applyBusy(true);
    try {
      await action();
    } finally {
      applyBusy(false);
    }
  }

  on(els['login-tab'], 'click', () => !busy && applyMode('login'));
  on(els['register-tab'], 'click', () => !busy && applyMode('register'));

  on(els.form, 'submit', (e) => {
    e.preventDefault();
    if (busy) return;
    const values = { username: els.username.value, password: els.password.value, confirm: els.confirm.value };
    const problem = validateAuthForm(mode, values);
    if (problem) {
      els.error.textContent = errorText(problem.code);
      els[problem.field].focus();
      return;
    }
    els.error.textContent = '';
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
      }
    });
  });

  on(els['merge-keep'], 'click', () => void guarded(() => sync.resolveMerge('merge')));
  on(els['merge-use'], 'click', () => void guarded(() => sync.resolveMerge('use-account')));
  on(els.logout, 'click', () => void guarded(() => sync.logout({ clearLocal: els['clear-local'].checked })));
  on(els['logout-all'], 'click', () => void guarded(() => sync.logoutAll()));

  const unsubscribe = sync.subscribe(render);
  return () => {
    unsubscribe();
    for (const c of cleanups) c();
  };
}
