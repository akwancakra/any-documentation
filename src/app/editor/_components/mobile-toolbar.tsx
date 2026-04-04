"use client";

import { type RefObject } from "react";
import { Menu, Save, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ComponentReference } from "./component-reference";
import { AiDisabledTooltip, AiProviderSelect, AI_DISABLED_HINT } from "./ai-enhancement-controls";
import type { MDXCodeEditorHandle } from "./mdx-code-editor";
import type { AiProviderPref, AiAvailability, ViewMode, EditorThemeValue } from "./editor-types";
import { THEME_OPTIONS } from "./editor-types";

interface MobileToolbarProps {
  editorRef: RefObject<MDXCodeEditorHandle | null>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: "editor" | "preview") => void;
  editorTheme: EditorThemeValue;
  onThemeChange: (theme: EditorThemeValue) => void;
  aiProviderPref: AiProviderPref;
  onAiProviderChange: (v: AiProviderPref) => void;
  aiAvailable: AiAvailability;
  isAiEnhanceEnabled: boolean;
  isAiEnhancing: boolean;
  onAiEnhance: (type: "fix" | "improve" | "format") => void;
  isEditMode: boolean;
  onSave: () => void;
}

export function MobileToolbar({
  editorRef,
  isOpen,
  onOpenChange,
  viewMode,
  onViewModeChange,
  editorTheme,
  onThemeChange,
  aiProviderPref,
  onAiProviderChange,
  aiAvailable,
  isAiEnhanceEnabled,
  isAiEnhancing,
  onAiEnhance,
  isEditMode,
  onSave,
}: MobileToolbarProps) {
  const closeAndCall = (fn: () => void) => () => {
    fn();
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
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
          {/* View mode */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">View mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={viewMode === "editor" ? "default" : "outline"}
                size="sm"
                onClick={closeAndCall(() => onViewModeChange("editor"))}
                className="w-full"
              >
                Editor
              </Button>
              <Button
                variant={viewMode === "preview" ? "default" : "outline"}
                size="sm"
                onClick={closeAndCall(() => onViewModeChange("preview"))}
                className="w-full"
              >
                Preview
              </Button>
            </div>
          </div>

          {/* Editor theme */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Editor theme</h3>
            <div className="grid grid-cols-1 gap-1.5">
              {THEME_OPTIONS.map((theme) => (
                <Button
                  key={theme.value}
                  variant={editorTheme === theme.value ? "default" : "outline"}
                  size="sm"
                  onClick={closeAndCall(() => onThemeChange(theme.value))}
                  className="w-full justify-start"
                >
                  <span className="mr-2">{theme.icon}</span>
                  {theme.label}
                </Button>
              ))}
            </div>
          </div>

          {/* AI Enhancement */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">AI Enhancement</h3>
            <AiDisabledTooltip
              active={isAiEnhanceEnabled}
              message={AI_DISABLED_HINT}
              triggerClassName="block w-full space-y-2"
            >
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">AI provider</p>
                <AiProviderSelect
                  value={aiProviderPref}
                  onChange={onAiProviderChange}
                  available={aiAvailable}
                  triggerClassName="w-full"
                  disabled={!isAiEnhanceEnabled}
                />
              </div>
              <div className="space-y-1.5 mt-2">
                {(["fix", "format", "improve"] as const).map((type) => {
                  const labels = {
                    fix: "Fix Syntax & Format",
                    format: "Tidy Format",
                    improve: "Improve Content",
                  };
                  return (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={closeAndCall(() => onAiEnhance(type))}
                      disabled={!isAiEnhanceEnabled || isAiEnhancing}
                      className="w-full justify-start"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      {labels[type]}
                    </Button>
                  );
                })}
              </div>
            </AiDisabledTooltip>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t space-y-2">
            <ComponentReference editorRef={editorRef} />
            <Button className="w-full" onClick={closeAndCall(onSave)}>
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
