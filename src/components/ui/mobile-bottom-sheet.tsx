"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

interface MobileBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
}

export function MobileBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  showCloseButton = true,
}: MobileBottomSheetProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div
          className={[
            "mx-auto flex max-h-[90vh] max-w-xl flex-col overflow-hidden rounded-t-[28px] border border-b-0 border-slate-200/70 bg-white shadow-2xl dark:border-slate-700/80 dark:bg-slate-900",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>

          <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {title}
              </h2>
              {description && (
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className={contentClassName ?? "flex-1 overflow-y-auto"}>
            {children}
          </div>

          {footer && (
            <div className="border-t border-slate-200 px-5 py-4 safe-bottom dark:border-slate-700">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
