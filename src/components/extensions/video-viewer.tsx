import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { VideoViewerNodeView } from "./video-viewer-node-view";

// Deklarasi untuk command setVideoViewer
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoViewer: {
      /**
       * Add a video viewer
       */
      setVideoViewer: (options: {
        src: string;
        width?: string;
        height?: string;
        objectFit?: "contain" | "cover" | "fill" | "scale-down" | "none";
      }) => ReturnType;
    };
  }
}

export interface VideoViewerOptions {
  HTMLAttributes: Record<string, any>;
}

export const VideoViewerExtension = Node.create<VideoViewerOptions>({
  name: "video-viewer",

  addOptions() {
    return {
      HTMLAttributes: {
        class: "not-prose",
      },
    };
  },

  group: "block",

  atom: true,

  addAttributes() {
    return {
      src: {
        default: "",
      },
      width: {
        default: "100%",
      },
      height: {
        default: "400px",
      },
      objectFit: {
        default: "contain",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="video-viewer"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "video-viewer" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoViewerNodeView);
  },

  addCommands() {
    return {
      setVideoViewer:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
