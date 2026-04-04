"use client";

import { type RefObject } from "react";
import { ArrowLeft, Eye, EyeOff, FileText, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ComponentReference } from "./component-reference";
import { AiEnhancementDropdown, AiDisabledTooltip, AiProviderSelect, AI_DISABLED_HINT } from "./ai-enhancement-controls";
import { MobileToolbar } from "./mobile-toolbar";
import type { MDXCodeEditorHandle } from "./mdx-code-editor";
import type { AiProviderPref, AiAvailability, ViewMode, EditorThemeValue } from "./editor-types";
import { THEME_OPTIONS } from "./editor-types";

interface EditorHeaderProps {
  editorRef: RefObject<MDXCodeEditorHandle | null>;
  documentTitle: string;
  isEditMode: boolean;
  isPreviewVisible: boolean;
  onTogglePreview: () => void;
  editorTheme: EditorThemeValue;
  onThemeChange: (theme: EditorThemeValue) => void;
  isAiEnhanceEnabled: boolean;
  isAiEnhancing: boolean;
  onAiEnhance: (type: "fix" | "improve" | "format") => void;
  aiProviderPref: AiProviderPref;
  onAiProviderChange: (v: AiProviderPref) => void;
  aiAvailable: AiAvailability;
  isMobileMenuOpen: boolean;
  onMobileMenuOpenChange: (open: boolean) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: "editor" | "preview") => void;
  onSave: () => void;
  onBack: () => void;
}

export function EditorHeader({
  editorRef,
  documentTitle,
  isEditMode,
  isPreviewVisible,
  onTogglePreview,
  editorTheme,
  onThemeChange,
  isAiEnhanceEnabled,
  isAiEnhancing,
  onAiEnhance,
  aiProviderPref,
  onAiProviderChange,
  aiAvailable,
  isMobileMenuOpen,
  onMobileMenuOpenChange,
  viewMode,
  onViewModeChange,
  onSave,
  onBack,
}: EditorHeaderProps) {
  const darkThemes = THEME_OPTIONS.filter((t) => t.category === "Dark Themes");
  const lightThemes = THEME_OPTIONS.filter((t) => t.category === "Light Themes");

  return (
    <header className="flex items-center justify-between px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="shrink-0 gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="hidden sm:block h-4 w-px bg-border shrink-0" />
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <h1 className="font-medium text-sm truncate text-foreground/90">
            {documentTitle}
          </h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Component Reference (desktop) */}
        <div className="hidden md:block">
          <ComponentReference editorRef={editorRef} />
        </div>

        {/* AI Enhancement */}
        <AiEnhancementDropdown
          isEnabled={isAiEnhanceEnabled}
          isEnhancing={isAiEnhancing}
          onEnhance={onAiEnhance}
        />

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
              <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                Layout
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={onTogglePreview}>
                {isPreviewVisible ? (
                  <EyeOff className="mr-2 h-4 w-4" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {isPreviewVisible ? "Hide preview" : "Show preview"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                Editor theme
              </DropdownMenuLabel>
              {[...darkThemes, ...lightThemes].map((theme) => (
                <DropdownMenuItem
                  key={theme.value}
                  onClick={() => onThemeChange(theme.value)}
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

              <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                AI provider
              </DropdownMenuLabel>
              <div className="px-2 pb-2">
                <AiDisabledTooltip
                  active={isAiEnhanceEnabled}
                  message={AI_DISABLED_HINT}
                  triggerClassName="block w-full"
                >
                  <AiProviderSelect
                    value={aiProviderPref}
                    onChange={onAiProviderChange}
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
        <Button size="sm" className="gap-2" onClick={onSave}>
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isEditMode ? "Update" : "Save"}
          </span>
        </Button>

        {/* Mobile menu */}
        <MobileToolbar
          editorRef={editorRef}
          isOpen={isMobileMenuOpen}
          onOpenChange={onMobileMenuOpenChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          editorTheme={editorTheme}
          onThemeChange={onThemeChange}
          aiProviderPref={aiProviderPref}
          onAiProviderChange={onAiProviderChange}
          aiAvailable={aiAvailable}
          isAiEnhanceEnabled={isAiEnhanceEnabled}
          isAiEnhancing={isAiEnhancing}
          onAiEnhance={onAiEnhance}
          isEditMode={isEditMode}
          onSave={onSave}
        />
      </div>
    </header>
  );
}
