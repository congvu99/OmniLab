/**
 * Single source of truth for the app's 5 top-level tabs. Consumed by both
 * tab-bar.astro (<1024px, fixed bottom) and sidebar-nav.astro (>=1024px,
 * fixed left) so the two never drift apart.
 *
 * `icon` is a concept icon name for <Icon> (src/components/icon); kept as a
 * plain string here so this data-only file stays framework-agnostic and
 * trivially testable.
 */
export interface NavItem {
  href: string;
  label: string;
  icon: 'resume' | 'domains' | 'search' | 'bookmark' | 'user';
  /** Path prefixes that should also highlight this tab (nested routes). */
  activePrefixes: string[];
}

export const navItems: NavItem[] = [
  { href: '/', label: 'Học tiếp', icon: 'resume', activePrefixes: [] },
  {
    href: '/linh-vuc',
    label: 'Lĩnh vực',
    icon: 'domains',
    // /linh-vuc/* (domain detail) and /hoc/* (lesson reader) both belong to
    // the "Lĩnh vực" section for nav highlighting purposes.
    activePrefixes: ['/linh-vuc', '/hoc'],
  },
  { href: '/tim-kiem', label: 'Tìm kiếm', icon: 'search', activePrefixes: ['/tim-kiem'] },
  { href: '/da-luu', label: 'Đã lưu', icon: 'bookmark', activePrefixes: ['/da-luu'] },
  { href: '/toi', label: 'Tôi', icon: 'user', activePrefixes: ['/toi'] },
];

/** True when `pathname` should highlight `item` as the active tab. */
export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') {
    return pathname === '/';
  }
  return item.activePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
