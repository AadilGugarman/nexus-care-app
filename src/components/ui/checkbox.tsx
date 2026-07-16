'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          'h-6 w-6 shrink-0 rounded-md border-2 transition-all flex items-center justify-center',
          checked
            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 border-transparent shadow-md shadow-indigo-500/30'
            : 'border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60',
          className,
        )}
      >
        {checked && <Check className="h-4 w-4 text-white stroke-[3]" />}
        <input ref={ref} type="checkbox" className="sr-only" checked={checked} readOnly {...props} />
      </button>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
