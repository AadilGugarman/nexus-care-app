// Optimized Memoized Components
// These components are wrapped with React.memo to prevent unnecessary re-renders

import { memo, type ReactNode } from 'react';

// ============================================================================
// CARD COMPONENTS
// ============================================================================

/**
 * Memoized Card component
 * Re-renders only when props change
 */
export const Card = memo(function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      {children}
    </div>
  );
});

/**
 * Memoized Stat Card component
 * Used in dashboards for displaying metrics
 */
export const StatCard = memo(function StatCard({
  label,
  value,
  icon: Icon,
  color = 'blue',
  className = '',
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  className?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// EMPTY STATE COMPONENTS
// ============================================================================

/**
 * Memoized Empty State component
 */
export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
});

// ============================================================================
// LOADING COMPONENTS
// ============================================================================

/**
 * Memoized Loading Spinner
 */
export const LoadingSpinner = memo(function LoadingSpinner({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
});

/**
 * Memoized Loading State
 */
export const LoadingState = memo(function LoadingState({
  message = 'Loading...',
  className = '',
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center p-12 ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="text-indigo-600 mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );
});

// ============================================================================
// BADGE COMPONENTS
// ============================================================================

/**
 * Memoized Badge component
 */
export const Badge = memo(function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
});

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

/**
 * Memoized Skeleton loader
 */
export const Skeleton = memo(function Skeleton({
  className = '',
  width = 'w-full',
  height = 'h-4',
}: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${width} ${height} ${className}`}
    />
  );
});

/**
 * Memoized Card Skeleton
 */
export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-3">
        <Skeleton height="h-4" width="w-3/4" />
        <Skeleton height="h-8" width="w-1/2" />
        <Skeleton height="h-4" width="w-full" />
      </div>
    </Card>
  );
});

// ============================================================================
// ERROR COMPONENTS
// ============================================================================

/**
 * Memoized Error State component
 */
export const ErrorState = memo(function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading data.',
  retry,
  className = '',
}: {
  title?: string;
  message?: string;
  retry?: () => void;
  className?: string;
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-4">
        {message}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
});
