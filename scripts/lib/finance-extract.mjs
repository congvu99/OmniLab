// hast (parsed finance HTML) slicing per scripts/finance-split-map.json.
// Pure tree functions — no filesystem access.
import { fromHtml } from 'hast-util-from-html';
import { visit } from 'unist-util-visit';

export function parseFinanceHtml(html) {
  return fromHtml(html);
}

function hasClass(el, className) {
  const classes = el.properties?.className;
  return Array.isArray(classes) && classes.includes(className);
}

function textOf(node) {
  let out = '';
  visit(node, 'text', (n) => {
    out += n.value;
  });
  return out.trim();
}

/** The `<div class="hero">…</div>` inside `<header>` (title + lead + pills). */
export function findHero(tree) {
  let hero;
  visit(tree, 'element', (node) => {
    if (!hero && node.tagName === 'div' && hasClass(node, 'hero')) hero = node;
  });
  if (!hero) throw new Error('Could not find <div class="hero"> in finance HTML');
  return hero;
}

/** Map of `<section id="…">` -> element, for every top-level section under `<main>`. */
export function findSections(tree) {
  const sections = new Map();
  visit(tree, 'element', (node) => {
    if (node.tagName === 'section' && node.properties?.id) {
      sections.set(String(node.properties.id), node);
    }
  });
  return sections;
}

function elementChildren(node) {
  return (node.children ?? []).filter((c) => c.type === 'element');
}

/** All `<article class="week">` elements inside `<section id="lich-hoc">`, in order. */
function weekArticles(lichHocSection) {
  let weeksDiv;
  visit(lichHocSection, 'element', (node) => {
    if (!weeksDiv && node.tagName === 'div' && hasClass(node, 'weeks')) weeksDiv = node;
  });
  if (!weeksDiv) throw new Error('Could not find <div class="weeks"> in section#lich-hoc');
  return elementChildren(weeksDiv).filter((el) => el.tagName === 'article');
}

/**
 * Everything in section#lich-hoc BEFORE `<div class="weeks">` (eyebrow label
 * + h2 + intro paragraph) — must ride along with week 1's content, or it is
 * silently dropped since no other lesson claims section#lich-hoc.
 */
function lichHocPreamble(lichHocSection) {
  const children = elementChildren(lichHocSection);
  const weeksIdx = children.findIndex((el) => el.tagName === 'div' && hasClass(el, 'weeks'));
  return weeksIdx === -1 ? [] : children.slice(0, weeksIdx);
}

function root(children) {
  return { type: 'root', children };
}

/** Finds the index of a heading child matching `{tag, text}` (exact, trimmed text). */
function findHeadingIndex(children, tag, text) {
  return children.findIndex((el) => el.type === 'element' && el.tagName === tag && textOf(el) === text);
}

/**
 * Resolves one finance-split-map.json lesson entry to a hast root fragment.
 * Content-only: section eyebrow labels stay (they carry meaning, see
 * phase-03 report "Finance body-text boundary"); nav/masthead/footer are
 * never passed in here at all.
 */
export function resolveLessonHast(entry, { heroEl, sectionsById }) {
  const section = sectionsById.get(entry.sourceSection);
  if (!section) throw new Error(`Unknown sourceSection "${entry.sourceSection}" for lesson ${entry.slug}`);
  const { boundary } = entry;

  switch (boundary.type) {
    case 'hero-plus-section':
      return root([...elementChildren(heroEl), ...elementChildren(section)]);

    case 'whole':
      return root(elementChildren(section));

    case 'week': {
      const articles = weekArticles(section);
      const article = articles[boundary.week - 1];
      if (!article) throw new Error(`No week ${boundary.week} article found in section#${entry.sourceSection}`);
      // Each <article class="week"> wraps a single <div> holding the real content.
      const wrapper = elementChildren(article)[0];
      const weekChildren = elementChildren(wrapper ?? article);
      if (boundary.includeIntro) {
        return root([...lichHocPreamble(section), ...weekChildren]);
      }
      return root(weekChildren);
    }

    case 'split-before-heading': {
      const children = elementChildren(section);
      const idx = findHeadingIndex(children, boundary.tag, boundary.text);
      if (idx === -1) {
        throw new Error(`Heading <${boundary.tag}>"${boundary.text}" not found in section#${entry.sourceSection}`);
      }
      return root(boundary.part === 'before' ? children.slice(0, idx) : children.slice(idx));
    }

    default:
      throw new Error(`Unknown boundary type "${boundary.type}"`);
  }
}

