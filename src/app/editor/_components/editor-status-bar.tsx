"use client";

import type { EditorThemeValue, ViewMode } from "./editor-types";
import { THEME_OPTIONS } from "./editor-types";

interface EditorStatusBarProps {
  wordCount: number;
  filePath?: string;
  editorTheme: EditorThemeValue;
  viewMode: ViewMode;
  onViewModeChange: (mode: "editor" | "preview") => void;
}

export function EditorStatusBar({
  wordCount,
  filePath,
  editorTheme,
  viewMode,
  onViewModeChange,
}: EditorStatusBarProps) {
  const currentTheme = THEME_OPTIONS.find((t) => t.value === editorTheme);

  return (
    <>
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 border-b bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          {filePath && (
            <>
              <span className="hidden sm:inline text-border">|</span>
              <span className="hidden sm:inline truncate max-w-[300px]">
                {filePath}
              </span>
            </>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span>{currentTheme?.label}</span>
        </div>
      </div>

      {/* Mobile view mode tabs */}
      <div className="md:hidden border-b bg-background">
        <div className="flex">
          <button
            type="button"
            onClick={() => onViewModeChange("editor")}
            className={`flex-1 rounded-none py-2 text-sm font-medium transition-colors ${
              viewMode === "editor"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent text-foreground"
            }`}
          >
            📝 Editor
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("preview")}
            className={`flex-1 rounded-none py-2 text-sm font-medium transition-colors ${
              viewMode === "preview"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent text-foreground"
            }`}
          >
            👁️ Preview
          </button>
        </div>
      </div>
    </>
  );
}
