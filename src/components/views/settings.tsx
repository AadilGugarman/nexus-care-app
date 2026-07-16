'use client';

import { memo, useRef, useState } from 'react';
import {
  Download,
  Upload,
  RefreshCw,
  Moon,
  Sun,
  Monitor,
  Shield,
  Database,
  Trash2,
  Check,
  Info,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { LogoutButton } from '@/components/auth/LogoutButton';

function SettingsImpl() {
  const { state, resetToSeed, importState } = useStore();
  const { user, profile, role, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
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
          settings: parsed.settings ?? { theme: 'system' },
        });
        setImportStatus('Backup restored successfully');
        setTimeout(() => setImportStatus(null), 2500);
      } catch {
        setImportStatus('Invalid backup file');
        setTimeout(() => setImportStatus(null), 2500);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function setTheme(theme: 'light' | 'dark' | 'system') {
    importState({ ...state, settings: { ...state.settings, theme } });
  }

  const themes: { key: 'light' | 'dark' | 'system'; label: string; Icon: typeof Sun }[] = [
    { key: 'light', label: 'Light', Icon: Sun },
    { key: 'dark', label: 'Dark', Icon: Moon },
    { key: 'system', label: 'System', Icon: Monitor },
  ];

  return (
    <div className="space-y-5 pb-2">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Manage backup, theme and data</p>
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
                'flex flex-col items-center gap-1 rounded-md py-2.5 transition-colors',
                state.settings.theme === key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-bold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Auth Status Panel */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          Authentication Status
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
                  <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">Logged In</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
                    {profile?.full_name || user.email}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    Active Session
                  </div>
                </div>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-700" />
              <div className="px-3 py-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-500 dark:text-slate-400 font-semibold mb-0.5">Email</div>
                  <div className="text-slate-900 dark:text-slate-50 font-bold truncate">{user.email}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 font-semibold mb-0.5">Role</div>
                  <div className="text-slate-900 dark:text-slate-50 font-bold uppercase">
                    {role === 'admin' ? '👑 Admin' : role === 'mr' ? '💼 MR' : '👤 Public'}
                  </div>
                </div>
              </div>
              <div className="px-3 py-2">
                <div className="text-slate-500 dark:text-slate-400 font-semibold mb-0.5 text-xs">User ID</div>
                <div className="text-slate-700 dark:text-slate-300 font-mono text-[10px] break-all">{user.id}</div>
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
                  <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">Not Logged In</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Using default user mode
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                    Guest Access
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

      {/* Role Debugging Panel */}
      {user && (
        <div>
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
            Role & Access Control
          </h2>
          <div className="card-clean overflow-hidden">
            <div className="px-3 py-3 space-y-3">
              {/* Current Role */}
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Current Role
                </div>
                <div className="flex items-center gap-2">
                  {role === 'admin' ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <span className="text-lg">👑</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Administrator</div>
                        <div className="text-xs text-slate-400">Full system access</div>
                      </div>
                    </>
                  ) : role === 'mr' ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <span className="text-lg">💼</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Medical Representative</div>
                        <div className="text-xs text-slate-400">Standard user access</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Public</div>
                        <div className="text-xs text-slate-400">Limited access</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Access Permissions */}
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Access Permissions
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Main Dashboard</span>
                    <span className="text-emerald-400 font-bold">✓ Allowed</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Doctor Management</span>
                    <span className="text-emerald-400 font-bold">✓ Allowed</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Routes & Visits</span>
                    <span className="text-emerald-400 font-bold">✓ Allowed</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Admin Panel</span>
                    {role === 'admin' ? (
                      <span className="text-emerald-400 font-bold">✓ Allowed</span>
                    ) : (
                      <span className="text-red-400 font-bold">✗ Denied</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Bulk Import</span>
                    {role === 'admin' ? (
                      <span className="text-emerald-400 font-bold">✓ Allowed</span>
                    ) : (
                      <span className="text-red-400 font-bold">✗ Denied</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Data Quality</span>
                    {role === 'admin' ? (
                      <span className="text-emerald-400 font-bold">✓ Allowed</span>
                    ) : (
                      <span className="text-red-400 font-bold">✗ Denied</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Test Admin Access */}
              {role === 'admin' && (
                <div className="pt-2 border-t border-slate-700">
                  <Link href="/admin">
                    <button className="w-full px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-bold hover:bg-yellow-500/20 transition-colors">
                      🔓 Access Admin Panel
                    </button>
                  </Link>
                </div>
              )}

              {role === 'mr' && (
                <div className="pt-2 border-t border-slate-700">
                  <div className="text-xs text-slate-400 text-center">
                    Admin access requires administrator role
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          Data & Backup
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
              <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">Export Backup</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Download all data as JSON</div>
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
              <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">Import Backup</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Restore from a previous backup</div>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="h-px bg-slate-200 dark:bg-slate-700" />
          <div className="px-3 py-3 flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Database className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">Supabase Cloud</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {state.doctors.length} doctors · {state.deletedDoctorIds.length} deleted ·{' '}
                {state.routes.length} route{state.routes.length === 1 ? '' : 's'}
              </div>
              <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                Connected
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          Danger Zone
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
              resetToSeed();
              setConfirmReset(false);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 text-left transition-colors',
              confirmReset
                ? 'bg-rose-600 text-white'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10',
            )}
          >
            <div
              className={cn(
                'h-9 w-9 rounded-lg flex items-center justify-center',
                confirmReset ? 'bg-white/20' : 'bg-rose-100 dark:bg-rose-500/20',
              )}
            >
              {confirmReset ? <Trash2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">{confirmReset ? 'Tap again to confirm reset' : 'Reset Data'}</div>
              <div className={cn('text-xs font-semibold', confirmReset ? 'text-white/90' : 'text-slate-500 dark:text-slate-400')}>
                Erase all local data and reload from seed
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="card-clean p-3 flex items-start gap-2.5">
        <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
          All data is synced with Supabase cloud database. LocalStorage backup is maintained for offline access. Export regularly for additional backup.
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-1 font-semibold">
        <Info className="h-3.5 w-3.5" />
        <span>MR Route Planner · v1.0</span>
      </div>
    </div>
  );
}

export const Settings = memo(SettingsImpl);
