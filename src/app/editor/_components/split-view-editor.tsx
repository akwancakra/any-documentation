"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Eye,
  EyeOff,
  Wand2,
  Loader2,
  Menu,
  ArrowLeft,
  Settings2,
  FileText,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ToastProvider } from "@/components/ui/use-toast";
import { SaveDialog } from "@/app/editor/_components/save-dialog";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MDXCodeEditor, { MDXCodeEditorHandle } from "./mdx-code-editor";
import MDXPreview from "./mdx-preview";
import { ComponentReference } from "./component-reference";
import { useRouter } from "next/navigation";
import { extractFrontmatterMeta } from "@/lib/mdx-frontmatter-meta";
import type { AiEnhanceAvailability } from "@/lib/ai-enhance-env";
import { isAiEnhanceConfigured } from "@/lib/ai-enhance-env";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditModeData {
  content: string;
  metadata: {
    title?: string;
    description?: string;
  };
  filePath: string;
}

interface SplitViewEditorProps {
  editMode?: EditModeData;
  /** Dari server (ENV); menyamakan render pertama dengan ketersediaan API */
  initialAiAvailability?: AiEnhanceAvailability;
}

type AiProviderPref = "auto" | "openai" | "gemini" | "ollama";

/** Tooltip: elemen disabled tidak menerima hover, jadi trigger membungkus anak. */
function AiDisabledTooltip({
  children,
  message,
  active,
  triggerClassName = "inline-flex max-w-full cursor-default",
}: {
  children: ReactNode;
  message: string;
  /** true = AI aktif, tanpa tooltip */
  active: boolean;
  triggerClassName?: string;
}) {
  if (active) {
    return <>{children}</>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={triggerClassName}>{children}</div>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="end"
        sideOffset={6}
        className="max-w-72 px-3 py-2 text-left text-xs leading-relaxed"
      >
        {message}
      </TooltipContent>
    </Tooltip>
  );
}

type AiAvailability = {
  openai: boolean;
  gemini: boolean;
  ollama: boolean;
} | null;

function AiProviderSelect({
  value,
  onChange,
  available,
  triggerClassName,
  disabled,
}: {
  value: AiProviderPref;
  onChange: (v: AiProviderPref) => void;
  available: AiAvailability;
  triggerClassName?: string;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as AiProviderPref)}
      disabled={disabled}
    >
      <SelectTrigger size="sm" className={triggerClassName} disabled={disabled}>
        <SelectValue placeholder="AI provider" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auto">Auto</SelectItem>
        {available?.openai ? (
          <SelectItem value="openai">OpenAI</SelectItem>
        ) : null}
        {available?.gemini ? (
          <SelectItem value="gemini">Gemini</SelectItem>
        ) : null}
        {available?.ollama ? (
          <SelectItem value="ollama">Ollama</SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  );
}

