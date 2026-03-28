"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useToolbar } from "./toolbar-provider";

const calloutTypes = [
  { type: "info", label: "Info", icon: Info, color: "text-blue-600" },
  {
    type: "warn",
    label: "Warning",
    icon: AlertTriangle,
    color: "text-yellow-600",
  },
  { type: "error", label: "Error", icon: AlertCircle, color: "text-red-600" },
  {
    type: "success",
    label: "Success",
    icon: CheckCircle,
    color: "text-green-600",
  },
];

export const CalloutToolbar = () => {
  const { editor } = useToolbar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={
                editor.isActive("callout")
                  ? "bg-accent text-accent-foreground"
                  : ""
              }
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {calloutTypes.map(({ type, label, icon: Icon, color }) => (
              <DropdownMenuItem
                key={type}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .setCallout(type as any)
                    .run()
                }
                className="flex items-center gap-2"
              >
                <Icon className={`h-4 w-4 ${color}`} />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipTrigger>
      <TooltipContent>
        <p>Pesan Sorot</p>
      </TooltipContent>
    </Tooltip>
  );
};
