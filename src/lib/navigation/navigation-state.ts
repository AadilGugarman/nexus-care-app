/**
 * Navigation State Persistence
 * 
 * Manages navigation state across sessions to provide seamless restoration.
 * Features:
 * - Restores last visited page after browser close/refresh
 * - Preserves UI state (location, search, filters, scroll)
 * - Returns to last page after session expiration and re-login
 * - Clears state on manual logout
 */

const STORAGE_KEY = 'mr-navigation-state';
const EXPIRY_HOURS = 24; // Clear old state after 24 hours

export interface NavigationState {
  lastPath: string;
  timestamp: number;
  uiState?: {
    selectedLocation?: string;
    searchQuery?: string;
    filters?: Record<string, any>;
    scrollPosition?: number;
    expandedSections?: string[];
    selectedTab?: string;
  };
}

export class NavigationStateManager {
  /**
   * Save current navigation state
   */
  static saveState(path: string, uiState?: NavigationState['uiState']): void {
    try {
      // Don't save auth pages or special pages
      if (this.shouldNotPersist(path)) {
        return;
      }

      const state: NavigationState = {
        lastPath: path,
        timestamp: Date.now(),
        uiState,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (error) {
      console.error('[NavigationState] Failed to save state:', error);
    }
  }

  /**
   * Get saved navigation state
   */
  static getState(): NavigationState | null {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const state: NavigationState = JSON.parse(stored);

      // Check if state is expired
      const hoursOld = (Date.now() - state.timestamp) / (1000 * 60 * 60);
      if (hoursOld > EXPIRY_HOURS) {
        this.clearState();
        return null;
      }

      // Don't restore auth pages or special pages
      if (this.shouldNotPersist(state.lastPath)) {
        return null;
      }

      return state;
    } catch (error) {
      console.error('[NavigationState] Failed to get state:', error);
      return null;
    }
  }

  /**
   * Clear saved navigation state
   */
  static clearState(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('[NavigationState] Failed to clear state:', error);
    }
  }

  /**
   * Save return URL for post-login redirect
   */
  static saveReturnUrl(url: string): void {
    try {
      if (this.shouldNotPersist(url)) {
        return;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('return-url', url);
      }
    } catch (error) {
      console.error('[NavigationState] Failed to save return URL:', error);
    }
  }

  /**
   * Get and clear return URL
   */
  static getAndClearReturnUrl(): string | null {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      const url = sessionStorage.getItem('return-url');
      if (url) {
        sessionStorage.removeItem('return-url');
        return url;
      }
      return null;
    } catch (error) {
      console.error('[NavigationState] Failed to get return URL:', error);
      return null;
    }
  }

  /**
   * Update UI state without changing path
   */
  static updateUIState(uiState: Partial<NavigationState['uiState']>): void {
    try {
      const current = this.getState();
      if (current) {
        this.saveState(current.lastPath, {
          ...current.uiState,
          ...uiState,
        });
      }
    } catch (error) {
      console.error('[NavigationState] Failed to update UI state:', error);
    }
  }

  /**
   * Check if path should not be persisted
   */
  private static shouldNotPersist(path: string): boolean {
    const noPersistPaths = [
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/access-denied',
      '/verify-migration',
      '/test-',
    ];

    return noPersistPaths.some((p) => path.startsWith(p));
  }

  /**
   * Get default path for role
   */
  static getDefaultPath(role: string | null): string {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'mr':
        return '/';
      default:
        return '/';
    }
  }

  /**
   * Get restoration path with fallback
   */
  static getRestorationPath(role: string | null): string {
    // First try return URL (for post-login restore)
    const returnUrl = this.getAndClearReturnUrl();
    if (returnUrl) {
      return returnUrl;
    }

    // Then try last visited path
    const state = this.getState();
    if (state?.lastPath) {
      // Validate path is appropriate for role
      if (this.isPathValidForRole(state.lastPath, role)) {
        return state.lastPath;
      }
    }

    // Fallback to default path
    return this.getDefaultPath(role);
  }

  /**
   * Check if path is valid for user role
   */
  private static isPathValidForRole(path: string, role: string | null): boolean {
    // Admin paths only for admin
    if (path.startsWith('/admin')) {
      return role === 'admin';
    }

    // All other paths accessible by MR and public
    return true;
  }

  /**
   * Handle page refresh
   */
  static handleRefresh(currentPath: string): void {
    // On refresh, update timestamp to keep state fresh
    const state = this.getState();
    if (state) {
      this.saveState(currentPath, state.uiState);
    }
  }
}
