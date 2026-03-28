import { Node as ProseMirrorNode, mergeAttributes } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useCallback } from "react";
import type { Node as PMNode } from "@tiptap/pm/model";

const TabsContainerNodeView: React.FC<NodeViewProps> = ({
  editor,
  getPos,
  node: containerNode,
}) => {
  const handleAddTab = useCallback(() => {
    const pos = getPos();
    if (typeof pos !== "number") return;

    const newTabValue = `tab-${Date.now()}`;

    // Find the tabs-list node
    let tabsListNode: PMNode | null = null;
    let tabsListOffset = 0;

    containerNode.forEach((child: PMNode, offset: number) => {
      if (child.type.name === "tabs-list") {
        tabsListNode = child;
        tabsListOffset = offset;
      }
    });

    if (!tabsListNode) return;

    editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        // Create new trigger node
        const newTrigger = state.schema.nodes["tabs-trigger"].create(
          { value: newTabValue },
          state.schema.text("New Tab")
        );

        // Create new content node
        const newContent = state.schema.nodes["tabs-content"].create(
          { value: newTabValue },
          state.schema.nodes.paragraph.create()
        );

        // Insert trigger at end of tabs-list
        const triggerPos =
          pos + 1 + tabsListOffset + (tabsListNode?.nodeSize || 0);
        tr.insert(triggerPos, newTrigger);

        // Insert content at end of container
        const contentPos = pos + containerNode.nodeSize + newTrigger.nodeSize;
        tr.insert(contentPos, newContent);

        return true;
      })
      .run();
  }, [editor, containerNode, getPos]);

  return (
    <NodeViewWrapper className="tabs-container-node-view my-4 relative rounded-lg border bg-card p-4 pt-10">
      <div className="absolute top-2 right-2">
        <Button size="sm" variant="outline" onClick={handleAddTab}>
          + Add Tab
        </Button>
      </div>
      <NodeViewContent />
    </NodeViewWrapper>
  );
};

export const TabsExtension = ProseMirrorNode.create({
  name: "tabs-container",
  group: "block",
  content: "tabsListGroup tabsContentGroup+",
  defining: true,

  parseHTML() {
    return [{ tag: "div[data-type='tabs-container']" }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "tabs-container" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabsContainerNodeView);
  },
});

export const TabsListExtension = ProseMirrorNode.create({
  name: "tabs-list",
  group: "tabsListGroup",
  content: "tabsTriggerGroup+",
  defining: true,

  parseHTML() {
    return [{ tag: "div[data-type='tabs-list']" }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "tabs-list",
        class:
          "tabs-list-editor mb-2 flex flex-wrap -m-2 p-2 border-b bg-muted/50",
      }),
      0,
    ];
  },
});

const TabsTriggerNodeView: React.FC<NodeViewProps> = ({
  editor,
  node,
  getPos,
}) => {
  const handleDelete = useCallback(() => {
    const triggerPos = getPos();
    if (typeof triggerPos !== "number") return;

    const tabValue = node.attrs.value;

    editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        const $pos = state.doc.resolve(triggerPos);
        const containerNode = $pos.node(-2);

        if (!containerNode || containerNode.type.name !== "tabs-container") {
          return false;
        }

        // Find and collect positions to delete
        const toDelete: { pos: number; size: number }[] = [];

        containerNode.descendants((child: PMNode, pos: number) => {
          if (
            (child.type.name === "tabs-trigger" ||
              child.type.name === "tabs-content") &&
            child.attrs.value === tabValue
          ) {
            toDelete.push({
              pos: $pos.start(-2) + pos + 1,
              size: child.nodeSize,
            });
          }
        });

        // Delete from back to front to maintain positions
        toDelete
          .sort((a, b) => b.pos - a.pos)
          .forEach(({ pos, size }) => {
            tr.delete(pos, pos + size);
          });

        return true;
      })
      .run();
  }, [editor, node, getPos]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      const pos = getPos();
      if (typeof pos !== "number") return;

      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          const from = pos + 1;
          const to = from + node.content.size;
          tr.insertText(newContent, from, to);
          return true;
        })
        .run();
    },
    [editor, node, getPos]
  );

  return (
    <NodeViewWrapper
      as="div"
      className="tabs-trigger-editor m-1 inline-flex items-center rounded-md border bg-background group"
    >
      <div
        contentEditable
        suppressContentEditableWarning
        className="px-3 py-1.5 bg-transparent border-none focus:outline-none w-full min-w-[60px]"
        onBlur={(e) => {
          const newText = e.currentTarget.textContent || "New Tab";
          if (newText !== node.textContent) {
            handleContentChange(newText);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const newText = e.currentTarget.textContent || "New Tab";
            handleContentChange(newText);
            e.currentTarget.blur();
          }
        }}
      >
        {node.textContent || "New Tab"}
      </div>
      <button
        contentEditable={false}
        onClick={handleDelete}
        className="flex items-center p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus:opacity-100 focus:outline-none"
        aria-label="Delete tab"
      >
        <X size={14} />
      </button>
    </NodeViewWrapper>
  );
};

export const TabsTriggerExtension = ProseMirrorNode.create({
  name: "tabs-trigger",
  group: "tabsTriggerGroup",
  content: "text*",
  inline: false,
  defining: true,

  addAttributes() {
    return {
      value: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-value"),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='tabs-trigger']" }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "tabs-trigger" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabsTriggerNodeView);
  },
});

const TabsContentNodeView: React.FC<NodeViewProps> = ({
  node,
  editor,
  getPos,
}) => {
  const { value } = node.attrs;
  let triggerText = `(Orphaned Tab: ${value})`;

  const $pos = editor.state.doc.resolve(getPos());
  const containerNode = $pos.node(-1);

  if (containerNode && containerNode.type.name === "tabs-container") {
    containerNode.forEach((childNode: PMNode) => {
      if (childNode.type.name === "tabs-list") {
        childNode.forEach((triggerNode: PMNode) => {
          if (triggerNode.attrs.value === value) {
            triggerText = triggerNode.textContent || `Tab: ${value}`;
          }
        });
      }
    });
  }

  return (
    <NodeViewWrapper className="tabs-content-node-view my-2">
      <div className="p-2 text-xs font-semibold text-muted-foreground bg-muted rounded-t-lg border">
        Content for:{" "}
        <span className="font-bold text-foreground">{triggerText}</span>
      </div>
      <div className="p-4 border border-t-0 rounded-b-lg">
        <NodeViewContent className="content-editable" />
      </div>
    </NodeViewWrapper>
  );
};

export const TabsContentExtension = ProseMirrorNode.create({
  name: "tabs-content",
  group: "tabsContentGroup",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      value: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-value"),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='tabs-content']" }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabsContentNodeView);
  },
});
