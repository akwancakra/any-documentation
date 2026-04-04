"use client";

import { type ReactNode } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AiProviderPref, AiAvailability } from "./editor-types";

export const AI_DISABLED_HINT =
  "AI nonaktif: set OPENAI_API_KEY, GEMINI_API_KEY, atau OLLAMA_API_KEY di environment.";

interface AiDisabledTooltipProps {
  children: ReactNode;
  message: string;
  active: boolean;
  triggerClassName?: string;
}

export function AiDisabledTooltip({
  children,
  message,
  active,
  triggerClassName = "inline-flex max-w-full cursor-default",
}: AiDisabledTooltipProps) {
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

interface AiProviderSelectProps {
  value: AiProviderPref;
  onChange: (v: AiProviderPref) => void;
  available: AiAvailability;
  triggerClassName?: string;
  disabled?: boolean;
}

export function AiProviderSelect({
  value,
  onChange,
  available,
  triggerClassName,
  disabled,
}: AiProviderSelectProps) {
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
        {available?.openai ? <SelectItem value="openai">OpenAI</SelectItem> : null}
        {available?.gemini ? <SelectItem value="gemini">Gemini</SelectItem> : null}
        {available?.ollama ? <SelectItem value="ollama">Ollama</SelectItem> : null}
      </SelectContent>
    </Select>
  );
}

interface AiEnhancementDropdownProps {
  isEnabled: boolean;
  isEnhancing: boolean;
  onEnhance: (type: "fix" | "improve" | "format") => void;
}

export function AiEnhancementDropdown({
  isEnabled,
  isEnhancing,
  onEnhance,
}: AiEnhancementDropdownProps) {
  if (!isEnabled) {
    return (
      <AiDisabledTooltip active={false} message={AI_DISABLED_HINT}>
        <Button variant="outline" size="sm" className="gap-2" disabled>
          <Wand2 className="h-4 w-4" />
          <span className="hidden lg:inline">AI</span>
        </Button>
      </AiDisabledTooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isEnhancing}
        >
          {isEnhancing ? (
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
        <DropdownMenuItem onClick={() => onEnhance("fix")} disabled={isEnhancing}>
          <Wand2 className="mr-2 h-4 w-4" />
          Fix Syntax & Format
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEnhance("format")} disabled={isEnhancing}>
          <Wand2 className="mr-2 h-4 w-4" />
          Tidy Format
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEnhance("improve")} disabled={isEnhancing}>
          <Wand2 className="mr-2 h-4 w-4" />
          Improve Content
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
