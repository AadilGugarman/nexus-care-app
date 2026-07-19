/**
 * Authentication Service Layer
 * 
 * Provides high-level authentication operations including
 * sign up, sign in, sign out, and password management.
 */

import { supabase } from '@/lib/supabase/client';
import { getAuthErrorMessage } from './auth-helpers';

// ============================================================================
// Types
// ============================================================================

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  role?: 'admin' | 'mr' | 'public';
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
}

// ============================================================================
// Sign Up
// ============================================================================

/**
 * Sign up a new user
 * Creates user in auth.users and profile in profiles table (via trigger)
 * 
 * @example
 * const result = await AuthService.signUp({
 *   email: 'user@example.com',
 *   password: 'password123',
 *   fullName: 'John Doe',
 *   role: 'mr'
 * });
 */
export class AuthService {
  static async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      const { email, password, fullName, role } = data;

      // Sign up with Supabase Auth
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role || 'mr',
          },
        },
      });

      if (error) throw error;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // IMPORTANT: Create profile manually since we can't use database triggers
      // This ensures the profile exists even without database trigger permissions
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email || email,
            full_name: fullName || null,
            role: role || 'mr',
          } as any); // Type assertion needed due to RLS being disabled

        // If profile creation fails due to "already exists", that's OK
        if (profileError && !profileError.message.includes('duplicate key')) {
          console.warn('Profile creation warning:', profileError);
        }
      } catch (profileErr) {
        // Log but don't fail signup if profile creation has issues
        console.warn('Profile creation error (non-fatal):', profileErr);
      }

      return {
        success: true,
        userId: authData.user.id,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }
  }

  // ============================================================================
  // Sign In
  // ============================================================================

  /**
   * Sign in with email and password
   * 
   * @example
   * const result = await AuthService.signIn({
   *   email: 'user@example.com',
   *   password: 'password123'
   * });
   */
  static async signIn(data: SignInData): Promise<AuthResult> {
    try {
      const { email, password } = data;

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!authData.user) {
        throw new Error('Sign in failed');
      }

      return {
        success: true,
        userId: authData.user.id,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }
  }

  // ============================================================================
  // Sign Out
  // ============================================================================

  /**
   * Sign out current user
   * 
   * @example
   * await AuthService.signOut();
   */
  static async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }
  }

  // ============================================================================
  // Password Reset
  // ============================================================================

  /**
   * Send password reset email
   * 
   * @example
   * await AuthService.resetPassword('user@example.com');
   */
  static async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }
  }

  /**
   * Update password (for logged in user)
   * 
   * @example
   * await AuthService.updatePassword('newPassword123');
   */
  static async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Password update error:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }
  }

  // ============================================================================
  // Email Verification
  // ============================================================================

  /**
   * Resend verification email
   * 
   * @example
   * await AuthService.resendVerificationEmail('user@example.com');
   */
  static async resendVerificationEmail(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Refresh current session
   * 
   * @example
   * await AuthService.refreshSession();
   */
  static async refreshSession(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.refreshSession();

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Session refresh error:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }
  }

  /**
   * Get current session
   */
  static async getSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  static async getUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }
}
