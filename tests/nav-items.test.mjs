// Top-level tabs: 5 entries (dock + sidebar share this list), "Tôi" owns /toi.
import { describe, expect, it } from 'vitest';
import { isNavItemActive, navItems } from '../src/components/shell/nav-items.ts';
import { ICON_NAMES } from '../src/components/icon/icon-names.ts';

const activeHrefs = (pathname) => navItems.filter((i) => isNavItemActive(pathname, i)).map((i) => i.href);

describe('nav items', () => {
  it('has the 5 tabs in dock order', () => {
    expect(navItems.map((i) => i.label)).toEqual(['Học tiếp', 'Lĩnh vực', 'Tìm kiếm', 'Đã lưu', 'Tôi']);
  });

  it('every tab icon exists in the icon set', () => {
    for (const item of navItems) expect(ICON_NAMES, item.label).toContain(item.icon);
  });

  it('marks only "Tôi" active on /toi', () => {
    expect(activeHrefs('/toi')).toEqual(['/toi']);
    expect(activeHrefs('/toi/')).toEqual(['/toi']);
  });

  it('keeps the existing highlight rules', () => {
    expect(activeHrefs('/')).toEqual(['/']);
    expect(activeHrefs('/hoc/kien-truc/x/y')).toEqual(['/linh-vuc']);
    expect(activeHrefs('/da-luu')).toEqual(['/da-luu']);
    expect(activeHrefs('/toi-khac')).toEqual([]);
  });
});
