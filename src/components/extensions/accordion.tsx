import {
  Node as ProseMirrorNode,
  mergeAttributes,
  type Node as ProseMirrorNodeType,
} from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

const AccordionContainerNodeView: React.FC<NodeViewProps> = ({
  editor,
  getPos,
}) => {
  const handleAddItem = () => {
    const pos = getPos();
    if (typeof pos !== "number") return;

    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;

    const { tr } = editor.state;
    const endPos = pos + 1 + node.content.size;

    tr.insert(
      endPos,
      editor.schema.nodes["accordion-item"].create(
        { title: "New Item" },
        editor.schema.nodes.paragraph.create()
      )
    );
    editor.view.dispatch(tr);
  };

  return (
    <NodeViewWrapper className="accordion-container-node-view my-4 relative rounded-lg border bg-card p-4 pt-10">
      <div className="absolute top-2 right-2">
        <Button size="sm" variant="outline" onClick={handleAddItem}>
          + Add Item
        </Button>
      </div>
      <NodeViewContent />
    </NodeViewWrapper>
  );
};

export const AccordionExtension = ProseMirrorNode.create({
  name: "accordion-container",
  group: "block",
  content: "accordionItemGroup+",
  defining: true,

  addAttributes() {
    return {
      type: {
        default: "single",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-accordion-type"),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='accordion-container']" }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "accordion-container" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AccordionContainerNodeView);
  },
});

const AccordionItemNodeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  editor,
  getPos,
}) => {
  const [currentTitle, setCurrentTitle] = useState(node.attrs.title);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTitle(event.target.value);
  };

  const handleTitleBlur = () => {
    updateAttributes({ title: currentTitle });
  };

  const handleDelete = () => {
    const pos = getPos();
    if (typeof pos === "number") {
      editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .run();
    }
  };

  return (
    <NodeViewWrapper className="accordion-item-node-view my-2 border rounded-lg bg-card">
      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-t-lg group">
        <div className="flex items-center gap-2 flex-grow">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={currentTitle}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            className="font-semibold bg-transparent border-none p-0 focus:outline-none w-full"
            placeholder="Accordion Title"
          />
        </div>
        <button
          contentEditable={false}
          onClick={handleDelete}
          className="flex items-center p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus:opacity-100 focus:outline-none"
          aria-label="Delete item"
        >
          <X size={14} />
        </button>
      </div>
      <div className="p-4 border-t">
        <NodeViewContent className="content-editable" />
      </div>
    </NodeViewWrapper>
  );
};

export const AccordionItemExtension = ProseMirrorNode.create({
  name: "accordion-item",
  group: "accordionItemGroup",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      title: {
        default: "Accordion Title",
      },
      value: {
        default: `item-${Math.random().toString(36).substring(7)}`,
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='accordion-item']" }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "accordion-item" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AccordionItemNodeView);
  },
});
