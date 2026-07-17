'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { User, LogIn, UserPlus, Crown, Briefcase, Loader2 } from 'lucide-react';
import { LogoutButton } from './LogoutButton';
import { NotificationBell } from '../NotificationBell';

interface AuthHeaderProps {
  variant?: 'default' | 'compact';
}

export function AuthHeader({ variant = 'default' }: AuthHeaderProps) {
  const { user, profile, role, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        <span className="text-xs text-slate-400">Loading...</span>
      </div>
    );
  }

  // Not logged in - show sign in/up buttons
  if (!user) {
    if (variant === 'compact') {
      return (
        <div className="flex items-center gap-2">
          <Link href="/login">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors">
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
      <div className="flex flex-col gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Welcome!</div>
            <div className="text-xs text-slate-400">Sign in to save your data</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="flex-1">
            <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-600 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors">
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
      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-800/50">
          <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white">
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
        <LogoutButton variant="ghost" size="sm" showText={false} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
        <User className="w-5 h-5 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate">
            {profile?.full_name || user.email}
          </span>
          {role === 'admin' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/30">
              <Crown className="w-3 h-3 text-yellow-500" />
              <span className="text-[10px] font-bold text-yellow-500 uppercase">Admin</span>
            </div>
          )}
          {role === 'mr' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30">
              <Briefcase className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase">MR</span>
            </div>
          )}
        </div>
        <div className="text-xs text-slate-400 truncate">{user.email}</div>
      </div>
      <NotificationBell />
      <LogoutButton variant="ghost" size="sm" showText={false} />
    </div>
  );
}
