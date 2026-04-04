"use client";

import { useRef } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ToastProvider } from "@/components/ui/use-toast";
import { SaveDialog } from "@/app/editor/_components/save-dialog";
import MDXCodeEditor, { type MDXCodeEditorHandle } from "./mdx-code-editor";
import MDXPreview from "./mdx-preview";
import { EditorHeader } from "./editor-header";
import { EditorStatusBar } from "./editor-status-bar";
import { useEditorState } from "./use-editor-state";
import { extractFrontmatterMeta } from "@/lib/mdx-frontmatter-meta";
import type { AiEnhanceAvailability } from "@/lib/ai-enhance-env";
import type { EditModeData } from "./editor-types";

interface SplitViewEditorProps {
  editMode?: EditModeData;
  initialAiAvailability?: AiEnhanceAvailability;
}

const SplitViewEditor = ({
  editMode,
  initialAiAvailability,
}: SplitViewEditorProps) => {
  const editorRef = useRef<MDXCodeEditorHandle>(null);
  const state = useEditorState(editMode, initialAiAvailability);
  const currentMetadata = extractFrontmatterMeta(state.mdxContent);

  const documentTitle = editMode
    ? currentMetadata.title || state.fileName
    : "New document";

  return (
    <>
      <SaveDialog
        open={state.isSaveDialogOpen}
        onOpenChange={state.setIsSaveDialogOpen}
        onSave={state.handleSave}
        initialFileName={state.fileName}
        initialTitle={currentMetadata.title || editMode?.metadata?.title || ""}
        initialDescription={
          currentMetadata.description || editMode?.metadata?.description || ""
        }
        editMode={editMode}
      />

      <div className="flex h-screen bg-background flex-col">
        <EditorHeader
          editorRef={editorRef}
          documentTitle={documentTitle}
          isEditMode={!!editMode}
          isPreviewVisible={state.isPreviewVisible}
          onTogglePreview={() => state.setIsPreviewVisible((v) => !v)}
          editorTheme={state.editorTheme}
          onThemeChange={state.setEditorTheme}
          isAiEnhanceEnabled={state.isAiEnhanceEnabled}
          isAiEnhancing={state.isAiEnhancing}
          onAiEnhance={state.handleAiEnhancement}
          aiProviderPref={state.aiProviderPref}
          onAiProviderChange={state.setAiProviderPref}
          aiAvailable={state.aiAvailable}
          isMobileMenuOpen={state.isMobileMenuOpen}
          onMobileMenuOpenChange={state.setIsMobileMenuOpen}
          viewMode={state.viewMode}
          onViewModeChange={state.handleViewModeChange}
          onSave={() => state.setIsSaveDialogOpen(true)}
          onBack={() => state.router.back()}
        />

        <EditorStatusBar
          wordCount={state.wordCount}
          filePath={editMode?.filePath}
          editorTheme={state.editorTheme}
          viewMode={state.viewMode}
          onViewModeChange={state.handleViewModeChange}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {/* Desktop/Tablet: Resizable split view */}
          <div className="hidden md:block h-full">
            {state.isPreviewVisible ? (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full">
                    <MDXCodeEditor
                      ref={editorRef}
                      value={state.mdxContent}
                      onChange={state.setMdxContent}
                      theme={state.editorTheme}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full">
                    <MDXPreview content={state.mdxContent} />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="h-full">
                <MDXCodeEditor
                  ref={editorRef}
                  value={state.mdxContent}
                  onChange={state.setMdxContent}
                  theme={state.editorTheme}
                />
              </div>
            )}
          </div>

          {/* Mobile: Single view mode */}
          <div className="md:hidden h-full">
            {state.viewMode === "editor" ? (
              <div className="h-full">
                <MDXCodeEditor
                  value={state.mdxContent}
                  onChange={state.setMdxContent}
                  theme={state.editorTheme}
                />
              </div>
            ) : (
              <div className="h-full">
                <MDXPreview content={state.mdxContent} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const SplitViewEditorWithToast = (props: SplitViewEditorProps) => (
  <ToastProvider>
    <SplitViewEditor {...props} />
  </ToastProvider>
);

export default SplitViewEditorWithToast;
