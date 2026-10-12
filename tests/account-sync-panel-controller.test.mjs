// Tests for src/lib/account-sync-panel-controller.ts: pure view-model mapping
// + validation, and DOM wiring against a hand-built fake DOM and a fake
// ProgressSync (same convention as saved-list-controller tests).
import { describe, expect, it, vi } from 'vitest';
import {
  attachAccountPanel,
  errorText,
  readAccountPanelElements,
  validateAuthForm,
  viewOf,
} from '../src/lib/account-sync-panel-controller.ts';

const ERROR_CODES = [
  'invalid_username', 'invalid_password', 'password_mismatch', 'username_taken', 'bad_credentials',
  'rate_limited', 'busy', 'unauthorized', 'too_large', 'unsupported_media', 'unavailable', 'bad_request',
];

describe('validateAuthForm', () => {
  const ok = { username: 'an_nguyen', password: 'matkhau123', confirm: 'matkhau123' };
  it('accepts valid login and register input', () => {
    expect(validateAuthForm('login', ok)).toBeNull();
    expect(validateAuthForm('register', ok)).toBeNull();
  });
  it('rejects usernames outside the server pattern', () => {
    for (const username of ['ab', 'Có Dấu', 'a'.repeat(33), 'x y z', '<img>']) {
      expect(validateAuthForm('login', { ...ok, username })).toEqual({
        code: 'invalid_username', field: 'username',
      });
    }
  });
  it('trims and case-folds the username before checking', () => {
    expect(validateAuthForm('login', { ...ok, username: '  An_Nguyen ' })).toBeNull();
  });
  it('rejects passwords shorter than 8 or longer than 128', () => {
    expect(validateAuthForm('login', { ...ok, password: '1234567' })?.field).toBe('password');
    expect(
      validateAuthForm('register', { ...ok, password: 'x'.repeat(129), confirm: 'x'.repeat(129) })?.code,
    ).toBe('invalid_password');
  });
  it('requires matching confirmation on register only', () => {
    expect(validateAuthForm('register', { ...ok, confirm: 'khac' })).toEqual({
      code: 'password_mismatch', field: 'confirm',
    });
    expect(validateAuthForm('login', { ...ok, confirm: '' })).toBeNull();
  });
});

describe('errorText', () => {
  it('has distinct non-empty Vietnamese text for every ErrorCode', () => {
    const texts = ERROR_CODES.map(errorText);
    for (const t of texts) expect(t.length).toBeGreaterThan(5);
    expect(new Set(texts).size).toBe(ERROR_CODES.length);
  });
  it('falls back for unknown codes', () => {
    expect(errorText('???')).toBe(errorText('bad_request'));
  });
});

describe('viewOf', () => {
  it('checking shows no form (no flash of logged-out UI)', () => {
    expect(viewOf({ kind: 'checking' }).section).toBe('checking');
  });
  it('signed-out shows the form', () => {
    expect(viewOf({ kind: 'signed-out' }).section).toBe('form');
  });
  it('unavailable shows only the small notice', () => {
    const v = viewOf({ kind: 'unavailable' });
    expect(v.section).toBe('unavailable');
    expect(v.headline).toBe('Chưa kết nối được máy chủ đồng bộ');
  });
  it('needs-merge-decision asks the explicit question with the username verbatim', () => {
    const v = viewOf({ kind: 'needs-merge-decision', username: '<img src=x>' });
    expect(v.section).toBe('merge');
    expect(v.headline).toBe('Máy này đang có tiến độ của tài khoản khác. Gộp vào tài khoản <img src=x>?');
    expect(v.username).toBe('<img src=x>');
  });
  it('syncing / synced / error map to account texts', () => {
    expect(viewOf({ kind: 'syncing', username: 'an' })).toMatchObject({
      section: 'account', headline: 'Đã đăng nhập: an', detail: 'Đang đồng bộ…',
    });
    const at = new Date(2026, 9, 12, 7, 5).getTime();
    expect(viewOf({ kind: 'synced', username: 'an', at }).detail).toBe('Đồng bộ lúc 07:05');
    const e = viewOf({ kind: 'error', username: 'an', code: 'too_large' });
    expect(e.tone).toBe('error');
    expect(e.detail).toContain(errorText('too_large'));
  });
});

