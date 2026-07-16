'use client';

import { CalendarDays, MapPin, Phone, Route as RouteIcon, Stethoscope, GraduationCap, Building2, Home, Timer, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useStore, getDoctorDays, getDoctorRouteNames, getDoctorVisitInfo, formatShortDate, getVisitStatusLabel } from '@/lib/store';
import type { Doctor } from '@/lib/types';
import { DAY_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DoctorDetailsDialogProps {
  doctor: Doctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DoctorDetailsDialog({ doctor, open, onOpenChange }: DoctorDetailsDialogProps) {
  const { state, markDoctorVisited, resetDoctorVisit } = useStore();

  if (!doctor) return null;

  const currentDoctor = state.doctors.find((item) => item.id === doctor.id) ?? doctor;
  const assignedDays = getDoctorDays(state, currentDoctor.id).map((day) => DAY_LABELS[day]);
  const assignedRoutes = getDoctorRouteNames(state, currentDoctor.id);
  const visitInfo = getDoctorVisitInfo(currentDoctor);
  const statusClass = visitInfo.status === 'overdue'
    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
    : visitInfo.status === 'due-soon' || visitInfo.status === 'due-today'
      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
      : visitInfo.status === 'never-visited'
        ? 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30';

  const rows = [
    { label: 'Location', value: currentDoctor.location, icon: MapPin },
    { label: 'Address', value: currentDoctor.address || '—', icon: Home },
    { label: 'Speciality', value: currentDoctor.speciality || '—', icon: Stethoscope },
    { label: 'Qualification', value: currentDoctor.qualification || '—', icon: GraduationCap },
    { label: 'Hospital', value: currentDoctor.hospital || '—', icon: Building2 },
    { label: 'Mobile', value: currentDoctor.mobile || '—', icon: Phone },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <DialogTitle>{currentDoctor.doctorName}</DialogTitle>
          <DialogDescription>Doctor profile and visit planning details</DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4 overflow-y-auto min-h-0 space-y-4">
          <div className={cn('rounded-lg border px-3 py-3', statusClass)}>
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Visit Tracking</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <div>
                <div className="opacity-70">Last Visit</div>
                <div className="font-bold">{formatShortDate(visitInfo.lastVisitDate)}</div>
              </div>
              <div>
                <div className="opacity-70">Next Due</div>
                <div className="font-bold">{formatShortDate(visitInfo.nextDueDate)}</div>
              </div>
              <div>
                <div className="opacity-70">Frequency</div>
                <div className="font-bold">{visitInfo.frequencyDays} Days</div>
              </div>
              <div>
                <div className="opacity-70">Days Since Visit</div>
                <div className="font-bold">{visitInfo.daysSinceLastVisit ?? '—'}</div>
              </div>
            </div>
            <div className="mt-2 text-sm font-bold">{getVisitStatusLabel(visitInfo)}</div>
          </div>

          <div className="space-y-2">
            {rows.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 bg-white dark:bg-slate-800">
                <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {label}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-50 break-words">
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-3 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Assigned Days
              </div>
            </div>
            {assignedDays.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {assignedDays.map((day) => (
                  <span key={day} className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                    {day}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Not assigned</div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-3 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <RouteIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Assigned Routes
              </div>
            </div>
            {assignedRoutes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {assignedRoutes.map((route) => (
                  <span key={route} className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    {route}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Not assigned</div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 safe-bottom shrink-0 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => markDoctorVisited(currentDoctor.id)}
              className="h-11 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all inline-flex items-center justify-center gap-1"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Visited
            </button>
            <button
              type="button"
              onClick={() => resetDoctorVisit(currentDoctor.id)}
              className="h-11 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
              Reset Visit
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
