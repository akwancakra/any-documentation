"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { PDFViewer } from "@/components/markdown-ui/pdf-viewer";

export const PDFViewerNodeView = ({ node }: { node: any }) => {
  const { src, width, height, title } = node.attrs;

  return (
    <NodeViewWrapper className="mb-4">
      {title && <div className="text-center font-medium mb-2">{title}</div>}
      <PDFViewer src={src} width={width} height={height} title={title} />
    </NodeViewWrapper>
  );
};
