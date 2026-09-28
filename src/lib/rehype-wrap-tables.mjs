// Rehype plugin: wrap every <table> in a focusable, labelled scroll region so
// wide tables scroll horizontally on their own instead of widening the page.
import { visit, SKIP } from 'unist-util-visit';

export default function rehypeWrapTables() {
  return (tree) => {
    // Per-file counter: pages with >1 table previously got identical
    // aria-label "Bảng (cuộn ngang)" on every wrapper, which axe-core's
    // landmark-unique rule flags (region landmarks must have a unique
    // role/label combo). Numbering them ("Bảng (cuộn ngang) 1", "... 2")
    // keeps the label meaningful while making each wrapper distinguishable.
    // Reset to 0 for every file since this transform runs once per document.
    let count = 0;
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) return;
      count += 1;
      const ariaLabel = count === 1 ? 'Bảng (cuộn ngang)' : `Bảng (cuộn ngang) ${count}`;
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['table-wrap'],
          tabIndex: 0,
          role: 'region',
          ariaLabel,
        },
        children: [node],
      };
      // Tables do not nest in lesson content; skip the new wrapper's subtree.
      return SKIP;
    });
  };
}
