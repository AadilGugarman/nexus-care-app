'use client';

import { memo, useMemo } from 'react';
import {
  Users,
  MapPin,
  UserX,
  CalendarDays,
  Plus,
  Search,
  Download,
  Route,
  CheckCircle2,
  AlertCircle,
  Clock,
  ListChecks,
} from 'lucide-react';
import { useStore, getAllRouteStats, getVisitDashboardStats } from '@/lib/store';
import { getTodayKey } from '@/lib/utils';
import { DAYS } from '@/lib/types';
import type { TabKey } from '@/lib/types';
import { AuthHeader } from '@/components/auth/AuthHeader';

interface DashboardProps {
  onNavigate: (tab: TabKey) => void;
  onAddDoctor: () => void;
  onCreateRoute: () => void;
  onExport: () => void;
}

function DashboardImpl({ onNavigate, onAddDoctor, onCreateRoute, onExport }: DashboardProps) {
  const { state } = useStore();

  const stats = useMemo(() => {
    const today = getTodayKey();
    const locations = new Set(state.doctors.map((d) => d.location));
    const unassigned = state.doctors.filter((d) => (state.assignments[d.id] ?? []).length === 0).length;
    let todayCount = 0;
    if (DAYS.includes(today as never)) {
      for (const d of state.doctors) {
        if ((state.assignments[d.id] ?? []).includes(today as never)) todayCount++;
      }
    }
    const routeStats = getAllRouteStats(state);
    const visitStats = getVisitDashboardStats(state);
    return {
      total: state.doctors.length,
      locations: locations.size,
      unassigned,
      todayCount,
      routeStats,
      visitStats,
    };
  }, [state]);

  const today = getTodayKey();
  const todayLabel = today.charAt(0).toUpperCase() + today.slice(1);
  const isSunday = today === 'sunday';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
          Welcome back, here's your overview
        </p>
      </div>

      {/* Auth Header */}
      <AuthHeader variant="default" />

      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          Doctor Stats
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Total Doctors"
            value={stats.total}
            icon={<Users className="h-4 w-4" />}
            color="violet"
          />
          <StatCard
            label="Locations"
            value={stats.locations}
            icon={<MapPin className="h-4 w-4" />}
            color="cyan"
          />
          <StatCard
            label="Unassigned"
            value={stats.unassigned}
            icon={<UserX className="h-4 w-4" />}
            color="orange"
          />
          <StatCard
            label={isSunday ? 'Sunday (off)' : `${todayLabel}'s Route`}
            value={isSunday ? '—' : stats.todayCount}
            icon={<CalendarDays className="h-4 w-4" />}
            color="teal"
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          Doctor Visit Tracking
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Due Today Doctors"
            value={stats.visitStats.dueToday.length}
            icon={<Clock className="h-4 w-4" />}
            color="amber"
          />
          <StatCard
            label="Overdue Doctors"
            value={stats.visitStats.overdue.length}
            icon={<AlertCircle className="h-4 w-4" />}
            color="rose"
          />
          <StatCard
            label="Due This Week"
            value={stats.visitStats.dueThisWeek.length}
            icon={<CalendarDays className="h-4 w-4" />}
            color="teal"
          />
          <StatCard
            label="Recently Visited"
            value={stats.visitStats.recentlyVisited.length}
            icon={<CheckCircle2 className="h-4 w-4" />}
            color="emerald"
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          Route Stats
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Total Routes"
            value={stats.routeStats.total}
            icon={<Route className="h-4 w-4" />}
            color="indigo"
          />
          <StatCard
            label="Due Today"
            value={stats.routeStats.dueToday}
            icon={<Clock className="h-4 w-4" />}
            color="amber"
          />
          <StatCard
            label="Overdue"
            value={stats.routeStats.overdue}
            icon={<AlertCircle className="h-4 w-4" />}
            color="rose"
          />
          <StatCard
            label="Upcoming"
            value={stats.routeStats.upcoming}
            icon={<CheckCircle2 className="h-4 w-4" />}
            color="emerald"
          />
        </div>
        {stats.routeStats.recentlyCompleted > 0 && (
          <div className="mt-2 px-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
            <ListChecks className="h-3.5 w-3.5" />
            {stats.routeStats.recentlyCompleted} route{stats.routeStats.recentlyCompleted === 1 ? '' : 's'} completed recently
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          Quick Actions
        </h2>
        <div className="space-y-2">
          <ActionButton
            icon={<Route className="h-4 w-4" />}
            label="Create Route"
            onClick={onCreateRoute}
            variant="primary"
          />
          <ActionButton
            icon={<Plus className="h-4 w-4" />}
            label="Add New Doctor"
            onClick={onAddDoctor}
            variant="primary"
          />
          <ActionButton
            icon={<Search className="h-4 w-4" />}
            label="Browse & Search Doctors"
            onClick={() => onNavigate('locations')}
            variant="secondary"
          />
          <ActionButton
            icon={<CalendarDays className="h-4 w-4" />}
            label="Manage Routes"
            onClick={() => onNavigate('routes')}
            variant="secondary"
          />
          <ActionButton
            icon={<Download className="h-4 w-4" />}
            label="Export Backup"
            onClick={onExport}
            variant="secondary"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'indigo' | 'violet' | 'cyan' | 'amber' | 'rose' | 'emerald' | 'orange' | 'teal';
}) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
    cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    rose: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
    teal: 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
  };
  return (
    <div className="card-clean p-3">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{value}</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">{label}</div>
    </div>
  );
}

const ActionButton = memo(function ActionButton({
  icon,
  label,
  onClick,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === 'primary'
          ? 'w-full h-12 px-4 rounded-lg flex items-center gap-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all'
          : 'w-full h-12 px-4 rounded-lg flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.99] transition-all'
      }
    >
      {icon}
      <span className="text-left flex-1">{label}</span>
    </button>
  );
});

export const Dashboard = memo(DashboardImpl);
