"use client";

import * as React from "react";
import { Loader2, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <DialogContent className="sm:max-w-[480px] p-6 border border-slate-700 bg-slate-900 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
        <DialogHeader className="space-y-4 text-center sm:text-left">
          {/* Large circular icon with gradient */}
          <div className="flex justify-center sm:justify-start">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center">
              <LogOut className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-2xl sm:text-2xl font-bold text-slate-50">
              Sign Out
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-slate-400">
              Are you sure you want to sign out of your account?
              <br />
              You'll need to sign in again to continue.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
            <DialogClose asChild>
              <Button
                variant="outline"
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-900/20 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </>
              )}
            </Button>
          </div>
          
          {/* Subtle divider and security note */}
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center sm:text-left">
              Your session will end immediately.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
