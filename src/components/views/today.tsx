'use client';

import { memo, useMemo, useState } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Route as RouteIcon,
  CalendarDays,
  UserX,
} from 'lucide-react';
import {
  useStore,
  getRouteStatusInfo,
  getDoctorsForLocationDay,
  getVisitDashboardStats,
  getDoctorVisitInfo,
  formatShortDate,
  getVisitStatusLabel,
} from '@/lib/store';
import type { Route as RouteType, DayKey, Doctor, DoctorVisitInfo } from '@/lib/types';
import { DAY_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getTodayKey } from '@/lib/utils';
import { DoctorDetailsDialog } from '@/components/doctor-details-dialog';

function VisitDoctorCard({ doctor, info, onOpenProfile }: { doctor: Doctor; info: DoctorVisitInfo; onOpenProfile: () => void }) {
  const statusClass = info.status === 'overdue'
    ? 'border-rose-200 dark:border-rose-500/30'
    : info.status === 'due-today' || info.status === 'due-soon'
      ? 'border-amber-200 dark:border-amber-500/30'
      : 'border-emerald-200 dark:border-emerald-500/30';
  const textClass = info.status === 'overdue'
    ? 'text-rose-700 dark:text-rose-300'
    : info.status === 'due-today' || info.status === 'due-soon'
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-emerald-700 dark:text-emerald-300';

  return (
    <button
      type="button"
      onClick={onOpenProfile}
      className={cn('card-clean w-full px-3 py-3 border text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors', statusClass)}
    >
      <div className="font-bold text-sm text-slate-900 dark:text-slate-50 truncate">{doctor.doctorName}</div>
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{doctor.location}</div>
      {doctor.speciality && (
        <div className="mt-1 inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20">
          {doctor.speciality}
        </div>
      )}
      <div className={cn('mt-1 text-xs font-bold', textClass)}>{getVisitStatusLabel(info)}</div>
      <div className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        Last Visit: {formatShortDate(info.lastVisitDate)} · Next Due: {formatShortDate(info.nextDueDate)}
      </div>
    </button>
  );
}