// ---- fake DOM ----
function el(extra = {}) {
  const listeners = {};
  const attrs = {};
  return {
    hidden: false, disabled: false, textContent: '', value: '', checked: false, focused: 0,
    addEventListener(t, fn) { (listeners[t] ??= []).push(fn); },
    removeEventListener(t, fn) { listeners[t] = (listeners[t] ?? []).filter((f) => f !== fn); },
    setAttribute(k, v) { attrs[k] = v; },
    getAttribute: (k) => attrs[k] ?? null,
    focus() { this.focused++; },
    fire(t, ev = {}) { for (const fn of listeners[t] ?? []) fn({ preventDefault() {}, ...ev }); },
    listenerCount: (t) => (listeners[t] ?? []).length,
    ...extra,
  };
}
const NAMES = [
  'checking', 'form', 'unavailable', 'merge', 'account', 'login-tab', 'register-tab', 'username',
  'password', 'confirm', 'confirm-row', 'submit', 'error', 'merge-text', 'merge-keep', 'merge-use',
  'merge-title', 'account-name', 'account-status', 'logout', 'logout-all', 'clear-local',
];
function setup() {
  const nodes = Object.fromEntries(NAMES.map((n) => [n, el()]));
  const root = { querySelector: (sel) => nodes[/data-ap="([^"]+)"/.exec(sel)?.[1]] ?? null };
  let status = { kind: 'checking' };
  const subs = new Set();
  const sync = {
    subscribe: (fn) => { subs.add(fn); fn(status); return () => subs.delete(fn); },
    login: vi.fn(async () => ({ ok: true, username: 'an', needsMergeDecision: false })),
    register: vi.fn(async () => ({ ok: true, username: 'an', needsMergeDecision: false })),
    resolveMerge: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    logoutAll: vi.fn(async () => {}),
  };
  const push = (s) => { status = s; for (const fn of subs) fn(s); };
  const els = readAccountPanelElements(root);
  const cleanup = attachAccountPanel(els, sync);
  return { nodes, sync, push, cleanup, subs };
}
const fill = (n, u = 'an_nguyen', p = 'matkhau123', c = 'matkhau123') => {
  n.username.value = u; n.password.value = p; n.confirm.value = c;
};
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('readAccountPanelElements', () => {
  it('returns null when a required node is missing', () => {
    expect(readAccountPanelElements({ querySelector: () => null })).toBeNull();
  });
});