/**
 * The source HTML is minified: visually-adjacent inline elements (pills,
 * ribbon steps, reference badges) often have NO whitespace text node
 * between them in markup, relying on CSS gap/flex for the visible gap
 * (e.g. `<span class="pill">A</span><span class="pill">B</span>`). Left
 * alone, hast-util-to-mdast flattens these into words jammed together
 * ("...cốt lõiKhoảng 3 giờ..."). Insert a real space between any two
 * directly-adjacent element siblings so the migrated text reads correctly
 * — this is a genuine output-quality fix, not just a comparison trick (both
 * sides of verify-fidelity read the same, now-correct, spacing).
 */
export function insertImplicitSpaces(node) {
  if (!node || !Array.isArray(node.children)) return node;
  const children = node.children;
  const result = [];
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    insertImplicitSpaces(child);
    result.push(child);
    const next = children[i + 1];
    if (child.type === 'element' && next && next.type === 'element') {
      result.push({ type: 'text', value: ' ' });
    }
  }
  node.children = result;
  return node;
}

/**
 * hast-util-to-mdast's `table` handler drops `<caption>` entirely (mdast/GFM
 * tables have no caption concept) — silently losing real content. Hoist any
 * `<caption>` out as a bold paragraph immediately before its `<table>`.
 */
export function promoteTableCaptions(node) {
  if (!node || !Array.isArray(node.children)) return node;
  const result = [];
  for (const child of node.children) {
    if (child.type === 'element' && child.tagName === 'table') {
      const captionIdx = (child.children ?? []).findIndex((c) => c.type === 'element' && c.tagName === 'caption');
      if (captionIdx !== -1) {
        const caption = child.children[captionIdx];
        child.children = child.children.filter((_, i) => i !== captionIdx);
        result.push({
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [{ type: 'element', tagName: 'strong', properties: {}, children: caption.children ?? [] }],
        });
      }
    }
    promoteTableCaptions(child);
    result.push(child);
  }
  node.children = result;
  return node;
}

// --- Note-box marking (.note / .box / .warm divs -> <Note> after markdown serialization) ---
let noteCounter = 0;

function sentinelParagraph(value) {
  return { type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value }] };
}

function isNoteBox(el) {
  return el.type === 'element' && el.tagName === 'div' && (hasClass(el, 'note') || hasClass(el, 'box') || hasClass(el, 'warm'));
}

/** Mutates `tree` in place, wrapping every `.note`/`.box`/`.warm` div with sentinel <p> markers. */
export function markNoteBoxes(tree) {
  if (!tree || !Array.isArray(tree.children)) return tree;
  const newChildren = [];
  for (const child of tree.children) {
    if (isNoteBox(child)) {
      noteCounter += 1;
      const id = `NOTE${noteCounter}`;
      markNoteBoxes(child);
      newChildren.push(sentinelParagraph(`%%NOTE_OPEN:${id}%%`), child, sentinelParagraph(`%%NOTE_CLOSE:${id}%%`));
    } else {
      markNoteBoxes(child);
      newChildren.push(child);
    }
  }
  tree.children = newChildren;
  return tree;
}

/** Replaces the sentinel paragraphs (post markdown-serialization) with real `<Note>` JSX. */
export function replaceNoteSentinels(markdown) {
  return markdown
    .replace(/%%NOTE_OPEN:NOTE\d+%%\n*/g, '<Note>\n\n')
    .replace(/\n*%%NOTE_CLOSE:NOTE\d+%%/g, '\n\n</Note>');
}
