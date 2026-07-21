'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Home, ArrowLeft, Crown, Briefcase } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

function AccessDeniedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, role, loading } = useAuth();
  
  const requiredRole = searchParams?.get('required') || 'admin';
  const currentRole = searchParams?.get('current') || role || 'unknown';

  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Access Denied
          </h1>
          <p className="text-slate-400">
            You don't have permission to access this page
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
          <div className="space-y-4">
            {/* Required Role */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Required Role
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-white font-semibold capitalize">
                  {requiredRole}
                </span>
              </div>
            </div>

            {/* Current Role */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Your Current Role
              </div>
              <div className="flex items-center gap-2">
                {currentRole === 'admin' ? (
                  <Crown className="w-4 h-4 text-yellow-500" />
                ) : currentRole === 'mr' ? (
                  <Briefcase className="w-4 h-4 text-blue-500" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-slate-500" />
                )}
                <span className="text-white font-semibold capitalize">
                  {currentRole}
                </span>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Signed In As
                </div>
                <div className="text-white font-mono text-sm break-all">
                  {profile?.full_name || user.email}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/" className="block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>

          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Auto Redirect Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Redirecting to dashboard in{' '}
            <span className="font-bold text-blue-400">{countdown}</span>{' '}
            {countdown === 1 ? 'second' : 'seconds'}...
          </p>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <p className="text-xs text-slate-400 text-center">
            Need access to admin features? Contact your administrator to request
            an admin role for your account.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
