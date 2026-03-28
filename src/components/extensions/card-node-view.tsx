"use client";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { Card } from "fumadocs-ui/components/card";
import { useState } from "react";

export const CardNodeView = ({
  node,
  updateAttributes,
}: {
  node: any;
  updateAttributes: any;
}) => {
  const { title, href, external } = node.attrs;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(title);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    updateAttributes({ title: titleValue });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditingTitle(false);
      updateAttributes({ title: titleValue });
    }
    if (e.key === "Escape") {
      setIsEditingTitle(false);
      setTitleValue(title);
    }
  };

  return (
    <NodeViewWrapper>
      <Card title={title} href={href} external={external}>
        {isEditingTitle ? (
          <input
            type="text"
            value={titleValue}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="w-full bg-transparent border-none outline-none font-medium"
            autoFocus
            title="Edit card title"
            aria-label="Edit card title"
            placeholder="Enter card title"
          />
        ) : (
          <div onClick={handleTitleClick} className="cursor-pointer">
            {title}
          </div>
        )}
        <NodeViewContent />
      </Card>
    </NodeViewWrapper>
  );
};
