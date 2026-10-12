/** "Thứ Hai · 12.10" — weekday + day.month for the Học tiếp eyebrow (local time). */
const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export function formatTodayVi(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${WEEKDAYS[date.getDay()]} · ${day}.${month}`;
}
