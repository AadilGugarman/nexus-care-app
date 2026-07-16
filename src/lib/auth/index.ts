/**
 * Authentication Module
 * 
 * Central export for all authentication-related functionality
 */

// Context and Hooks
export { AuthProvider, useAuth, useAuthState } from './AuthContext';

// Helper Functions
export {
  getCurrentUser,
  getCurrentUserId,
  isAuthenticated,
  getCurrentSession,
  getUserProfile,
  getUserRole,
  isAdmin,
  updateUserProfile,
  requireAuth,
  requireRole,
  isValidEmail,
  isValidPassword,
  getAuthErrorMessage,
} from './auth-helpers';

// Service Layer
export { AuthService } from './auth-service';

// Types
export type { AuthUser } from './auth-helpers';
export type { SignUpData, SignInData, AuthResult } from './auth-service';
