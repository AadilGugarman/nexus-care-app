// Supabase Client (No Authentication Mode)
// This client is configured for single-user mode without authentication

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!', {
    url: supabaseUrl ? 'SET' : 'MISSING',
    key: supabaseAnonKey ? 'SET' : 'MISSING'
  });
  throw new Error('Missing Supabase environment variables. Check .env.local file.');
}

console.log('Supabase client initialized:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Enable session persistence for auth
    autoRefreshToken: true, // Auto-refresh tokens
    detectSessionInUrl: true, // Detect session from URL (for magic links, etc.)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// ============================================================================
// DEFAULT USER for single-user mode (no authentication)
// ============================================================================
// This UUID corresponds to the default user created in the database
// When authentication is added later, replace this with auth.uid()

export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current user ID
 * Returns authenticated user ID if logged in, otherwise falls back to DEFAULT_USER_ID
 * This maintains backward compatibility with single-user mode
 * 
 * @returns User ID (authenticated user or default)
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    // Return authenticated user ID or fallback to default for backward compatibility
    return user?.id || DEFAULT_USER_ID;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return DEFAULT_USER_ID;
  }
}

/**
 * Require authentication
 * Returns user ID (authenticated or default)
 * 
 * Phase 1: Returns user ID with DEFAULT_USER_ID fallback (maintains current behavior)
 * Phase 3: Will throw error if not authenticated (when route protection is added)
 * 
 * @returns User ID
 */
export async function requireAuth(): Promise<string> {
  return getCurrentUserId();
}

/**
 * Check if user is authenticated via Supabase Auth
 * Returns false if using DEFAULT_USER_ID (single-user mode)
 * 
 * @returns true if real user is authenticated, false if using default user
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user; // Returns true only if real user exists
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}
