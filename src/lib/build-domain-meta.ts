/** Build-time: content-collection domains -> the serializable DomainMeta that islands read (see domain-meta.ts). */
import type { DomainEntry } from './content-queries';
import type { DomainMeta } from './domain-meta';

export function buildDomainMeta(domains: readonly DomainEntry[]): DomainMeta[] {
  return domains.map((d) => ({
    id: d.data.id,
    title: d.data.title,
    accent: d.data.accent,
    accentDark: d.data.accentDark,
    modules: Object.fromEntries(d.data.modules.map((m) => [m.id, m.title])),
  }));
}
