"use client";
import dynamic from "next/dynamic";

const SplitViewEditorWithToast = dynamic(
  () => import("@/app/editor/_components/split-view-editor"),
  { ssr: false }
);
const EditorWithToast = dynamic(
  () => import("@/app/editor/_components/editor"),
  { ssr: false }
);

export default function CreateEditorClient({ type }: { type?: string }) {
  if (type === "live") {
    return <EditorWithToast />;
  }
  return <SplitViewEditorWithToast />;
}
