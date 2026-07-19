'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

// ============================================================================
// Types
// ============================================================================

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = 'admin' | 'mr' | 'public';

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    loading: true,
    error: null,
  });

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Keep loading=true until profile loads
        setState((prev) => ({
          ...prev,
          user: session.user,
          session,
          loading: true,
        }));

        // Load profile, this will set loading=false when done
        await loadProfile(session.user.id);
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          role: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Load initial session
   */
  async function loadSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        // Keep loading=true, let loadProfile set it to false
        setState({
          user: session.user,
          session,
          profile: null,
          role: null,
          loading: true,
          error: null,
        });
        
        // Load profile, this will set loading=false when done
        await loadProfile(session.user.id);
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          role: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load session',
      }));
    }
  }

  /**
   * Load user profile from database
   */
  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Type assertion needed because RLS is disabled in Phase 1
      const profile = data as Profile | null;
      const role = (profile?.role as UserRole) || 'mr';

      // Set loading=false AFTER profile and role are set
      setState((prev) => ({
        ...prev,
        profile,
        role,
        loading: false,
        error: null,
      }));
    } catch (error) {
      // Even on error, set loading=false with default role
      setState((prev) => ({
        ...prev,
        profile: null,
        role: 'mr', // Default to MR if profile load fails
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load profile',
      }));
    }
  }

  /**
   * Sign in with email and password
   */
  async function signIn(email: string, password: string) {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Set user and session, keep loading=true
        setState((prev) => ({
          ...prev,
          user: data.user,
          session: data.session,
          loading: true,
        }));
        
        // Load profile, this will set loading=false when done
        await loadProfile(data.user.id);
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to sign in',
      }));
      throw error;
    }
  }

  /**
   * Sign out
   */
  async function signOut() {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setState({
        user: null,
        session: null,
        profile: null,
        role: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to sign out',
      }));
      throw error;
    }
  }

  /**
   * Refresh profile data
   */
  async function refreshProfile() {
    if (state.user) {
      await loadProfile(state.user.id);
    }
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access auth context
 * 
 * @example
 * const { user, profile, role, signIn, signOut } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// Optional: Hook for auth state only (without methods)
// ============================================================================

/**
 * Hook to access auth state only (lighter version)
 * 
 * @example
 * const { user, role, loading } = useAuthState();
 */
export function useAuthState() {
  const { user, session, profile, role, loading, error } = useAuth();
  return { user, session, profile, role, loading, error };
}
