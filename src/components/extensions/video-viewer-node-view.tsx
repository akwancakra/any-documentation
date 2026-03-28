"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { VideoViewer } from "@/components/markdown-ui/video-viewer";

export const VideoViewerNodeView = ({ node }: { node: any }) => {
  const { src, width, height, objectFit } = node.attrs;

  return (
    <NodeViewWrapper className="mb-4">
      <VideoViewer
        src={src}
        width={width}
        height={height}
        objectFit={objectFit}
      />
    </NodeViewWrapper>
  );
};
