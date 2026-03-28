"use client";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Callout } from "fumadocs-ui/components/callout";

const calloutConfig = {
  info: {
    icon: Info,
    className:
      "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
    iconClassName: "text-blue-600 dark:text-blue-400",
  },
  warn: {
    icon: AlertTriangle,
    className:
      "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
    iconClassName: "text-yellow-600 dark:text-yellow-400",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
    iconClassName: "text-yellow-600 dark:text-yellow-400",
  },
  error: {
    icon: AlertCircle,
    className:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
    iconClassName: "text-red-600 dark:text-red-400",
  },
  success: {
    icon: CheckCircle,
    className:
      "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
    iconClassName: "text-green-600 dark:text-green-400",
  },
};

export const CalloutNodeView = ({ node }: { node: any }) => {
  const type = node.attrs.type || "info";

  return (
    <NodeViewWrapper className="mb-4">
      <Callout type={type as any}>
        <NodeViewContent />
      </Callout>
    </NodeViewWrapper>
  );
};
