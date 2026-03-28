"use client";

import { AlertCircle, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToolbar } from "@/components/toolbars/toolbar-provider";

type CalloutType = "info" | "warning" | "error" | "success";

// Definisikan SVG path untuk setiap ikon
const iconPaths = {
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  warning:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  error:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
  success:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
};

// Komponen React untuk tampilan di dropdown
const calloutIcons = {
  info: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
};

const calloutLabels = {
  info: "Information",
  warning: "Warning",
  error: "Error",
  success: "Success",
};

// Variasi warna untuk setiap tipe callout
const calloutVariants = {
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
  warning:
    "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-300",
  error:
    "border-destructive bg-destructive/10 text-destructive dark:border-destructive dark:bg-destructive/20 dark:text-destructive",
  success:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300",
};

const CalloutToolbar = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, onClick, children, ...props }, ref) => {
  const { editor } = useToolbar();

  const insertCallout = (type: CalloutType) => {
    if (!editor) return;

    const variantClass = calloutVariants[type];
    const iconSvg = iconPaths[type];

    // Buat HTML untuk alert yang sesuai dengan komponen Alert.tsx
    const alertHtml = `
      <div data-slot="alert" role="alert" class="relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] gap-x-3 gap-y-0.5 items-start mb-4 ${variantClass}" data-callout-type="${type}">
        ${iconSvg}
        <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">
          ${calloutLabels[type]}
        </div>
        <div data-slot="alert-description" class="col-start-2 grid justify-items-start gap-1 text-sm">
          <p class="leading-relaxed">Tulis pesan ${calloutLabels[
            type
          ].toLowerCase()} di sini.</p>
        </div>
      </div>
    `;

    // Sisipkan alert ke editor
    editor.chain().focus().insertContent(alertHtml).run();
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", className)}
              ref={ref}
              {...props}
            >
              {children || <AlertCircle className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <span>Callout</span>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start">
        {(Object.keys(calloutIcons) as CalloutType[]).map((type) => (
          <DropdownMenuItem
            key={type}
            onClick={() => insertCallout(type)}
            className="flex items-center gap-2"
          >
            {calloutIcons[type]}
            <span>{calloutLabels[type]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

CalloutToolbar.displayName = "CalloutToolbar";

export { CalloutToolbar };
