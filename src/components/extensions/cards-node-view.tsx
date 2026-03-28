"use client";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { Cards } from "fumadocs-ui/components/card";

export const CardsNodeView = () => {
  return (
    <NodeViewWrapper className="mb-4">
      <Cards>
        <NodeViewContent />
      </Cards>
    </NodeViewWrapper>
  );
};
