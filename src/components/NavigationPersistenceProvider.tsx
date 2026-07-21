'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { NavigationStateManager } from '@/lib/navigation';

/**
 * Navigation Persistence Provider
 * 
 * Automatically tracks and persists navigation state across the entire app.
 * Add this component once in the root layout to enable navigation persistence.
 * 
 * Features:
 * - Tracks current path on every navigation
 * - Saves UI state when available
 * - Handles page refresh
 * - Works silently in the background
 */
function NavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      // Build full URL with search params if they exist
      const search = searchParams?.toString();
      const fullPath = search ? `${pathname}?${search}` : pathname;
      
      // Save current navigation state
      NavigationStateManager.saveState(fullPath);

      // Handle refresh/beforeunload
      const handleBeforeUnload = () => {
        NavigationStateManager.handleRefresh(fullPath);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [pathname, searchParams]);

  return null;
}

export function NavigationPersistenceProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationTracker />
      </Suspense>
      {children}
    </>
  );
}
