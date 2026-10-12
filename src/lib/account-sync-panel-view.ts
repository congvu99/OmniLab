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

/** Same normalisation the controller sends to the API. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** First problem found, or null. Confirm is only checked when registering. */
export function validateAuthForm(mode: AuthMode, v: AuthFormValues): FormProblem | null {
  if (!USERNAME.test(normalizeUsername(v.username))) return { code: 'invalid_username', field: 'username' };
  if (v.password.length < 8 || v.password.length > 128) return { code: 'invalid_password', field: 'password' };
  if (mode === 'register' && v.confirm !== v.password) return { code: 'password_mismatch', field: 'confirm' };
  return null;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function viewOf(status: SyncStatus): PanelView {
  const base = { detail: '', tone: 'neutral' as const, username: '' };
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
      };
    case 'syncing':
      return { ...base, section: 'account', headline: `Đã đăng nhập: ${status.username}`, detail: 'Đang đồng bộ…', username: status.username };
    case 'synced': {
      const d = new Date(status.at);
      return {
        ...base,
        section: 'account',
        headline: `Đã đăng nhập: ${status.username}`,
        detail: `Đồng bộ lúc ${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
        username: status.username,
      };
    }
    case 'error':
      return {
        section: 'account',
        headline: `Đã đăng nhập: ${status.username}`,
        detail: `Chưa đồng bộ được. ${errorText(status.code)}`,
        tone: 'error',
        username: status.username,
      };
  }
}