function VisitSection({
  title,
  icon,
  items,
  emptyText,
  onOpenProfile,
}: {
  title: string;
  icon: React.ReactNode;
  items: { doctor: Doctor; info: DoctorVisitInfo }[];
  emptyText: string;
  onOpenProfile: (doctor: Doctor) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        {icon}
        <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{title}</h2>
        <span className="ml-auto text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="card-clean px-3 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 12).map(({ doctor, info }) => (
            <VisitDoctorCard
              key={doctor.id}
              doctor={doctor}
              info={info}
              onOpenProfile={() => onOpenProfile(doctor)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TodayViewImpl() {
  const { state } = useStore();
  const [profileDoctor, setProfileDoctor] = useState<Doctor | null>(null);
  const today = getTodayKey();
  const isSunday = today === 'sunday';
  const todayKey = isSunday ? null : (today as DayKey);

  const todayByLocation = useMemo(() => {
    if (!todayKey) return [];
    const map = new Map<string, ReturnType<typeof getDoctorsForLocationDay>>();
    for (const d of state.doctors) {
      if ((state.assignments[d.id] ?? []).includes(todayKey)) {
        if (!map.has(d.location)) {
          map.set(d.location, getDoctorsForLocationDay(state, d.location, todayKey));
        }
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([location, doctors]) => ({
        location,
        doctors: doctors.filter((d) => (state.assignments[d.id] ?? []).includes(todayKey)),
      }));
  }, [state, todayKey]);

  const routeStatus = useMemo(() => {
    const routesWithInfo: { route: RouteType; info: ReturnType<typeof getRouteStatusInfo> }[] = state.routes.map((route) => ({
      route,
      info: getRouteStatusInfo(route),
    }));

    return {
      dueToday: routesWithInfo
        .filter((r) => r.info.status === 'due')
        .sort((a, b) => a.route.location.localeCompare(b.route.location)),
      overdue: routesWithInfo
        .filter((r) => r.info.status === 'overdue')
        .sort((a, b) => a.info.daysRemaining - b.info.daysRemaining),
      upcoming: routesWithInfo
        .filter((r) => r.info.status === 'completed' && r.info.daysRemaining > 0)
        .sort((a, b) => a.info.daysRemaining - b.info.daysRemaining),
    };
  }, [state.routes]);

  const visitStats = useMemo(() => getVisitDashboardStats(state), [state]);
  const totalDoctors = todayByLocation.reduce((s, l) => s + l.doctors.length, 0);
  const upcomingDoctors = visitStats.upcoming.slice(0, 10);

  return (
    <div className="space-y-5 pb-2">
      <div className="card-clean p-4 bg-indigo-600 border-indigo-600 text-white">
        <div className="flex items-center gap-2 text-indigo-100 text-xs font-bold uppercase tracking-wider">
          <CalendarDays className="h-3.5 w-3.5" />
          Today
        </div>
        <h1 className="text-2xl font-bold mt-0.5">{isSunday ? 'Sunday' : DAY_LABELS[todayKey!]}</h1>
        <p className="text-indigo-100 text-sm mt-0.5 font-semibold">
          {totalDoctors} assigned doctors · {visitStats.dueToday.length} due today · {visitStats.overdue.length} overdue
        </p>
      </div>

      <VisitSection
        title="Due Today Doctors"
        icon={<Clock className="h-4 w-4 text-amber-500" />}
        items={visitStats.dueToday}
        emptyText="No doctors due today."
        onOpenProfile={setProfileDoctor}
      />

      <VisitSection
        title="Overdue Doctors"
        icon={<AlertCircle className="h-4 w-4 text-rose-500" />}
        items={visitStats.overdue}
        emptyText="No overdue doctors."
        onOpenProfile={setProfileDoctor}
      />

      <VisitSection
        title="Upcoming Doctors"
        icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        items={upcomingDoctors}
        emptyText="No upcoming doctor visits yet."
        onOpenProfile={setProfileDoctor}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <CalendarDays className="h-4 w-4 text-indigo-500" />
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Today's Assigned Doctors
          </h2>
          <span className="ml-auto text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
            {totalDoctors}
          </span>
        </div>
        {isSunday ? (
          <div className="card-clean py-8 text-center text-sm text-slate-500 dark:text-slate-400 px-6">
            Sunday — no day assignment schedule.
          </div>
        ) : totalDoctors === 0 ? (
          <div className="card-clean py-8 text-center text-sm text-slate-500 dark:text-slate-400 px-6">
            <UserX className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            No doctors assigned to {DAY_LABELS[todayKey!]}.
          </div>
        ) : (
          <div className="space-y-2">
            {todayByLocation.map(({ location, doctors }) => (
              <div key={location} className="card-clean overflow-hidden">
                <div className="px-3 py-2.5 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="h-7 w-7 rounded-md bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                    <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">{location}</div>
                  <span className="ml-auto text-xs font-bold text-slate-500 dark:text-slate-400">
                    {doctors.length}
                  </span>
                </div>
                <div>
                  {doctors.map((d, idx) => {
                    const info = getDoctorVisitInfo(d);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setProfileDoctor(d)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 dark:border-slate-700/40 last:border-0 bg-white dark:bg-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="h-6 w-6 shrink-0 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 dark:text-slate-50 truncate text-sm">
                            {d.doctorName}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                            Last: {formatShortDate(info.lastVisitDate)} · Next: {formatShortDate(info.nextDueDate)}
                          </div>
                          <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">
                            {getVisitStatusLabel(info)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RouteStatusSections dueToday={routeStatus.dueToday} overdue={routeStatus.overdue} upcoming={routeStatus.upcoming} />
      <DoctorDetailsDialog
        doctor={profileDoctor}
        open={!!profileDoctor}
        onOpenChange={(open) => !open && setProfileDoctor(null)}
      />
    </div>
  );
}

function RouteStatusSections({
  dueToday,
  overdue,
  upcoming,
}: {
  dueToday: { route: RouteType; info: ReturnType<typeof getRouteStatusInfo> }[];
  overdue: { route: RouteType; info: ReturnType<typeof getRouteStatusInfo> }[];
  upcoming: { route: RouteType; info: ReturnType<typeof getRouteStatusInfo> }[];
}) {
  const routeItems = [...overdue, ...dueToday, ...upcoming.slice(0, 6)];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <RouteIcon className="h-4 w-4 text-indigo-500" />
        <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
          Today's Routes
        </h2>
        <span className="ml-auto text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
          {routeItems.length}
        </span>
      </div>
      {routeItems.length === 0 ? (
        <div className="card-clean py-8 text-center text-sm text-slate-500 dark:text-slate-400 px-6">
          No due or upcoming route timers.
        </div>
      ) : (
        <div className="space-y-2">
          {routeItems.map(({ route, info }) => (
            <RouteCard key={route.id} route={route} info={info} />
          ))}
        </div>
      )}
    </div>
  );
}

const RouteCard = memo(function RouteCard({ route, info }: { route: RouteType; info: ReturnType<typeof getRouteStatusInfo> }) {
  return (
    <div className="card-clean px-3 py-3 flex items-center gap-3">
      <div
        className={cn(
          'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
          info.status === 'due' && 'bg-amber-100 dark:bg-amber-500/20',
          info.status === 'overdue' && 'bg-rose-100 dark:bg-rose-500/20',
          info.status === 'completed' && 'bg-emerald-100 dark:bg-emerald-500/20',
        )}
      >
        {info.status === 'due' && <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
        {info.status === 'overdue' && <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
        {info.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-slate-900 dark:text-slate-50 truncate text-sm">{route.name}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 font-semibold">
          <MapPin className="h-3 w-3" />
          {route.location}
          <span className="mx-0.5">·</span>
          {route.doctorIds.length} doctors
        </div>
      </div>
      <div className="text-right shrink-0">
        <div
          className={cn(
            'text-xs font-bold',
            info.status === 'due' && 'text-amber-600 dark:text-amber-400',
            info.status === 'overdue' && 'text-rose-600 dark:text-rose-400',
            info.status === 'completed' && 'text-emerald-600 dark:text-emerald-400',
          )}
        >
          {info.status === 'due' && 'Due today'}
          {info.status === 'overdue' && `Overdue ${Math.abs(info.daysRemaining)}d`}
          {info.status === 'completed' && `${info.daysRemaining}d left`}
        </div>
      </div>
    </div>
  );
});

export const TodayView = memo(TodayViewImpl);
