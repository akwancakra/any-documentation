import { mergeAttributes, Node } from "@tiptap/core";

export interface PDFViewerOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pdfViewer: {
      /**
       * Add a PDF viewer
       */
      setPDFViewer: (options: { src: string; width?: string; height?: string }) => ReturnType;
    };
  }
}

export const PDFViewerExtension = Node.create<PDFViewerOptions>({
  name: "pdf-viewer",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  content: "",

  marks: "",

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: "100%",
      },
      height: {
        default: "500px",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "pdf-viewer",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, width, height } = HTMLAttributes;
    
    // Tentukan jenis sumber PDF
    const isGoogleDrive = src?.includes("drive.google.com");
    const isExternalUrl = src?.startsWith("http://") || src?.startsWith("https://");
    const isDataUrl = src?.startsWith("data:");
    const isLocalFile = !isExternalUrl && !isDataUrl;

    // Hanya tambahkan awalan / jika src bukan URL lengkap
    const pdfSrc =
      isExternalUrl || isDataUrl ? src : src?.startsWith("/") ? src : `/${src}`;

    // Tambahkan parameter untuk Google Drive jika diperlukan
    const finalSrc =
      isGoogleDrive && !pdfSrc?.includes("#view=")
        ? `${pdfSrc}#view=FitH`
        : pdfSrc;
    
    if (isLocalFile) {
      return [
        "div",
        { class: "my-4" },
        [
          "div",
          { class: "overflow-hidden rounded-md border" },
          [
            "object",
            {
              data: finalSrc,
              type: "application/pdf",
              width: width,
              height: height,
              class: "w-full",
            },
            [
              "p",
              { class: "p-4 text-center text-sm text-gray-500" },
              `Browser Anda tidak mendukung tampilan PDF. Silakan `,
              [
                "a",
                {
                  href: finalSrc,
                  download: "",
                  class: "text-blue-500 hover:underline",
                },
                "download file",
              ],
              " untuk melihatnya.",
            ],
          ],
        ],
      ];
    } else {
      return [
        "div",
        { class: "my-4" },
        [
          "div",
          { class: "overflow-hidden rounded-md border" },
          [
            "iframe",
            {
              src: finalSrc,
              width: width,
              height: height,
              style: "border: none;",
              loading: "lazy",
              sandbox: "allow-scripts allow-same-origin allow-forms allow-popups allow-downloads",
              allow: "fullscreen",
              referrerpolicy: "no-referrer",
            },
          ],
        ],
      ];
    }
  },

  addCommands() {
    return {
      setPDFViewer:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              width: options.width,
              height: options.height,
            },
          });
        },
    };
  },
}); 