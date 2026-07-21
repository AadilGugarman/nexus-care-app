'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { NavigationStateManager } from './navigation-state';

/**
 * Hook to automatically persist navigation state
 * 
 * Features:
 * - Saves current path on navigation
 * - Updates timestamp on refresh
 * - Handles cleanup
 * 
 * Usage:
 * ```tsx
 * // In any client component or layout
 * useNavigationPersistence();
 * ```
 */
export function useNavigationPersistence() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      // Save current path
      NavigationStateManager.saveState(pathname);

      // Handle refresh (beforeunload)
      const handleBeforeUnload = () => {
        NavigationStateManager.handleRefresh(pathname);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [pathname]);
}
