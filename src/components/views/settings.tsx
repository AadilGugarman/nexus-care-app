"use client";

import { memo, useRef, useState } from "react";
import {
  Download,
  Upload,
  RefreshCw,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Check,
  User,
  LogIn,
  ArrowLeft,
  FileText,
  Mail,
  Type,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { FontSizePreference } from "@/lib/types";

interface SettingsProps {
  onBack?: () => void;
}

function SettingsImpl({ onBack }: SettingsProps) {
  const router = useRouter();
  const { state, resetToDefault, importState, updateSettings } = useStore();
  const { user, profile, role, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  function handleExport() {
    const data = {
      doctors: state.doctors,
      deletedDoctorIds: state.deletedDoctorIds,
      assignments: state.assignments,
      routeOrder: state.routeOrder,
      routes: state.routes,
      settings: state.settings,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `mr-route-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result));
        importState({
          doctors: parsed.doctors ?? [],
          deletedDoctorIds: parsed.deletedDoctorIds ?? [],
          assignments: parsed.assignments ?? {},
          routeOrder: parsed.routeOrder ?? {},
          routes: parsed.routes ?? [],
          settings: parsed.settings ?? {
            theme: "system",
            fontSize: "default",
          },
        });
        setImportStatus("Backup restored successfully");
        setTimeout(() => setImportStatus(null), 2500);
      } catch {
        setImportStatus("Invalid backup file");
        setTimeout(() => setImportStatus(null), 2500);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function setTheme(theme: "light" | "dark" | "system") {
    void updateSettings({ theme });
  }

  function setFontSize(fontSize: FontSizePreference) {
    void updateSettings({ fontSize });
  }

  const themes: {
    key: "light" | "dark" | "system";
    label: string;
    Icon: typeof Sun;
  }[] = [
    { key: "light", label: "Light", Icon: Sun },
    { key: "dark", label: "Dark", Icon: Moon },
    { key: "system", label: "System", Icon: Monitor },
  ];

  const fontSizes: {
    key: FontSizePreference;
    label: string;
    sample: string;
  }[] = [
    { key: "small", label: "Small", sample: "Aa" },
    { key: "default", label: "Default", sample: "Aa" },
    { key: "large", label: "Large", sample: "Aa" },
    { key: "extra-large", label: "Extra Large", sample: "Aa" },
  ];

  return (
    <div className="space-y-5 pb-2">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
          Manage your preferences
        </p>
      </div>

      {importStatus && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-3 py-2.5 flex items-center gap-2 text-sm font-semibold">
          <Check className="h-4 w-4" />
          {importStatus}
        </div>
      )}

      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          Appearance
        </h2>
        <div className="card-clean p-1 grid grid-cols-3 gap-1">
          {themes.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md py-2.5 transition-colors",
                state.settings.theme === key
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-bold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          Accessibility
        </h2>
        <div className="card-clean overflow-hidden">
          <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-700 flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center shrink-0">
              <Type className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">
                Text Size
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Adjust text across the app for better readability.
              </div>
            </div>
          </div>

          <div className="p-2 grid grid-cols-2 gap-2">
            {fontSizes.map(({ key, label, sample }) => {
              const isActive = state.settings.fontSize === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFontSize(key)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left transition-colors",
                    isActive
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10 dark:border-violet-500"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                        {label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                        {sample}
                      </div>
                    </div>
                    {isActive && (
                      <div className="h-5 w-5 rounded-full bg-violet-600 dark:bg-violet-500 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          Account
        </h2>
        <div className="card-clean overflow-hidden">
          {loading ? (
            <div className="px-3 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mt-1" />
              </div>
            </div>
          ) : user ? (
            <>
              <div className="px-3 py-3 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">
                    {profile?.full_name || "User"}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
                    {user.email}
                  </div>
                  {role && (
                    <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                      {role === "admin"
                        ? "👑 Admin"
                        : role === "mr"
                          ? "💼 MR"
                          : "👤 Public"}
                    </div>
                  )}
                </div>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-700" />
              <div className="px-3 py-2">
                <LogoutButton
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                />
              </div>
            </>
          ) : (
            <>
              <div className="px-3 py-3 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <LogIn className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">
                    Not Logged In
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Sign in to sync your data
                  </div>
                </div>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-700" />
              <div className="px-3 py-2 flex gap-2">
                <Link href="/login" className="flex-1">
                  <button
                    type="button"
                    className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
                  >
                    Sign In
                  </button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <button
                    type="button"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Sign Up
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          Data Backup
        </h2>
        <div className="card-clean overflow-hidden">
          <button
            type="button"
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">
                Export Backup
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Download your data
              </div>
            </div>
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={handleImportClick}
            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">
                Import Backup
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Restore from backup
              </div>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          Reset
        </h2>
        <div className="card-clean overflow-hidden border-rose-200 dark:border-rose-500/30">
          <button
            type="button"
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                setTimeout(() => setConfirmReset(false), 4000);
                return;
              }
              resetToDefault();
              setConfirmReset(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 text-left transition-colors",
              confirmReset
                ? "bg-rose-600 text-white"
                : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10",
            )}
          >
            <div
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center",
                confirmReset
                  ? "bg-white/20"
                  : "bg-rose-100 dark:bg-rose-500/20",
              )}
            >
              {confirmReset ? (
                <Trash2 className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">
                {confirmReset ? "Tap again to confirm" : "Clear Local Cache"}
              </div>
              <div
                className={cn(
                  "text-xs font-semibold",
                  confirmReset
                    ? "text-white/90"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                Clear browser cache and local state; data will reload from the
                database on refresh.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* About Section */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          About
        </h2>
        <div className="card-clean overflow-hidden">
          <div className="px-3 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">
                App Version
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                v1.0.0
              </div>
            </div>
          </div>
          <div className="h-px bg-slate-200 dark:bg-slate-700" />
          <a
            href="mailto:support@example.com"
            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">
                Contact Support
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Send us a message
              </div>
            </div>
          </a>
        </div>
      </div>

      <div className="pt-10 pb-4 text-center sm:pt-12">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Made with <span className="text-rose-500 dark:text-rose-400">❤️</span>{" "}
          by ASZ Nexus
        </p>
      </div>
    </div>
  );
}

export const Settings = memo(SettingsImpl);
