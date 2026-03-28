"use client";

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { toast as sonnerToast } from "sonner";

type ToastType = "default" | "success" | "destructive";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastType;
  action?: ReactNode;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id?: string | number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useCallback(
    ({
      title,
      description,
      variant = "default",
      action,
    }: Omit<Toast, "id">) => {
      const opts = {
        description,
        duration: action ? 8000 : 4000,
        ...(action !== undefined ? { action } : {}),
      };

      if (variant === "destructive") {
        sonnerToast.error(title, opts);
        return;
      }
      if (variant === "success") {
        sonnerToast.success(title, opts);
        return;
      }
      sonnerToast(title, opts);
    },
    [],
  );

  const dismiss = useCallback((id?: string | number) => {
    sonnerToast.dismiss(id);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts: [], toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
