"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { isAiEnhanceConfigured } from "@/lib/ai-enhance-env";
import type { AiEnhanceAvailability } from "@/lib/ai-enhance-env";
import type {
  EditModeData,
  AiProviderPref,
  AiAvailability,
  ViewMode,
  EditorThemeValue,
} from "./editor-types";
import { DEFAULT_MDX_CONTENT } from "./editor-types";

export function useEditorState(
  editMode: EditModeData | undefined,
  initialAiAvailability: AiEnhanceAvailability | undefined
) {
  const router = useRouter();
  const { toast } = useToast();
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mdxContent, setMdxContent] = useState(
    editMode?.content || DEFAULT_MDX_CONTENT
  );
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [fileName, setFileName] = useState(
    editMode?.filePath?.replace(/\.mdx$/, "") || "new-document"
  );
  const [wordCount, setWordCount] = useState(0);
  const [editorTheme, setEditorTheme] = useState<EditorThemeValue>("vs-dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [isAiEnhancing, setIsAiEnhancing] = useState(false);
  const [aiProviderPref, setAiProviderPref] = useState<AiProviderPref>("auto");
  const [aiAvailable, setAiAvailable] = useState<AiAvailability>(() =>
    initialAiAvailability !== undefined ? initialAiAvailability : null
  );

  const isAiEnhanceEnabled = useMemo(() => {
    if (aiAvailable === null) return false;
    return isAiEnhanceConfigured(aiAvailable);
  }, [aiAvailable]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  // Fetch AI availability from server
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai-enhance");
        if (!res.ok) return;
        const data = (await res.json()) as {
          available?: { openai: boolean; gemini: boolean; ollama: boolean };
        };
        if (!cancelled && data.available) {
          setAiAvailable(data.available);
        } else if (!cancelled && res.ok) {
          setAiAvailable({ openai: false, gemini: false, ollama: false });
        }
      } catch {
        /* ignore network errors */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Word count
  useEffect(() => {
    const text = mdxContent
      .replace(/---[\s\S]*?---/, "")
      .replace(/<[^>]*>/g, "");
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    setWordCount(words.length);
  }, [mdxContent]);

  // Responsive layout
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      if (window.innerWidth < 768) {
        if (viewMode === "split") setViewMode("editor");
        setIsPreviewVisible(false);
      } else {
        if (viewMode !== "split") {
          setViewMode("split");
          setIsPreviewVisible(true);
        }
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  // Listen for Monaco save shortcut
  useEffect(() => {
    const handleEditorSave = () => setIsSaveDialogOpen(true);
    window.addEventListener("editor-save", handleEditorSave);
    return () => window.removeEventListener("editor-save", handleEditorSave);
  }, []);

  const handleViewModeChange = (mode: "editor" | "preview") => {
    setViewMode(mode);
    if (mode === "preview") setIsPreviewVisible(true);
  };

  const handleSave = async (
    filePath: string,
    metadata: { title: string; description: string }
  ) => {
    try {
      let contentWithMetadata = mdxContent.replace(/^---[\s\S]*?---\n?/, "");
      const frontmatter = `---\ntitle: "${metadata.title}"\ndescription: "${metadata.description}"\n---\n\n`;
      contentWithMetadata = frontmatter + contentWithMetadata;

      const response = await fetch("/api/save-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath,
          content: contentWithMetadata.replace(/^---[\s\S]*?---\n/, ""),
          metadata,
          isUpdate: !!editMode,
          originalPath: editMode?.filePath,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to save file.");
      }

      try {
        const urlPath = filePath.replace(/\.mdx$/, "");
        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: `/docs/${urlPath}` }),
        });
      } catch (revalidateError) {
        console.warn("Revalidation failed:", revalidateError);
      }

      toast({
        title: "Success!",
        description: `${editMode ? "File updated" : "File saved"} successfully! Redirecting to view...`,
      });

      const urlPath = filePath.replace(/\.mdx$/, "");
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = setTimeout(() => {
        redirectTimeoutRef.current = null;
        window.location.href = `/docs/${urlPath}`;
      }, 1000);

      setFileName(filePath);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Failed to Save",
        description: error instanceof Error ? error.message : "An error occurred.",
      });
      throw error;
    }
  };

  const handleAiEnhancement = async (type: "fix" | "improve" | "format") => {
    if (!isAiEnhanceEnabled) return;
    setIsAiEnhancing(true);
    try {
      const response = await fetch("/api/ai-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: mdxContent,
          type,
          ...(aiProviderPref !== "auto" ? { provider: aiProviderPref } : {}),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to enhance content");
      }

      setMdxContent(result.enhancedContent);

      const actionText = { fix: "fixed", improve: "improved", format: "tidied" }[type];
      const via =
        result.provider && result.model
          ? ` (${result.provider}: ${result.model})`
          : "";

      toast({
        title: "AI enhancement complete",
        description: `Content was ${actionText} by AI. ${result.originalLength} → ${result.enhancedLength} characters.${via}`,
      });
    } catch (error) {
      console.error("AI Enhancement error:", error);
      toast({
        variant: "destructive",
        title: "AI enhancement failed",
        description: error instanceof Error ? error.message : "AI enhancement failed",
      });
    } finally {
      setIsAiEnhancing(false);
    }
  };

  return {
    router,
    mdxContent,
    setMdxContent,
    isPreviewVisible,
    setIsPreviewVisible,
    isSaveDialogOpen,
    setIsSaveDialogOpen,
    fileName,
    wordCount,
    editorTheme,
    setEditorTheme,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    viewMode,
    isAiEnhancing,
    aiProviderPref,
    setAiProviderPref,
    aiAvailable,
    isAiEnhanceEnabled,
    handleViewModeChange,
    handleSave,
    handleAiEnhancement,
  };
}
