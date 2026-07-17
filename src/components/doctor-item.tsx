'use client';

import { Pencil, Calendar, Trash2, GripVertical, Check, CheckCircle2, Circle, Edit3, PowerOff } from 'lucide-react';
import type { Doctor, DayKey } from '@/lib/types';
import { DAY_LABELS } from '@/lib/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { getDoctorVisitInfo, useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';

interface DoctorItemProps {
  doctor: Doctor;
  assignedDays: DayKey[];
  onOpenDayModal: () => void;
  onEdit: () => void;
  onOpenDetails?: () => void;
  onDelete?: () => void;
  onSuggestEdit?: () => void;
  onRequestInactive?: () => void;
  index?: number;
  isRouteCompleted?: boolean;
}

export function DoctorItem({
  doctor,
  assignedDays,
  onOpenDayModal,
  onEdit,
  onOpenDetails,
  onDelete,
  onSuggestEdit,
  onRequestInactive,
  index,
  isRouteCompleted,
}: DoctorItemProps) {
  const { markDoctorVisited, resetDoctorVisit } = useStore();
  const { role } = useAuth();
  const visitInfo = getDoctorVisitInfo(doctor);
  const isVisited = visitInfo.isVisited;

  const isAdmin = role === 'admin';
  const isMR = role === 'mr';

  async function toggleVisited() {
    try {
      if (isVisited) await resetDoctorVisit(doctor.id);
      else await markDoctorVisited(doctor.id);
    } catch (error) {
      console.error('Failed to toggle visit:', error);
    }
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-2 px-3 py-2 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/60 last:border-0',
        isRouteCompleted && 'bg-slate-50 dark:bg-slate-800/40',
      )}
    >
      {typeof index === 'number' && (
        <div className="mt-0.5 h-6 w-6 shrink-0 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
          {index + 1}
        </div>
      )}
      <button
        type="button"
        onClick={onOpenDetails}
        className="flex-1 min-w-0 text-left disabled:cursor-default"
        disabled={!onOpenDetails}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            'font-bold text-sm text-slate-900 dark:text-slate-50 truncate min-w-0',
            isRouteCompleted && 'line-through text-slate-500',
          )}>
            {doctor.doctorName}
          </div>
          {doctor.speciality && (
            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20">
              {doctor.speciality}
            </span>
          )}
          {isRouteCompleted && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
        </div>

        {assignedDays.length > 0 && (
          <div className="flex items-center gap-[3px] mt-1 flex-nowrap overflow-hidden whitespace-nowrap">
            {assignedDays.map((d) => (
              <span
                key={d}
                className="h-4 leading-4 text-[8px] font-bold px-1 rounded uppercase tracking-tight shrink-0 bg-indigo-600 text-white"
              >
                {DAY_LABELS[d].slice(0, 3)}
              </span>
            ))}
          </div>
        )}
      </button>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={toggleVisited}
          className={cn(
            'h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
            isVisited
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400',
          )}
          aria-label={isVisited ? 'Reset visit' : 'Mark visited'}
          title={isVisited ? 'Visited - tap to reset' : 'Mark Visited'}
        >
          {isVisited ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onOpenDayModal}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          aria-label="Assign days"
          title="Assign days"
        >
          <Calendar className="h-4 w-4" />
        </button>
        
        {/* Admin: Direct Edit */}
        {isAdmin && (
          <button
            type="button"
            onClick={onEdit}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Edit doctor"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        
        {/* MR: Suggest Edit */}
        {isMR && onSuggestEdit && (
          <button
            type="button"
            onClick={onSuggestEdit}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            aria-label="Suggest edit"
            title="Suggest Edit"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        )}
        
        {/* Public: Basic Edit (opens request form) */}
        {!isAdmin && !isMR && (
          <button
            type="button"
            onClick={onEdit}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Suggest changes"
            title="Suggest Changes"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        
        {/* Admin: Direct Delete */}
        {isAdmin && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            aria-label="Delete doctor"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        
        {/* MR: Request Inactive */}
        {isMR && onRequestInactive && (
          <button
            type="button"
            onClick={onRequestInactive}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            aria-label="Request inactive"
            title="Request Inactive"
          >
            <PowerOff className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface SortableDoctorItemProps {
  doctor: Doctor;
  index: number;
  isRouteCompleted?: boolean;
  onRemove?: () => void;
}

export function SortableDoctorItem({ doctor, index, isRouteCompleted, onRemove }: SortableDoctorItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: doctor.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/60 last:border-0 dnd-item touch-none',
        isDragging && 'shadow-xl z-50 opacity-95 rounded-lg border-2 border-indigo-400 dark:border-indigo-500 scale-[1.01]',
        isRouteCompleted && 'bg-slate-50 dark:bg-slate-800/40',
      )}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="p-1 -ml-1 text-slate-400 dark:text-slate-500 touch-none cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="h-6 w-6 shrink-0 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className={cn(
          'font-bold text-sm text-slate-900 dark:text-slate-50 truncate min-w-0',
          isRouteCompleted && 'line-through text-slate-500',
        )}>
          {doctor.doctorName}
        </div>
        {doctor.speciality && (
          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20">
            {doctor.speciality}
          </span>
        )}
        {isRouteCompleted && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
          aria-label="Remove from route"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
