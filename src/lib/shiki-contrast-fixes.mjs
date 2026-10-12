// Shiki transformer: swaps the few github-light / github-dark token colors
// that fall below WCAG AA (4.5:1) on their own theme background for the
// nearest passing shade, so code blocks keep the GitHub look but pass
// axe color-contrast.
//   light #E36209 on #FFFFFF = 3.49:1 -> #C24E00 = 4.79:1
//   dark  #6A737D on #24292E = 3.05:1 -> #8B949E = 4.77:1 (comments)
// Dual-theme output puts the light color in `color:` and the dark one in
// `--shiki-dark:` inside each span's inline style, so each swap is scoped to
// its own declaration and never touches the other theme.
export const CONTRAST_SWAPS = [
  { property: 'color', from: '#E36209', to: '#C24E00' },
  { property: '--shiki-dark', from: '#6A737D', to: '#8B949E' },
];

export function fixStyleContrast(style) {
  let out = style;
  for (const { property, from, to } of CONTRAST_SWAPS) {
    const pattern = new RegExp(`(^|;)(${property}:)${from}(?=;|$)`, 'gi');
    out = out.replace(pattern, `$1$2${to}`);
  }
  return out;
}

export const shikiContrastFixes = {
  name: 'omnilab:contrast-fixes',
  span(node) {
    const style = node.properties?.style;
    if (typeof style === 'string') node.properties.style = fixStyleContrast(style);
  },
};
