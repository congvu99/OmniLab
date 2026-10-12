/**
 * Pure view model of the account panel: SyncStatus/ErrorCode -> Vietnamese
 * text + which section shows, and pre-flight form validation (mirrors the
 * server rules in server/sync/sync-server-entry.ts so bad input never hits the
 * API). No DOM; every string here is assigned later via textContent only.
 */
import type { ErrorCode, SyncStatus } from './progress-sync-types';

export type AuthMode = 'login' | 'register';
export type PanelSection = 'checking' | 'form' | 'unavailable' | 'merge' | 'account';

export interface PanelView {
  section: PanelSection;
  headline: string;
  detail: string;
  tone: 'neutral' | 'error';
  /** Account name for merge / account sections ('' otherwise); plain text. */
  username: string;
  /** Avatar letter (first character of the name, upper-cased); '' when no name. */
  initial: string;
  /** Status dot: synced / syncing / error; 'off' outside the account section. */
  dot: 'ok' | 'busy' | 'error' | 'off';
}

export interface AuthFormValues {
  username: string;
  password: string;
  confirm: string;
}

export interface FormProblem {
  code: ErrorCode;
  field: 'username' | 'password' | 'confirm';
}

const USERNAME = /^[a-z0-9_.-]{3,32}$/;

const ERROR_TEXT: Record<ErrorCode, string> = {
  invalid_username: 'Tên đăng nhập gồm 3-32 ký tự: chữ thường không dấu, số, dấu . _ -',
  invalid_password: 'Mật khẩu cần từ 8 đến 128 ký tự.',
  password_mismatch: 'Hai mật khẩu chưa khớp nhau.',
  username_taken: 'Tên đăng nhập này đã có người dùng.',
  bad_credentials: 'Tên đăng nhập hoặc mật khẩu chưa đúng.',
  rate_limited: 'Thử quá nhiều lần. Hãy đợi một lát rồi thử lại.',
  busy: 'Máy chủ đang bận. Hãy thử lại sau ít phút.',
  unauthorized: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',
  too_large: 'Dữ liệu tiến độ quá lớn để đồng bộ.',
  unsupported_media: 'Máy chủ không nhận định dạng dữ liệu này. Hãy tải lại trang.',
  unavailable: 'Chưa kết nối được máy chủ đồng bộ. Tiến độ vẫn được lưu trên máy này.',
  bad_request: 'Yêu cầu không hợp lệ. Hãy tải lại trang.',
};

export function errorText(code: string): string {
  return ERROR_TEXT[code as ErrorCode] ?? ERROR_TEXT.bad_request;
}

/** Field a server error code belongs to (for aria-invalid), if any. */
export function fieldOfCode(code: string): 'username' | 'password' | null {
  if (code === 'invalid_username' || code === 'username_taken') return 'username';
  if (code === 'bad_credentials' || code === 'invalid_password') return 'password';
  return null;
}

/** Same normalisation the controller sends to the API. */
export function normalizeUsername(raw: string): string {
  return raw.normalize('NFC').trim().toLowerCase();
}

/** First problem found, or null. Confirm is only checked when registering. */
export function validateAuthForm(mode: AuthMode, v: AuthFormValues): FormProblem | null {
  if (!USERNAME.test(normalizeUsername(v.username))) return { code: 'invalid_username', field: 'username' };
  // NFC first, like the server: decomposed Vietnamese input must count and compare the same.
  const password = v.password.normalize('NFC');
  if (password.length < 8 || password.length > 128) return { code: 'invalid_password', field: 'password' };
  if (mode === 'register' && v.confirm.normalize('NFC') !== password) return { code: 'password_mismatch', field: 'confirm' };
  return null;
}

function initialOf(name: string): string {
  return (Array.from(name)[0] ?? '').toUpperCase();
}

/** Line shown after logout()/logoutAll() resolved; null when it really signed out. */
export function logoutFailureText(status: SyncStatus): string | null {
  if (status.kind === 'signed-out') return null;
  const why = status.kind === 'error' ? errorText(status.code) : 'Hãy thử lại.';
  return `Chưa đăng xuất được. ${why}`;
}

/** Sidebar "Tôi" entry: name + dot while an account is attached to this device. */
export function sidebarAccountView(status: SyncStatus): { name: string; dot: 'ok' | 'busy' | 'error'; label: string } | null {
  switch (status.kind) {
    case 'synced':
      return { name: status.username, dot: 'ok', label: 'Đã đồng bộ' };
    case 'syncing':
      return { name: status.username, dot: 'busy', label: 'Đang đồng bộ' };
    case 'error':
      return { name: status.username, dot: 'error', label: 'Lỗi đồng bộ' };
    case 'needs-merge-decision':
      return { name: status.username, dot: 'error', label: 'Cần chọn cách gộp tiến độ' };
    default:
      return null;
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function viewOf(status: SyncStatus): PanelView {
  const base = { detail: '', tone: 'neutral' as const, username: '', initial: '', dot: 'off' as const };
  switch (status.kind) {
    case 'checking':
      return { ...base, section: 'checking', headline: 'Đang kiểm tra tài khoản…' };
    case 'signed-out':
      return { ...base, section: 'form', headline: 'Đăng nhập để đồng bộ tiến độ' };
    case 'unavailable':
      return { ...base, section: 'unavailable', headline: 'Chưa kết nối được máy chủ đồng bộ' };
    case 'needs-merge-decision':
      return {
        ...base,
        section: 'merge',
        headline: `Máy này đang có tiến độ của tài khoản khác. Gộp vào tài khoản ${status.username}?`,
        detail: '"Dùng tiến độ của tài khoản" sẽ thay thế tiến độ đang có trên máy này.',
        username: status.username,
        initial: initialOf(status.username),
      };
    case 'syncing':
      return {
        ...base,
        section: 'account',
        headline: `Đã đăng nhập: ${status.username}`,
        detail: 'Đang đồng bộ…',
        username: status.username,
        initial: initialOf(status.username),
        dot: 'busy',
      };
    case 'synced': {
      const d = new Date(status.at);
      return {
        ...base,
        section: 'account',
        headline: `Đã đăng nhập: ${status.username}`,
        detail: `Đồng bộ lúc ${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
        username: status.username,
        initial: initialOf(status.username),
        dot: 'ok',
      };
    }
    case 'error':
      return {
        section: 'account',
        headline: `Đã đăng nhập: ${status.username}`,
        detail: `Chưa đồng bộ được. ${errorText(status.code)}`,
        tone: 'error',
        username: status.username,
        initial: initialOf(status.username),
        dot: 'error',
      };
  }
}
