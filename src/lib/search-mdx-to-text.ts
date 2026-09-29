/**
 * Best-effort MDX -> plain-text stripper for the build-time search index
 * (src/pages/search-index.json.ts) and for content-queries.ts's reading-time
 * calculation. Input is `entry.body` (glob loader's raw MDX source,
 * frontmatter already stripped — same field /gioi-thieu's credit scan
 * reads). This is a search corpus, not a renderer: approximate stripping
 * (regex-based, no real MDX/JSX parser) is an accepted trade-off — leftover
 * stray punctuation is harmless for a search index, unlike an exact-match
 * use like credit-link extraction.
 *
 * Known custom components with a `>`-bearing attribute value (Figure's
 * `credit={\`...<a href="...">...\`}`) are dropped whole *before* the
 * generic tag-strip pass, so that pass's simpler no-embedded-`>` regex stays
 * safe (the same gotcha applies to any regex-based extractor that tries to
 * scan this content without first isolating such attributes).
 */

/** Components whose entire content (attrs + children) should be dropped — not useful search text. */
const DROP_WHOLE_TAGS = ['Figure', 'Disclaimer', 'ReviewNote'];
/** Components whose tags should be removed but whose inner text is kept (real prose). */
const UNWRAP_TAGS = ['RealLife', 'Note', 'TranslatorNote'];

function dropWholeTag(text: string, tag: string): string {
  // Self-closing: <Tag ...multi-line-attrs.../>
  let out = text.replace(new RegExp(`<${tag}[\\s\\S]*?/>`, 'g'), ' ');
  // Paired: <Tag ...>...children...</Tag>
  out = out.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, 'g'), ' ');
  return out;
}

function unwrapTag(text: string, tag: string): string {
  return text.replace(new RegExp(`</?${tag}[^>]*>`, 'g'), ' ');
}

export function mdxToPlainText(raw: string, maxLength = 6000): string {
  let text = raw;

  text = text.replace(/^\s*import\s.*$/gm, ' ');
  for (const tag of DROP_WHOLE_TAGS) text = dropWholeTag(text, tag);
  for (const tag of UNWRAP_TAGS) text = unwrapTag(text, tag);
  // Any remaining simple tag (no embedded '<'/'>' in its attributes — true
  // at this point since the only such components were dropped above).
  text = text.replace(/<\/?[A-Za-z][^<>]*>/g, ' ');

  // Markdown/code noise.
  text = text.replace(/```[a-zA-Z]*\n?/g, ' ');
  text = text.replace(/`([^`]*)`/g, '$1');
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/^#{1,6}\s*/gm, '');
  text = text.replace(/[*_>#]/g, ' ');

  text = text.replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}
