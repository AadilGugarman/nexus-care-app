'use client';

import { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftActions?: { label: string; icon: React.ReactNode; onClick: () => void; variant: 'primary' | 'success' | 'danger' | 'warning' }[];
  rightActions?: { label: string; icon: React.ReactNode; onClick: () => void; variant: 'primary' | 'success' | 'danger' | 'warning' }[];
  className?: string;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-indigo-500 hover:bg-indigo-600',
  success: 'bg-emerald-500 hover:bg-emerald-600',
  danger: 'bg-rose-500 hover:bg-rose-600',
  warning: 'bg-amber-500 hover:bg-amber-600',
};

export function SwipeableCard({
  children,
  leftActions,
  rightActions,
  className,
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [isOpen, setIsOpen] = useState<'left' | 'right' | null>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  const THRESHOLD = 60;
  const MAX_OFFSET = 140;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.touches[0].clientX;
    const delta = currentX.current - startX.current;
    if (Math.abs(delta) > 8) {
      const clamped = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, delta));
      setOffset(clamped);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    const delta = currentX.current - startX.current;
    if (delta < -THRESHOLD && leftActions && leftActions.length > 0) {
      setOffset(-100);
      setIsOpen('left');
    } else if (delta > THRESHOLD && rightActions && rightActions.length > 0) {
      setOffset(100);
      setIsOpen('right');
    } else {
      setOffset(0);
      setIsOpen(null);
    }
  }, [leftActions, rightActions]);

  const handleAction = useCallback(
    (action: () => void) => {
      action();
      setOffset(0);
      setIsOpen(null);
    },
    [],
  );

  const handleCardClick = useCallback(() => {
    if (isOpen) {
      setOffset(0);
      setIsOpen(null);
    }
  }, [isOpen]);

  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        {/* Left side actions (shown when swiping left) */}
        <div className="flex-1 flex items-stretch justify-start">
          {leftActions?.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAction(action.onClick)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 text-white text-[10px] font-medium transition-colors min-w-[72px]',
                variantClasses[action.variant],
              )}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        {/* Right side actions (shown when swiping right) */}
        <div className="flex-1 flex items-stretch justify-end">
          {rightActions?.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAction(action.onClick)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 text-white text-[10px] font-medium transition-colors min-w-[72px]',
                variantClasses[action.variant],
              )}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Foreground card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
        }}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  );
}
