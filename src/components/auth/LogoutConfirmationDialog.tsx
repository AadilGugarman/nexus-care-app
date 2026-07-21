"use client";

import * as React from "react";
import { Loader2, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";

interface LogoutConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function LogoutConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: LogoutConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6">
        <div className="space-y-5">
          {/* Icon Badge */}
          <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
            <LogOut className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>

          {/* Title and Description */}
          <div className="text-center space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Sign Out?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You'll need to sign in again to continue using the app.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full h-11 rounded-lg text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing Out...
                </>
              ) : (
                'Sign Out'
              )}
            </button>
            <DialogClose asChild>
              <button
                type="button"
                disabled={isLoading}
                className="w-full h-11 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
