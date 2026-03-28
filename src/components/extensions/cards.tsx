import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewContent,
  NodeViewWrapper,
} from "@tiptap/react";
import { Card, Cards } from "fumadocs-ui/components/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Edit2 } from "lucide-react";

// Node view untuk Card
const CardNodeView = ({
  node,
  updateAttributes,
}: {
  node: any;
  updateAttributes: any;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(node.attrs.title);
  const [tempHref, setTempHref] = useState(node.attrs.href);

  const handleSave = () => {
    updateAttributes({ title: tempTitle, href: tempHref });
    setIsEditing(false);
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  return (
    <NodeViewWrapper>
      <div className="relative group">
        {/* Edit button overlay - only visible on hover */}
        <button
          onClick={handleTitleClick}
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary text-primary-foreground rounded-full p-1 z-10 hover:bg-primary/80"
          title="Edit card"
        >
          <Edit2 className="h-3 w-3" />
        </button>
        <Card title={node.attrs.title} href={node.attrs.href}>
          <NodeViewContent />
        </Card>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-xs w-full p-0 overflow-hidden rounded-xl">
          <DialogHeader className="bg-muted px-6 py-4 border-b">
            <DialogTitle className="text-base font-semibold">
              Edit Card
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="flex flex-col gap-0"
          >
            <div className="flex flex-col gap-2 px-6 py-4">
              <label htmlFor="title" className="text-xs font-medium mb-1">
                Title
              </label>
              <Input
                id="title"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="mb-2"
                autoFocus
              />
              <label htmlFor="href" className="text-xs font-medium mb-1">
                URL
              </label>
              <Input
                id="href"
                value={tempHref}
                onChange={(e) => setTempHref(e.target.value)}
                className="mb-2"
              />
            </div>
            <DialogFooter className="bg-muted/50 px-6 py-3 border-t flex justify-end">
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  );
};

export interface CardsOptions {
  HTMLAttributes: Record<string, any>;
}

// Cards container node view with default responsive layout
const CardsNodeView = ({ node }: { node: any }) => {
  return (
    <NodeViewWrapper>
      <Cards className="grid grid-cols-2 gap-4">
        <NodeViewContent />
      </Cards>
    </NodeViewWrapper>
  );
};

export const CardsExtension = Node.create<CardsOptions>({
  name: "cards",

  addOptions() {
    return {
      HTMLAttributes: {
        class: "not-prose",
      },
    };
  },

  group: "block",

  content: "card+",

  parseHTML() {
    return [
      {
        tag: 'div[data-type="cards"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "cards" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CardsNodeView);
  },
});

export const CardExtension = Node.create({
  name: "card",

  group: "block",

  content: "block+",

  addAttributes() {
    return {
      title: {
        default: "Card Title",
      },
      href: {
        default: "#",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="card"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "card" }, HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CardNodeView);
  },
});
