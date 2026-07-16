'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Check } from 'lucide-react';
import type { DayKey } from '@/lib/types';
import { DAYS, DAY_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DayAssignmentDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  doctorName: string;
  selectedDays: DayKey[];
  visitFrequencyDays: number;
  onSave: (days: DayKey[], visitFrequencyDays: number) => void;
}

export function DayAssignmentDialog({
  open,
  onOpenChange,
  doctorName,
  selectedDays,
  visitFrequencyDays,
  onSave,
}: DayAssignmentDialogProps) {
  const [pending, setPending] = useState<Set<DayKey>>(new Set());
  const [frequency, setFrequency] = useState(30);

  useEffect(() => {
    if (open) {
      setPending(new Set(selectedDays));
      setFrequency(Number.isFinite(visitFrequencyDays) && visitFrequencyDays > 0 ? visitFrequencyDays : 30);
    }
  }, [open, selectedDays, visitFrequencyDays]);

  const fullLabels: Record<DayKey, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
  };

  const fullDays: { key: DayKey; label: string; short: string }[] = DAYS.map((d) => ({
    key: d,
    label: fullLabels[d],
    short: DAY_LABELS[d],
  }));

  function toggle(day: DayKey) {
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function handleSave() {
    const normalizedFrequency = Number.isFinite(frequency) && frequency > 0 ? Math.round(frequency) : 30;
    onSave(DAYS.filter((d) => pending.has(d)), normalizedFrequency);
    onOpenChange(false);
  }

  function handleCancel() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
          <DialogTitle>Assign Days</DialogTitle>
          <DialogDescription>{doctorName}</DialogDescription>
        </DialogHeader>

        <div className="px-5 py-5 bg-white dark:bg-slate-900 overflow-y-auto min-h-0">
          <div className="space-y-2">
            {fullDays.map(({ key, label, short }) => {
              const isSelected = pending.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all text-left',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
                  )}
                >
                  <div
                    className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
                    )}
                  >
                    {short.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div
                      className={cn(
                        'font-bold text-sm',
                        isSelected
                          ? 'text-indigo-900 dark:text-indigo-200'
                          : 'text-slate-900 dark:text-slate-100',
                      )}
                    >
                      {label}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-slate-300 dark:border-slate-600',
                    )}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
            <div>
              <Label htmlFor="visit-frequency">Visit Frequency</Label>
              <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Used for doctor visit due tracking.
              </p>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[15, 30, 45, 60, 90].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFrequency(value)}
                  className={cn(
                    'h-9 rounded-lg border text-xs font-bold transition-colors',
                    frequency === value
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            <Input
              id="visit-frequency"
              type="number"
              inputMode="numeric"
              min={1}
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value) || 30)}
              placeholder="Custom"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 safe-bottom shrink-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{pending.size}</span> selected
            </div>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleCancel}
              className="h-11 px-4 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-11 px-5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:scale-95 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
