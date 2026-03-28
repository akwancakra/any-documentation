"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { cn } from "@/lib/utils";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      offset={16}
      gap={8}
      visibleToasts={4}
      expand={false}
      closeButton={false}
      className={cn("toaster group")}
      toastOptions={{
        unstyled: true,
        duration: 4000,
        classNames: {
          toast: cn(
            "!m-0 !flex !list-none !w-full !max-w-[min(92vw,420px)] !items-start !gap-3",
            "!rounded-lg !border !px-4 !py-3 !shadow-md"
          ),
          default:
            "!border-border !bg-background !text-foreground dark:!border-border dark:!bg-card",
          success: cn(
            "!border-emerald-300 !bg-emerald-100 !text-emerald-950",
            "dark:!border-emerald-700 dark:!bg-emerald-950 dark:!text-emerald-50"
          ),
          error: cn(
            "!border-red-300 !bg-red-100 !text-red-900",
            "dark:!border-red-800 dark:!bg-red-950 dark:!text-red-50"
          ),
          warning: cn(
            "!border-amber-300 !bg-amber-100 !text-amber-950",
            "dark:!border-amber-700 dark:!bg-amber-950 dark:!text-amber-50"
          ),
          info: cn(
            "!border-sky-300 !bg-sky-100 !text-sky-950",
            "dark:!border-sky-700 dark:!bg-sky-950 dark:!text-sky-50"
          ),
          loading:
            "!border-border !bg-zinc-100 !text-foreground dark:!border-zinc-700 dark:!bg-zinc-900 dark:!text-zinc-50",
          title: "!text-sm !font-medium !leading-snug !text-inherit",
          description:
            "!mt-1 !text-xs !leading-snug !text-muted-foreground dark:!text-muted-foreground",
          content: "!flex !min-w-0 !flex-1 !flex-col !gap-0",
          icon: "!mt-0.5 !flex !size-4 !shrink-0 [&_svg]:text-current",
          actionButton: "!shrink-0",
          cancelButton: "!shrink-0",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />,
        info: <InfoIcon className="size-4 text-sky-600 dark:text-sky-400" />,
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400" />
        ),
        error: <OctagonXIcon className="size-4 text-red-700 dark:text-red-300" />,
        loading: (
          <Loader2Icon className="size-4 animate-spin text-zinc-600 dark:text-zinc-400" />
        ),
      }}
      {...props}
    />
  );
};

export { Toaster };
