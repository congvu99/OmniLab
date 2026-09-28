// Rehype plugin: wrap every <table> in a focusable, labelled scroll region so
// wide tables scroll horizontally on their own instead of widening the page.
import { visit, SKIP } from 'unist-util-visit';

export default function rehypeWrapTables() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) return;
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['table-wrap'],
          tabIndex: 0,
          role: 'region',
          ariaLabel: 'Bảng (cuộn ngang)',
        },
        children: [node],
      };
      // Tables do not nest in lesson content; skip the new wrapper's subtree.
      return SKIP;
    });
  };
}
