import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CalloutNodeView } from "./callout-node-view";

export interface CalloutOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (
        type: "info" | "warn" | "error" | "success" | "warning"
      ) => ReturnType;
    };
  }
}

export const CalloutExtension = Node.create<CalloutOptions>({
  name: "callout",

  addOptions() {
    return {
      HTMLAttributes: {
        class: "not-prose",
      },
    };
  },

  group: "block",

  content: "block+",

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (element) => element.getAttribute("data-callout-type"),
        renderHTML: (attributes) => {
          return {
            "data-callout-type": attributes.type,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "callout" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView);
  },

  addCommands() {
    return {
      setCallout:
        (type) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { type });
        },
    };
  },
});
