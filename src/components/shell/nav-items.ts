/**
 * Single source of truth for the app's 4 top-level tabs. Consumed by both
 * tab-bar.astro (<1024px, fixed bottom) and sidebar-nav.astro (>=1024px,
 * fixed left) so the two never drift apart.
 *
 * `icon` is a key into the icon map each nav renderer builds locally from
 * individually-imported `@lucide/astro/icons/*` components (kept out of this
 * data-only file so it stays framework-agnostic and trivially testable).
 */
export interface NavItem {
  href: string;
  label: string;
  icon: 'graduation-cap' | 'layers' | 'search' | 'bookmark';
  /** Path prefixes that should also highlight this tab (nested routes). */
  activePrefixes: string[];
}

export const navItems: NavItem[] = [
  { href: '/', label: 'Học tiếp', icon: 'graduation-cap', activePrefixes: [] },
  {
    href: '/linh-vuc',
    label: 'Lĩnh vực',
    icon: 'layers',
    // /linh-vuc/* (domain detail) and /hoc/* (lesson reader) both belong to
    // the "Lĩnh vực" section for nav highlighting purposes.
    activePrefixes: ['/linh-vuc', '/hoc'],
  },
  { href: '/tim-kiem', label: 'Tìm kiếm', icon: 'search', activePrefixes: ['/tim-kiem'] },
  { href: '/da-luu', label: 'Đã lưu', icon: 'bookmark', activePrefixes: ['/da-luu'] },
];

/** True when `pathname` should highlight `item` as the active tab. */
export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') {
    return pathname === '/';
  }
  return item.activePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
