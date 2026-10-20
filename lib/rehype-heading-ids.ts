type HastNode = {
  type: string;
  tagName?: string;
  children?: HastNode[];
  properties?: Record<string, unknown>;
};

const HEADING_TAG = /^h[1-6]$/;

/**
 * Assign precomputed ids onto heading elements, in document order.
 * Ids come from the same markdown parse as the table of contents.
 */
export function rehypeAssignHeadingIds(ids: string[]) {
  return (tree: HastNode) => {
    let index = 0;
    const walk = (node: HastNode) => {
      if (
        node.type === "element" &&
        node.tagName &&
        HEADING_TAG.test(node.tagName)
      ) {
        const id = ids[index];
        index += 1;
        if (id) {
          node.properties = { ...node.properties, id };
        }
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
