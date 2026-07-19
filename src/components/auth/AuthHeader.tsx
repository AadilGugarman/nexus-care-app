'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { User, LogIn, UserPlus, Crown, Briefcase, Loader2 } from 'lucide-react';

interface AuthHeaderProps {
  variant?: 'default' | 'compact';
}

export function AuthHeader({ variant = 'default' }: AuthHeaderProps) {
  const { user, profile, role, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <Loader2 className="w-4 h-4 animate-spin text-slate-500 dark:text-slate-400" />
        <span className="text-xs text-slate-500 dark:text-slate-400">Loading...</span>
      </div>
    );
  }

  // Not logged in - show sign in/up buttons
  if (!user) {
    if (variant === 'compact') {
      return (
        <div className="flex items-center gap-2">
          <Link href="/login">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </Link>
          <Link href="/signup">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Welcome!</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Sign in to save your data</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="flex-1">
            <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </Link>
          <Link href="/signup" className="flex-1">
            <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors">
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Logged in - show user info
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/50">
        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-900 dark:text-white">
            {profile?.full_name || user.email?.split('@')[0] || 'User'}
          </span>
          {role === 'admin' && (
            <Crown className="w-3 h-3 text-yellow-500" />
          )}
          {role === 'mr' && (
            <Briefcase className="w-3 h-3 text-blue-500" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/30">
        <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-slate-900 dark:text-white truncate">
            {profile?.full_name || user.email}
          </span>
          {role === 'admin' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30">
              <Crown className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Admin</span>
            </div>
          )}
          {role === 'mr' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              <Briefcase className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">MR</span>
            </div>
          )}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</div>
      </div>
    </div>
  );
}
