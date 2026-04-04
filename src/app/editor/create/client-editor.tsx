"use client";
import dynamic from "next/dynamic";
import type { AiEnhanceAvailability } from "@/lib/ai-enhance-env";

const SplitViewEditorWithToast = dynamic(
  () => import("@/app/editor/_components/split-view-editor"),
  { ssr: false }
);
const EditorWithToast = dynamic(
  () => import("@/app/editor/_components/editor"),
  { ssr: false }
);

export default function CreateEditorClient({
  type,
  initialAiAvailability,
}: {
  type?: string;
  initialAiAvailability: AiEnhanceAvailability;
}) {
  if (type === "live") {
    return <EditorWithToast />;
  }
  return (
    <SplitViewEditorWithToast
      initialAiAvailability={initialAiAvailability}
    />
  );
}