const SplitViewEditor = ({
  editMode,
  initialAiAvailability,
}: SplitViewEditorProps) => {
  const router = useRouter();
  const editorRef = useRef<MDXCodeEditorHandle>(null);
  const [mdxContent, setMdxContent] = useState(
    editMode?.content ||
      `---
title: "New Document"
description: "A new MDX document"
---

# Welcome to MDX Editor

This is a **split view** editor for MDX files with **AI Enhancement**.

## Features

- 🎨 Live preview
- 📝 Syntax highlighting
- 🔥 Hot reload
- 📱 Responsive layout
- 🤖 **AI Enhancement** — auto-fix formatting and structure

## Try AI Enhancement

Below is intentionally messy content you can use to test AI enhancement:

### Messy Table

| Name    | Status | Notes                   |
| ------- | ------ | ----------------------- |
| Editor  | ✅     | Just testing            |
| Preview | ✅     | Real-time preview       |
| AI      | ✅     | OpenAI / Gemini / Ollama |

### Code Blocks

\`\`\`javascript
function test() {
          // unclosed-looking code block sample
}
\`\`\`

## Normal Content

<Callout type="info">
Use the **AI Enhancement** button in the toolbar to clean up the examples above.
</Callout>

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Fix Format</TabsTrigger>
    <TabsTrigger value="tab2">Tidy Layout</TabsTrigger>
    <TabsTrigger value="tab3">Improve Content</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Choose **"Fix Syntax & Format"** to repair syntax issues and broken formatting.
  </TabsContent>
  <TabsContent value="tab2">
    Choose **"Tidy Format"** to normalize spacing and consistency without changing meaning.
  </TabsContent>
  <TabsContent value="tab3">
    Choose **"Improve Content"** for clearer structure and richer MDX components.
  </TabsContent>
</Tabs>

Enjoy writing with AI! 🚀`
  );

  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [fileName, setFileName] = useState(
    editMode?.filePath?.replace(/\.mdx$/, "") || "new-document"
  );
  const [wordCount, setWordCount] = useState(0);
  const [editorTheme, setEditorTheme] = useState<string>("vs-dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">(
    "split"
  );
  const { toast } = useToast();
  const [isAiEnhancing, setIsAiEnhancing] = useState(false);
  const [aiProviderPref, setAiProviderPref] =
    useState<AiProviderPref>("auto");
  const [aiAvailable, setAiAvailable] = useState<AiAvailability>(() =>
    initialAiAvailability !== undefined ? initialAiAvailability : null,
  );
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAiEnhanceEnabled = useMemo(() => {
    if (aiAvailable === null) return false;
    return isAiEnhanceConfigured(aiAvailable);
  }, [aiAvailable]);

  const aiDisabledHint =
    "AI nonaktif: set OPENAI_API_KEY, GEMINI_API_KEY, atau OLLAMA_API_KEY di environment.";

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai-enhance");
        if (!res.ok) return;
        const data = (await res.json()) as {
          available?: {
            openai: boolean;
            gemini: boolean;
            ollama: boolean;
          };
        };
        if (!cancelled && data.available) {
          setAiAvailable(data.available);
        } else if (!cancelled && res.ok) {
          setAiAvailable({
            openai: false,
            gemini: false,
            ollama: false,
          });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Calculate word count
  useEffect(() => {
    const text = mdxContent
      .replace(/---[\s\S]*?---/, "")
      .replace(/<[^>]*>/g, "");
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    setWordCount(words.length);
  }, [mdxContent]);

  // Responsive layout - auto switch to single view on mobile
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Mobile: default to editor view
        if (viewMode === "split") {
          setViewMode("editor");
        }
        setIsPreviewVisible(false);
      } else {
        // Tablet/Desktop: enable split view
        if (viewMode !== "split") {
          setViewMode("split");
          setIsPreviewVisible(true);
        }
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  // Handle save
  const handleSave = async (
    filePath: string,
    metadata: { title: string; description: string }
  ) => {
    try {
      // Update frontmatter in content
      let contentWithMetadata = mdxContent;

      // Remove existing frontmatter
      contentWithMetadata = contentWithMetadata.replace(
        /^---[\s\S]*?---\n?/,
        ""
      );

      // Add new frontmatter
      const frontmatter = `---
title: "${metadata.title}"
description: "${metadata.description}"
---

`;

      contentWithMetadata = frontmatter + contentWithMetadata;

      const response = await fetch("/api/save-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath,
          content: contentWithMetadata.replace(/^---[\s\S]*?---\n/, ""), // Remove frontmatter for API
          metadata,
          isUpdate: !!editMode,
          originalPath: editMode?.filePath,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save file.");
      }

      // Force revalidation
      try {
        const urlPath = filePath.replace(/\.mdx$/, "");
        await fetch("/api/revalidate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: `/docs/${urlPath}`,
          }),
        });
      } catch (revalidateError) {
        console.warn("Revalidation failed:", revalidateError);
      }

      const successMessage = editMode
        ? "File updated successfully!"
        : "File saved successfully!";

      toast({
        title: "Success!",
        description: `${successMessage} Redirecting to view...`,
      });

      const urlPath = filePath.replace(/\.mdx$/, "");
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      redirectTimeoutRef.current = setTimeout(() => {
        redirectTimeoutRef.current = null;
        window.location.href = `/docs/${urlPath}`;
      }, 1000);

      setFileName(filePath);
    } catch (error) {
      console.error("Save error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred.";

      toast({
        variant: "destructive",
        title: "Failed to Save",
        description: errorMessage,
      });
      throw error;
    }
  };

  const currentMetadata = extractFrontmatterMeta(mdxContent);

  // Listen for Monaco Editor save shortcut
  useEffect(() => {
    const handleEditorSave = () => {
      setIsSaveDialogOpen(true);
    };

    window.addEventListener("editor-save", handleEditorSave);
    return () => {
      window.removeEventListener("editor-save", handleEditorSave);
    };
  }, []);

  // AI Enhancement function
  const handleAiEnhancement = async (type: "fix" | "improve" | "format") => {
    if (!isAiEnhanceEnabled) return;
    setIsAiEnhancing(true);
    try {
      const response = await fetch("/api/ai-enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      const actionText = {
        fix: "fixed",
        improve: "improved",
        format: "tidied",
      }[type];

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
      const errorMessage =
        error instanceof Error
          ? error.message
          : "AI enhancement failed";

      toast({
        variant: "destructive",
        title: "AI enhancement failed",
        description: errorMessage,
      });
    } finally {
      setIsAiEnhancing(false);
    }
  };

  const themeOptions = [
    // Dark Themes
    {
      category: "🌙 Dark Themes",
      value: "vs-dark",
      label: "VS Code Dark",
      icon: "🌙",
    },
    {
      category: "🌙 Dark Themes",
      value: "hc-black",
      label: "High Contrast Dark",
      icon: "⚫",
    },

    // Light Themes
    {
      category: "☀️ Light Themes",
      value: "vs",
      label: "VS Code Light",
      icon: "☀️",
    },
    {
      category: "☀️ Light Themes",
      value: "hc-light",
      label: "High Contrast Light",
      icon: "⚪",
    },
  ] as const;

  const getCurrentTheme = () => {
    return themeOptions.find((theme) => theme.value === editorTheme);
  };

  const darkThemes = themeOptions.filter(
    (theme) => theme.category === "🌙 Dark Themes"
  );
  const lightThemes = themeOptions.filter(
    (theme) => theme.category === "☀️ Light Themes"
  );

  // Handle view mode changes for mobile
  const handleViewModeChange = (mode: "editor" | "preview") => {
    setViewMode(mode);
    if (mode === "preview") {
      setIsPreviewVisible(true);
    }
  };

  // Mobile toolbar component
  const MobileToolbar = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="flex max-h-[85dvh] flex-col gap-0 overflow-y-auto rounded-t-xl px-4 pb-6 pt-2"
      >
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">View mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={viewMode === "editor" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  handleViewModeChange("editor");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full"
              >
                Editor
              </Button>
              <Button
                variant={viewMode === "preview" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  handleViewModeChange("preview");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full"
              >
                Preview
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Editor theme</h3>
            <div className="grid grid-cols-1 gap-1.5">
              {themeOptions.map((theme) => (
                <Button
                  key={theme.value}
                  variant={editorTheme === theme.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setEditorTheme(theme.value);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <span className="mr-2">{theme.icon}</span>
                  {theme.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">AI Enhancement</h3>
            <AiDisabledTooltip
              active={isAiEnhanceEnabled}
              message={aiDisabledHint}
              triggerClassName="block w-full space-y-2"
            >
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">AI provider</p>
                <AiProviderSelect
                  value={aiProviderPref}
                  onChange={setAiProviderPref}
                  available={aiAvailable}
                  triggerClassName="w-full"
                  disabled={!isAiEnhanceEnabled}
                />
              </div>
              <div className="space-y-1.5 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleAiEnhancement("fix");
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={!isAiEnhanceEnabled || isAiEnhancing}
                  className="w-full justify-start"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Fix Syntax & Format
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleAiEnhancement("format");
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={!isAiEnhanceEnabled || isAiEnhancing}
                  className="w-full justify-start"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Tidy Format
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleAiEnhancement("improve");
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={!isAiEnhanceEnabled || isAiEnhancing}
                  className="w-full justify-start"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Improve Content
                </Button>
              </div>
            </AiDisabledTooltip>
          </div>

          <div className="pt-4 border-t space-y-2">
            <ComponentReference editorRef={editorRef} />
            <Button
              className="w-full"
              onClick={() => {
                setIsSaveDialogOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              {editMode ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <SaveDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSave={handleSave}
        initialFileName={fileName}
        initialTitle={currentMetadata.title || editMode?.metadata?.title || ""}
        initialDescription={
          currentMetadata.description || editMode?.metadata?.description || ""
        }
        editMode={editMode}
      />

      <div className="flex h-screen bg-background flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="shrink-0 gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="hidden sm:block h-4 w-px bg-border shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <h1 className="font-medium text-sm truncate text-foreground/90">
                {editMode
                  ? (currentMetadata.title || fileName)
                  : "New document"}
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Component Reference Panel */}
            <div className="hidden md:block">
              <ComponentReference editorRef={editorRef} />
            </div>

            {/* AI Enhancement */}
            {isAiEnhanceEnabled ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={isAiEnhancing}
                  >
                    {isAiEnhancing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    <span className="hidden lg:inline">AI</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                    AI Enhancement
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleAiEnhancement("fix")}
                    disabled={isAiEnhancing}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Fix Syntax & Format
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAiEnhancement("format")}
                    disabled={isAiEnhancing}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Tidy Format
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAiEnhancement("improve")}
                    disabled={isAiEnhancing}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Improve Content
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <AiDisabledTooltip active={false} message={aiDisabledHint}>
                <Button variant="outline" size="sm" className="gap-2" disabled>
                  <Wand2 className="h-4 w-4" />
                  <span className="hidden lg:inline">AI</span>
                </Button>
              </AiDisabledTooltip>
            )}

            {/* Settings Dropdown (desktop) */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    <span className="hidden lg:inline">Settings</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {/* Preview toggle */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                    Layout
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                  >
                    {isPreviewVisible ? (
                      <EyeOff className="mr-2 h-4 w-4" />
                    ) : (
                      <Eye className="mr-2 h-4 w-4" />
                    )}
                    {isPreviewVisible ? "Hide preview" : "Show preview"}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Theme */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                    Editor theme
                  </DropdownMenuLabel>
                  {darkThemes.map((theme) => (
                    <DropdownMenuItem
                      key={theme.value}
                      onClick={() => setEditorTheme(theme.value)}
                      className={editorTheme === theme.value ? "bg-accent" : ""}
                    >
                      <span className="mr-2 text-sm">{theme.icon}</span>
                      {theme.label}
                      {editorTheme === theme.value && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                  {lightThemes.map((theme) => (
                    <DropdownMenuItem
                      key={theme.value}
                      onClick={() => setEditorTheme(theme.value)}
                      className={editorTheme === theme.value ? "bg-accent" : ""}
                    >
                      <span className="mr-2 text-sm">{theme.icon}</span>
                      {theme.label}
                      {editorTheme === theme.value && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />

                  {/* AI Provider */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                    AI provider
                  </DropdownMenuLabel>
                  <div className="px-2 pb-2">
                    <AiDisabledTooltip
                      active={isAiEnhanceEnabled}
                      message={aiDisabledHint}
                      triggerClassName="block w-full"
                    >
                      <AiProviderSelect
                        value={aiProviderPref}
                        onChange={setAiProviderPref}
                        available={aiAvailable}
                        triggerClassName="w-full h-8"
                        disabled={!isAiEnhanceEnabled}
                      />
                    </AiDisabledTooltip>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Save button */}
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setIsSaveDialogOpen(true)}
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">
                {editMode ? "Update" : "Save"}
              </span>
            </Button>

            {/* Mobile menu */}
            <MobileToolbar />
          </div>
        </header>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-1 border-b bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
            {editMode?.filePath && (
              <>
                <span className="hidden sm:inline text-border">|</span>
                <span className="hidden sm:inline truncate max-w-[300px]">
                  {editMode.filePath}
                </span>
              </>
            )}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span>{getCurrentTheme()?.label}</span>
          </div>
        </div>

        {/* Mobile View Mode Tabs */}
        <div className="md:hidden border-b bg-background">
          <div className="flex">
            <Button
              variant={viewMode === "editor" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("editor")}
              className="flex-1 rounded-none"
            >
              📝 Editor
            </Button>
            <Button
              variant={viewMode === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("preview")}
              className="flex-1 rounded-none"
            >
              👁️ Preview
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {/* Desktop/Tablet: Resizable split view */}
          <div className="hidden md:block h-full">
            {isPreviewVisible ? (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* Editor Panel */}
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full">
                    <MDXCodeEditor
                      ref={editorRef}
                      value={mdxContent}
                      onChange={setMdxContent}
                      theme={editorTheme}
                    />
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Preview Panel */}
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full">
                    <MDXPreview content={mdxContent} />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="h-full">
                <MDXCodeEditor
                  ref={editorRef}
                  value={mdxContent}
                  onChange={setMdxContent}
                  theme={editorTheme}
                />
              </div>
            )}
          </div>

          {/* Mobile: Single view mode */}
          <div className="md:hidden h-full">
            {viewMode === "editor" ? (
              <div className="h-full">
                <MDXCodeEditor
                  value={mdxContent}
                  onChange={setMdxContent}
                  theme={editorTheme}
                />
              </div>
            ) : (
              <div className="h-full">
                <MDXPreview content={mdxContent} />
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
