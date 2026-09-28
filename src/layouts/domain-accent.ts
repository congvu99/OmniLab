/**
 * Builds the inline `style` attribute value that overrides the domain-accent
 * CSS custom properties on the <html> element itself.
 *
 * Why inline on <html>: src/styles/tokens.css resolves `--accent` at the
 * `:root` selector (`--accent: var(--domain-accent, #4F46E5)`, flipped to
 * `--domain-accent-dark` under `prefers-color-scheme: dark`). Custom
 * properties only cascade downward, so an override has to land on `:root`
 * itself (i.e. <html>, the same element) — setting it on <body> or lower
 * would never reach that `:root` rule's computed value.
 *
 * Values come from trusted content YAML (Phase 3/6), not user input, but are
 * still validated as plausible hex colors before being interpolated into an
 * HTML attribute, so a malformed value can't break out of the style string.
 */
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;

export function domainAccentStyle(light?: string, dark?: string): string | undefined {
  const decls: string[] = [];
  if (light && HEX_COLOR.test(light)) decls.push(`--domain-accent:${light}`);
  if (dark && HEX_COLOR.test(dark)) decls.push(`--domain-accent-dark:${dark}`);
  return decls.length > 0 ? decls.join(';') : undefined;
}
