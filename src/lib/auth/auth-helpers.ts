/**
 * Authentication Helper Functions
 * 
 * These functions provide utilities for authentication, session management,
 * and user profile operations.
 */

import { supabase, DEFAULT_USER_ID } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

// ============================================================================
// Types
// ============================================================================

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = 'admin' | 'mr' | 'public';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile: Profile | null;
}

// ============================================================================
// Session Helpers
// ============================================================================

/**
 * Get current authenticated user
 * Returns null if not authenticated
 * 
 * @example
 * const user = await getCurrentUser();
 * if (user) console.log('Logged in as:', user.email);
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Load profile
    const profile = await getUserProfile(user.id);

    return {
      id: user.id,
      email: user.email || '',
      role: (profile?.role as UserRole) || 'mr',
      profile,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get current user ID
 * Returns DEFAULT_USER_ID as fallback if not authenticated (backward compatibility)
 * 
 * @example
 * const userId = await getCurrentUserId();
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Return authenticated user ID or fallback to default
    return user?.id || DEFAULT_USER_ID;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return DEFAULT_USER_ID;
  }
}

/**
 * Check if user is authenticated
 * 
 * @example
 * if (await isAuthenticated()) {
 *   console.log('User is logged in');
 * }
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Get current session
 * 
 * @example
 * const session = await getCurrentSession();
 * if (session) console.log('Session expires:', session.expires_at);
 */
export async function getCurrentSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// ============================================================================
// Profile Helpers
// ============================================================================

/**
 * Get user profile by ID
 * 
 * @example
 * const profile = await getUserProfile(userId);
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    // Type assertion needed because RLS is disabled in Phase 1
    return data as Profile | null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Get user role
 * Returns 'mr' as default fallback
 * 
 * @example
 * const role = await getUserRole();
 * if (role === 'admin') console.log('Admin access');
 */
export async function getUserRole(userId?: string): Promise<UserRole> {
  try {
    const id = userId || (await getCurrentUserId());
    const profile = await getUserProfile(id);
    return (profile?.role as UserRole) || 'mr';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'mr';
  }
}

/**
 * Check if current user is admin
 * 
 * @example
 * if (await isAdmin()) {
 *   // Show admin features
 * }
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}

/**
 * Update user profile
 * 
 * Note: Currently disabled due to RLS configuration.
 * Will be enabled in Phase 4 when RLS is properly configured.
 * For now, profiles are created automatically via trigger and are read-only.
 * 
 * @example
 * await updateUserProfile(userId, { full_name: 'John Doe' });
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    email?: string;
    full_name?: string | null;
    role?: 'mr' | 'admin' | 'public';
  }
): Promise<Profile | null> {
  console.warn('updateUserProfile is not yet enabled. Will be available in Phase 4.');
  // TODO: Enable in Phase 4 when RLS is configured
  // This function will work once RLS policies allow profile updates
  return null;
}

// ============================================================================
// Authentication Helpers
// ============================================================================

/**
 * Require authentication - throws error if not authenticated
 * Returns user ID
 * Falls back to DEFAULT_USER_ID for backward compatibility
 * 
 * @example
 * const userId = await requireAuth();
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  
  // For now, always return userId (with DEFAULT_USER_ID fallback)
  // In Phase 3, this will throw if not authenticated
  return userId;
}

/**
 * Require specific role - throws error if user doesn't have required role
 * Currently does NOT enforce (for backward compatibility)
 * 
 * @example
 * await requireRole('admin');
 */
export async function requireRole(requiredRole: UserRole): Promise<void> {
  const role = await getUserRole();
  
  // For now, just log (no enforcement yet)
  // In Phase 3, this will throw if role doesn't match
  if (role !== requiredRole) {
    console.warn(`Role check: required ${requiredRole}, got ${role}`);
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if email is valid format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if password meets requirements
 */
export function isValidPassword(password: string): boolean {
  // Minimum 6 characters (Supabase default)
  return password.length >= 6;
}

// ============================================================================
// Error Helpers
// ============================================================================

/**
 * Get user-friendly error message
 */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Map common Supabase errors to friendly messages
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid login credentials')) {
      return 'Invalid email or password';
    }
    if (message.includes('email not confirmed')) {
      return 'Please confirm your email address';
    }
    if (message.includes('user already registered')) {
      return 'Email already registered';
    }
    if (message.includes('invalid email')) {
      return 'Invalid email format';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred';
}
