import { ICON_PATHS, type IconName } from './icon-paths';

export type { IconName };
export const ICON_NAMES = Object.keys(ICON_PATHS) as IconName[];

export interface ResolvedIcon {
  name: IconName;
  /** Quarter-turn applied by CSS for icons that reuse another glyph (e.g. chevron-down). */
  rotate?: 90 | 180 | 270;
}

/** Fallback glyph for unknown names (generic "domains" grid). */
const FALLBACK: IconName = 'domains';

/**
 * External names (content YAML `icon:` values, former Lucide names used across
 * the app) -> concept icon. Domain YAML today: network, wallet,
 * briefcase-business, chart-pie.
 */
const ALIASES: Record<string, ResolvedIcon> = {
  'briefcase-business': { name: 'briefcase' },
  'chart-pie': { name: 'pie' },
  layers: { name: 'domains' },
  'layout-grid': { name: 'domains' },
  'graduation-cap': { name: 'resume' },
  'book-open': { name: 'doc' },
  'circle-check': { name: 'check-circle' },
  'bookmark-check': { name: 'bookmark' },
  lightbulb: { name: 'bulb' },
  x: { name: 'close' },
  'maximize-2': { name: 'expand' },
  'external-link': { name: 'external' },
  'loader-circle': { name: 'loader' },
  'party-popper': { name: 'spark' },
  compass: { name: 'omni' },
  'chevron-down': { name: 'chevron-right', rotate: 90 },
  'chevron-up': { name: 'chevron-right', rotate: 270 },
};

/** Maps any icon string (concept name, alias, unknown) to a drawable icon; never throws. */
export function resolveIcon(name: string | undefined | null): ResolvedIcon {
  if (!name) return { name: FALLBACK };
  if (Object.hasOwn(ICON_PATHS, name)) return { name: name as IconName };
  return Object.hasOwn(ALIASES, name) ? ALIASES[name] : { name: FALLBACK };
}