describe('attachAccountPanel', () => {
  it('shows only the checking section until status is known', () => {
    const { nodes, push } = setup();
    expect(nodes.checking.hidden).toBe(false);
    expect(nodes.form.hidden).toBe(true);
    push({ kind: 'signed-out' });
    expect(nodes.checking.hidden).toBe(true);
    expect(nodes.form.hidden).toBe(false);
  });

  it('unavailable hides the form', () => {
    const { nodes, push } = setup();
    push({ kind: 'unavailable' });
    expect(nodes.unavailable.hidden).toBe(false);
    expect(nodes.form.hidden).toBe(true);
    expect(nodes.unavailable.textContent).toBe('Chưa kết nối được máy chủ đồng bộ');
  });

  it('invalid input never calls the API, shows inline error and focuses the field', () => {
    const { nodes, sync, push } = setup();
    push({ kind: 'signed-out' });
    fill(nodes, 'a', 'x');
    nodes.form.fire('submit');
    expect(sync.login).not.toHaveBeenCalled();
    expect(nodes.error.textContent).toBe(errorText('invalid_username'));
    expect(nodes.username.focused).toBe(1);
  });

  it('login submits trimmed lowercase username', async () => {
    const { nodes, sync, push } = setup();
    push({ kind: 'signed-out' });
    fill(nodes, ' An_Nguyen ');
    nodes.form.fire('submit');
    await flush();
    expect(sync.login).toHaveBeenCalledWith('an_nguyen', 'matkhau123');
  });

  it('register mode shows confirm row, new-password autocomplete, and calls register', async () => {
    const { nodes, sync, push } = setup();
    push({ kind: 'signed-out' });
    expect(nodes['confirm-row'].hidden).toBe(true);
    nodes['register-tab'].fire('click');
    expect(nodes['confirm-row'].hidden).toBe(false);
    expect(nodes.password.getAttribute('autocomplete')).toBe('new-password');
    expect(nodes['register-tab'].getAttribute('aria-pressed')).toBe('true');
    fill(nodes);
    nodes.form.fire('submit');
    await flush();
    expect(sync.register).toHaveBeenCalledWith('an_nguyen', 'matkhau123', 'matkhau123');
    nodes['login-tab'].fire('click');
    expect(nodes.password.getAttribute('autocomplete')).toBe('current-password');
  });

  it('locks controls while a request is in flight and ignores re-submits', async () => {
    const { nodes, sync, push } = setup();
    push({ kind: 'signed-out' });
    let release;
    sync.login.mockImplementationOnce(() => new Promise((r) => { release = r; }));
    fill(nodes);
    nodes.form.fire('submit');
    nodes.form.fire('submit');
    expect(sync.login).toHaveBeenCalledTimes(1);
    expect(nodes.submit.disabled).toBe(true);
    release({ ok: false, code: 'bad_credentials' });
    await flush();
    expect(nodes.submit.disabled).toBe(false);
    expect(nodes.error.textContent).toBe(errorText('bad_credentials'));
  });

  it('clears password fields after success', async () => {
    const { nodes, push } = setup();
    push({ kind: 'signed-out' });
    fill(nodes);
    nodes.form.fire('submit');
    await flush();
    expect(nodes.password.value).toBe('');
    expect(nodes.error.textContent).toBe('');
  });

  it('merge decision: text via textContent, two explicit actions, never auto-resolves', async () => {
    const { nodes, sync, push } = setup();
    push({ kind: 'needs-merge-decision', username: '<b>x</b>' });
    expect(nodes.merge.hidden).toBe(false);
    expect(nodes['merge-text'].textContent).toContain('<b>x</b>');
    expect(sync.resolveMerge).not.toHaveBeenCalled();
    expect(nodes['merge-title'].focused).toBeGreaterThan(0);
    nodes['merge-keep'].fire('click');
    expect(sync.resolveMerge).toHaveBeenCalledWith('merge');
    await flush();
    nodes['merge-use'].fire('click');
    expect(sync.resolveMerge).toHaveBeenLastCalledWith('use-account');
  });

  it('signed-in shows name + status; logout passes clearLocal from the checkbox', async () => {
    const { nodes, sync, push } = setup();
    push({ kind: 'syncing', username: 'an' });
    expect(nodes.account.hidden).toBe(false);
    expect(nodes['account-name'].textContent).toBe('Đã đăng nhập: an');
    expect(nodes['account-status'].textContent).toBe('Đang đồng bộ…');
    nodes.logout.fire('click');
    expect(sync.logout).toHaveBeenCalledWith({ clearLocal: false });
    await flush();
    nodes['clear-local'].checked = true;
    nodes.logout.fire('click');
    expect(sync.logout).toHaveBeenLastCalledWith({ clearLocal: true });
  });

  it('logout-all calls logoutAll; clear-local resets after signing out', () => {
    const { nodes, sync, push } = setup();
    push({ kind: 'synced', username: 'an', at: 0 });
    nodes['clear-local'].checked = true;
    nodes['logout-all'].fire('click');
    expect(sync.logoutAll).toHaveBeenCalledTimes(1);
    push({ kind: 'signed-out' });
    expect(nodes['clear-local'].checked).toBe(false);
  });

  it('cleanup unsubscribes and removes listeners', () => {
    const { nodes, cleanup, subs } = setup();
    cleanup();
    expect(subs.size).toBe(0);
    expect(nodes.form.listenerCount('submit')).toBe(0);
  });
});
