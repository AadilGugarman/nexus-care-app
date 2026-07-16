'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
