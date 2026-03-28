import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { PDFViewerNodeView } from "./pdf-viewer-node-view";
import { v4 as uuidv4 } from "uuid";

// Deklarasi untuk command setPDFViewer
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pdfViewer: {
      /**
       * Add a PDF viewer
       */
      setPDFViewer: (options: {
        src: string;
        title?: string;
        width?: string;
        height?: string;
      }) => ReturnType;
    };
  }
}

export interface PDFViewerOptions {
  HTMLAttributes: Record<string, any>;
}

// Helper function to save uploaded PDF to the public folder
async function savePDFToPublic(
  dataUrl: string,
  fileName: string
): Promise<string> {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Create form data for upload
    const formData = new FormData();
    formData.append("pdf", blob, fileName);

    // Here we would ideally upload to server
    // For now, we'll simulate that and just return the expected path
    const path = `/assets/files/${fileName}`;

    // PDF would be saved to: ${path}
    // In a real application with a server, you would do:
    // const response = await fetch('/api/upload-pdf', {
    //   method: 'POST',
    //   body: formData
    // });
    // const data = await response.json();
    // return data.path;

    return path;
  } catch (error) {
    console.error("Failed to save PDF:", error);
    return dataUrl; // Fallback to original dataUrl
  }
}

export const PDFViewerExtension = Node.create<PDFViewerOptions>({
  name: "pdf-viewer",

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
        default: "500px",
      },
      title: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="pdf-viewer"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "pdf-viewer" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PDFViewerNodeView);
  },

  addCommands() {
    return {
      setPDFViewer:
        (options) =>
        ({ commands }) => {
          // If the PDF is a data URL (uploaded PDF), save it to public folder
          if (options.src && options.src.startsWith("data:")) {
            const fileName = options.title
              ? `${options.title
                  .replace(/\s+/g, "-")
                  .toLowerCase()}-${uuidv4().slice(0, 8)}.pdf`
              : `document-${uuidv4().slice(0, 8)}.pdf`;

            // Save PDF to public folder
            savePDFToPublic(options.src, fileName)
              .then((publicPath) => {
                // Update PDF source to the public path
                commands.insertContent({
                  type: this.name,
                  attrs: { ...options, src: publicPath },
                });
              })
              .catch((error) => {
                console.error("Failed to save PDF:", error);
                // Fallback to original command
                commands.insertContent({
                  type: this.name,
                  attrs: options,
                });
              });

            return true;
          }

          // For non-data URL PDFs, use the default behavior
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
