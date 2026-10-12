/** DOM contract of account-sync-panel.astro: every `[data-ap="name"]` node. */

export const AP_NAMES = [
  'checking', 'form', 'unavailable', 'merge', 'account', 'login-tab', 'register-tab', 'username',
  'password', 'confirm', 'confirm-row', 'submit', 'error', 'merge-text', 'merge-keep', 'merge-use',
  'merge-cancel', 'merge-title', 'account-name', 'account-status', 'avatar', 'dot', 'logout',
  'logout-all', 'clear-local', 'notice', 'wipe-block', 'wipe', 'wipe-confirm', 'wipe-yes', 'wipe-no',
] as const;
export type ApName = (typeof AP_NAMES)[number];
export type AccountPanelElements = Record<ApName, HTMLElement & HTMLInputElement & HTMLButtonElement & HTMLFormElement>;

/** Collects the nodes; `null` if any is missing. */
export function readAccountPanelElements(root: Pick<ParentNode, 'querySelector'>): AccountPanelElements | null {
  const out: Partial<AccountPanelElements> = {};
  for (const n of AP_NAMES) {
    const node = root.querySelector(`[data-ap="${n}"]`);
    if (!node) return null;
    out[n] = node as AccountPanelElements[ApName];
  }
  return out as AccountPanelElements;
}
