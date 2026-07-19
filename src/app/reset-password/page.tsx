'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Lock, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

type PageState = 'loading' | 'form' | 'success' | 'error';

function ResetPasswordForm() {
  const router = useRouter();
  
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'expired' | 'invalid' | 'network' | 'general'>('general');

  // Validate recovery session on mount
  useEffect(() => {
    async function checkRecoverySession() {
      try {
        // Check if we have a valid session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setErrorType('invalid');
          setError('Invalid or expired reset link. Please request a new one.');
          setPageState('error');
          return;
        }

        // Check if this is a recovery session
        if (!session) {
          setErrorType('expired');
          setError('No active reset session found. Please request a new password reset link.');
          setPageState('error');
          return;
        }

        // Valid session found
        setPageState('form');
      } catch (err) {
        console.error('Recovery session check error:', err);
        setErrorType('network');
        setError('Failed to validate reset link. Please try again.');
        setPageState('error');
      }
    }

    checkRecoverySession();
  }, []);

  // Password strength calculation
  function getPasswordStrength(pass: string): { score: number; label: string; color: string } {
    if (!pass) return { score: 0, label: '', color: '' };

    let score = 0;
    
    // Length check
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    
    // Character variety
    if (/[a-z]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;

    // Map score to strength
    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-yellow-500' };
    return { score: 3, label: 'Strong', color: 'bg-green-500' };
  }

  const passwordStrength = getPasswordStrength(password);

  // Validation
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = isPasswordValid && doPasswordsMatch && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      // Update password using Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        if (updateError.message.includes('weak')) {
          throw new Error('Password is too weak. Please choose a stronger password.');
        }
        throw updateError;
      }

      // Success!
      setPageState('success');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.replace('/login');
      }, 3000);

    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
      setLoading(false);
    }
  }

  async function requestNewLink() {
    router.push('/forgot-password');
  }

  // Loading State
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md p-8 shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {errorType === 'expired' ? 'Link Expired' : 'Invalid Link'}
          </h2>
          <p className="text-slate-400 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={requestNewLink}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Request New Reset Link
            </Button>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md p-8 shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Password Reset Successfully
          </h2>
          <p className="text-slate-400 mb-6">
            Your password has been updated. Redirecting to login...
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Redirecting in 3 seconds</span>
          </div>
        </div>
      </div>
    );
  }

  // Form State
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Reset Password
          </h1>
          <p className="text-slate-400">
            Enter your new password
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <Label htmlFor="password" className="text-slate-300">
              New Password
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                disabled={loading}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="text-xs text-slate-400">
                  Password strength: <span className={`font-semibold ${
                    passwordStrength.score === 1 ? 'text-red-400' :
                    passwordStrength.score === 2 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>{passwordStrength.label}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.score
                          ? passwordStrength.color
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <ul className="mt-2 space-y-1">
                  <li className={`text-xs flex items-center gap-2 ${
                    password.length >= 8 ? 'text-green-400' : 'text-slate-400'
                  }`}>
                    <ShieldCheck className={`w-3 h-3 ${
                      password.length >= 8 ? '' : 'opacity-30'
                    }`} />
                    At least 8 characters
                  </li>
                  <li className={`text-xs flex items-center gap-2 ${
                    /[A-Z]/.test(password) ? 'text-green-400' : 'text-slate-400'
                  }`}>
                    <ShieldCheck className={`w-3 h-3 ${
                      /[A-Z]/.test(password) ? '' : 'opacity-30'
                    }`} />
                    Contains uppercase letter
                  </li>
                  <li className={`text-xs flex items-center gap-2 ${
                    /[0-9]/.test(password) ? 'text-green-400' : 'text-slate-400'
                  }`}>
                    <ShieldCheck className={`w-3 h-3 ${
                      /[0-9]/.test(password) ? '' : 'opacity-30'
                    }`} />
                    Contains number
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword" className="text-slate-300">
              Confirm Password
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className="mt-2">
                {doPasswordsMatch ? (
                  <div className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Passwords match
                  </div>
                ) : (
                  <div className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Passwords do not match
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetting Password...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Reset Password
              </>
            )}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-slate-400 hover:text-slate-300 inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
