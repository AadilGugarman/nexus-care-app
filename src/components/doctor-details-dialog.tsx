'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Phone, Route as RouteIcon, Stethoscope, GraduationCap, Building2, Home, Timer, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useStore, getDoctorDays, getDoctorRouteNames, getDoctorVisitInfo, formatShortDate, getVisitStatusLabel } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import type { Doctor } from '@/lib/types';
import { DAY_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DoctorDetailsDialogProps {
  doctor: Doctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PendingRequest {
  id: number;
  type: 'creation' | 'change' | 'status';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  change_reason?: string;
  reason?: string;
}

export function DoctorDetailsDialog({ doctor, open, onOpenChange }: DoctorDetailsDialogProps) {
  const { state, markDoctorVisited, resetDoctorVisit } = useStore();
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Fetch pending requests for this doctor by current user
  useEffect(() => {
    if (!doctor || !user || !open) {
      setPendingRequests([]);
      return;
    }

    async function fetchPendingRequests() {
      if (!doctor || !user) return; // Additional null check for TypeScript
      
      try {
        setLoadingRequests(true);

        // Query all three request types
        const [changeRequests, statusRequests] = await Promise.all([
          (supabase as any)
            .from('doctor_change_requests')
            .select('id, status, created_at, change_reason')
            .eq('doctor_id', doctor.id)
            .eq('requested_by', user.id)
            .in('status', ['pending', 'approved', 'rejected'])
            .order('created_at', { ascending: false })
            .limit(5),
          (supabase as any)
            .from('doctor_status_requests')
            .select('id, status, created_at, reason, request_type')
            .eq('doctor_id', doctor.id)
            .eq('requested_by', user.id)
            .in('status', ['pending', 'approved', 'rejected'])
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        const requests: PendingRequest[] = [];

        if (changeRequests.data) {
          requests.push(
            ...changeRequests.data.map((r: any) => ({
              id: r.id,
              type: 'change' as const,
              status: r.status,
              created_at: r.created_at,
              change_reason: r.change_reason,
            }))
          );
        }

        if (statusRequests.data) {
          requests.push(
            ...statusRequests.data.map((r: any) => ({
              id: r.id,
              type: 'status' as const,
              status: r.status,
              created_at: r.created_at,
              reason: r.reason,
            }))
          );
        }

        // Sort by date
        requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setPendingRequests(requests);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    }

    fetchPendingRequests();
  }, [doctor, user, open]);

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

          {/* Pending Requests Section - Only for logged in users */}
          {user && pendingRequests.length > 0 && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-700 px-3 py-3 bg-blue-50 dark:bg-blue-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  Your Pending Requests
                </div>
              </div>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={`${request.type}-${request.id}`}
                    className="flex items-start gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-2 bg-white dark:bg-slate-800"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-50">
                          {request.type === 'change' && 'Edit Request'}
                          {request.type === 'status' && 'Status Change Request'}
                        </span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold',
                            request.status === 'pending' && 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
                            request.status === 'approved' && 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                            request.status === 'rejected' && 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                          )}
                        >
                          {request.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {new Date(request.created_at).toLocaleDateString()} at{' '}
                        {new Date(request.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    {request.status === 'pending' && (
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    )}
                    {request.status === 'approved' && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
