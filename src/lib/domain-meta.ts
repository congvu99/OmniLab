/**
 * Per-domain display metadata that islands need but /lessons-index.json does
 * not carry (accent colors, module titles). Pages serialize it into a
 * `data-meta` attribute at build time; islands parse it back. Parsing is
 * tolerant: malformed or missing JSON yields an empty list, never a throw.
 */
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;

export interface DomainMeta {
  id: string;
  title: string;
  accent: string;
  accentDark: string;
  /** moduleId -> module title */
  modules: Record<string, string>;
}

export function serializeDomainMeta(meta: readonly DomainMeta[]): string {
  return JSON.stringify(meta);
}

export function parseDomainMeta(raw: string | null | undefined): DomainMeta[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: DomainMeta[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    if (typeof o.id !== 'string' || typeof o.title !== 'string') continue;
    const accent = typeof o.accent === 'string' && HEX_COLOR.test(o.accent) ? o.accent : '';
    const accentDark = typeof o.accentDark === 'string' && HEX_COLOR.test(o.accentDark) ? o.accentDark : accent;
    const modules: Record<string, string> = {};
    if (o.modules && typeof o.modules === 'object') {
      for (const [k, v] of Object.entries(o.modules as Record<string, unknown>)) {
        if (typeof v === 'string') modules[k] = v;
      }
    }
    out.push({ id: o.id, title: o.title, accent, accentDark, modules });
  }
  return out;
}

/** Applies a domain's accent as the `.hue` custom properties on an element (no-op without a valid color). */
export function applyHue(
  el: { style: { setProperty(name: string, value: string): void } },
  meta: DomainMeta | undefined,
): void {
  if (!meta?.accent) return;
  el.style.setProperty('--hue-l', meta.accent);
  el.style.setProperty('--hue-d', meta.accentDark || meta.accent);
}
