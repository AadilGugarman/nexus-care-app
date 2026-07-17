'use client';

import { useAuth } from '@/lib/auth';
import { PublicHomePage } from './page-public';
import { MRDashboard } from './page-mr';

export default function HomePage() {
  const { user, role, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in or no role - Show public home page
  if (!user || !role) {
    return <PublicHomePage />;
  }

  // Admin - Should not reach here (login redirects to /admin directly)
  // But show message just in case
  if (role === 'admin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Admin users should access <a href="/admin" className="text-indigo-600 underline">/admin</a> directly
          </p>
        </div>
      </div>
    );
  }

  // MR - Show MR Dashboard
  if (role === 'mr') {
    return <MRDashboard />;
  }

  // Fallback to public
  return <PublicHomePage />;
}
