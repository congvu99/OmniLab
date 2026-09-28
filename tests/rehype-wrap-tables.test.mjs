import { describe, expect, it } from 'vitest';
import rehypeWrapTables from '../src/lib/rehype-wrap-tables.mjs';

// Minimal hast element/root factories — avoids pulling in a full
// remark/rehype pipeline just to exercise this one transform.
function el(tagName, children = []) {
  return { type: 'element', tagName, properties: {}, children };
}
function table() {
  return el('table', [el('tbody', [el('tr', [el('td', [{ type: 'text', value: 'x' }])])])]);
}
function root(children) {
  return { type: 'root', children };
}

describe('rehypeWrapTables', () => {
  it('wraps a single table with the plain (unnumbered) aria-label', () => {
    const tree = root([table()]);
    rehypeWrapTables()(tree);
    const wrapper = tree.children[0];
    expect(wrapper.tagName).toBe('div');
    expect(wrapper.properties.className).toEqual(['table-wrap']);
    expect(wrapper.properties.ariaLabel).toBe('Bảng (cuộn ngang)');
    expect(wrapper.children[0].tagName).toBe('table');
  });

  it('gives every table on the same page a unique aria-label (axe landmark-unique)', () => {
    // Regression test: a page with >1 table previously got the identical
    // aria-label "Bảng (cuộn ngang)" on every wrapper, which axe-core's
    // landmark-unique rule flags (found via a real axe-core run against
    // /hoc/kien-truc/chu-de/database, which has 3 tables).
    const tree = root([table(), el('p'), table(), table()]);
    rehypeWrapTables()(tree);
    const labels = tree.children.filter((c) => c.tagName === 'div').map((c) => c.properties.ariaLabel);
    expect(labels).toEqual(['Bảng (cuộn ngang)', 'Bảng (cuộn ngang) 2', 'Bảng (cuộn ngang) 3']);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('resets the counter for each new tree (each file processed independently)', () => {
    const transform = rehypeWrapTables();
    const treeA = root([table(), table()]);
    const treeB = root([table()]);
    transform(treeA);
    transform(treeB);
    expect(treeB.children[0].properties.ariaLabel).toBe('Bảng (cuộn ngang)');
  });

  it('every wrapper keeps the required a11y attributes (role, tabIndex)', () => {
    const tree = root([table(), table()]);
    rehypeWrapTables()(tree);
    for (const wrapper of tree.children) {
      expect(wrapper.properties.role).toBe('region');
      expect(wrapper.properties.tabIndex).toBe(0);
    }
  });
});
