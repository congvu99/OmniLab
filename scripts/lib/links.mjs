// Internal-link and image-path resolution shared by migrate-system-design.mjs.
// Pure functions, no filesystem access, so they are easy to reason about and
// re-run idempotently.

export const PRIMER_GITHUB_ROOT = 'https://github.com/donnemartin/system-design-primer';
export const PRIMER_GITHUB_BLOB = `${PRIMER_GITHUB_ROOT}/blob/master`;

// Source subfolder name (as in D:\HardSkills\system-design-primer\hoc-tap-vi)
// -> module id used throughout the site.
export const MODULE_DIR_TO_ID = {
  '00-nen-tang': 'nen-tang',
  '01-danh-doi': 'danh-doi',
  '02-chu-de': 'chu-de',
  '03-bai-tap': 'bai-tap',
};

function splitAnchor(target) {
  const hashIndex = target.indexOf('#');
  if (hashIndex === -1) return [target, undefined];
  return [target.slice(0, hashIndex), target.slice(hashIndex + 1)];
}

/**
 * Resolves a link target found in a translated .md file's body (or its
 * `link-goc` frontmatter field) to its final MDX destination:
 * - external http(s) links: unchanged
 * - links to the original (English) primer README(s): absolute GitHub URL
 * - links to a sibling translated .md file: `/hoc/kien-truc/<module>/<slug>`
 *
 * `currentModuleDir` is the source subfolder of the file being processed
 * (e.g. "02-chu-de"), used to resolve same-directory relative links like
 * `04-reverse-proxy.md`.
 */
export function resolveLink(target, currentModuleDir) {
  if (/^https?:\/\//.test(target)) return target;
  const [pathPart, anchor] = splitAnchor(target);

  const strippedDots = pathPart.replace(/^(\.\.\/)+/, '');
  if (strippedDots === 'README.md') {
    return `${PRIMER_GITHUB_ROOT}${anchor ? `#${anchor}` : ''}`;
  }
  const solutionsMatch = strippedDots.match(/^solutions\/system_design\/([^/]+)\/README\.md$/);
  if (solutionsMatch) {
    return `${PRIMER_GITHUB_BLOB}/solutions/system_design/${solutionsMatch[1]}/README.md`;
  }

  if (!pathPart.endsWith('.md')) return target;

  const segments = strippedDots.split('/').filter(Boolean);
  let moduleDir = currentModuleDir;
  let filename;
  if (segments.length >= 2) {
    moduleDir = segments[segments.length - 2];
    filename = segments[segments.length - 1];
  } else {
    filename = segments[0];
  }
  const moduleId = MODULE_DIR_TO_ID[moduleDir];
  if (!moduleId) {
    throw new Error(`Cannot resolve internal link "${target}" (unknown module dir "${moduleDir}")`);
  }
  const slug = filename.replace(/\.md$/, '').replace(/^\d+-/, '');
  return `/hoc/kien-truc/${moduleId}/${slug}${anchor ? `#${anchor}` : ''}`;
}

/** Basename of an image path, e.g. "../../images/Q6z24La.png" -> "Q6z24La.png". */
export function imageBasename(imagePath) {
  return imagePath.split('/').pop();
}

/** Deterministic, valid-JS-identifier import name for an image basename. */
export function imageImportName(basename) {
  const stem = basename.replace(/\.[^.]+$/, '');
  return `img_${stem.replace(/[^a-zA-Z0-9]/g, '_')}`;
}
