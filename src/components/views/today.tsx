"use client";

import { memo, useMemo, useState } from "react";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Route as RouteIcon,
  CalendarDays,
  UserX,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  useStore,
  getRouteStatusInfo,
  getDoctorsForLocationDay,
  getVisitDashboardStats,
  getDoctorVisitInfo,
  formatShortDate,
  getVisitStatusLabel,
} from "@/lib/store";
import type {
  Route as RouteType,
  DayKey,
  Doctor,
  DoctorVisitInfo,
} from "@/lib/types";
import { DAY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getTodayKey } from "@/lib/utils";
import { DoctorDetailsDialog } from "@/components/doctor-details-dialog";

function TodayStatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color:
    | "indigo"
    | "violet"
    | "cyan"
    | "amber"
    | "rose"
    | "emerald"
    | "orange"
    | "teal";
}) {
  const colorClasses: Record<string, string> = {
    indigo:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
    violet:
      "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
    cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
    amber:
      "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
    emerald:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    orange:
      "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    teal: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400",
  };
  return (
    <div className="card-clean p-3">
      <div
        className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-slate-50">
        {value}
      </div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
        {label}
      </div>
    </div>
  );
}

function AssignedDoctorCard({
  doctor,
  info,
  index,
  onOpenProfile,
}: {
  doctor: Doctor;
  info: DoctorVisitInfo;
  index: number;
  onOpenProfile: () => void;
}) {
  const statusClass =
    info.status === "overdue"
      ? "border-rose-200 dark:border-rose-500/30"
      : info.status === "due-today" || info.status === "due-soon"
        ? "border-amber-200 dark:border-amber-500/30"
        : "border-emerald-200 dark:border-emerald-500/30";

  return (
    <button
      type="button"
      onClick={onOpenProfile}
      className={cn(
        "card-clean w-full px-3 py-2 border text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors",
        statusClass,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-6 w-6 shrink-0 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center mt-0.5">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-bold text-sm text-slate-900 dark:text-slate-50 truncate flex-1">
              {doctor.doctorName}
            </div>
            {info.isVisited && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
            )}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
            <MapPin className="h-2.5 w-2.5" />
            {doctor.location}
          </div>
          <div className="mt-0.5 space-y-0.5">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Last: {formatShortDate(info.lastVisitDate)}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Next: {formatShortDate(info.nextDueDate)}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function RouteCard({
  route,
  info,
}: {
  route: RouteType;
  info: ReturnType<typeof getRouteStatusInfo>;
}) {
  return (
    <div className="card-clean px-3 py-2 flex items-center gap-3">
      <div
        className={cn(
          "h-7 w-7 rounded-md flex items-center justify-center shrink-0",
          info.status === "due" && "bg-amber-100 dark:bg-amber-500/20",
          info.status === "overdue" && "bg-rose-100 dark:bg-rose-500/20",
          info.status === "completed" &&
            "bg-emerald-100 dark:bg-emerald-500/20",
        )}
      >
        {info.status === "due" && (
          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        )}
        {info.status === "overdue" && (
          <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
        )}
        {info.status === "completed" && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-slate-900 dark:text-slate-50 truncate text-sm">
          {route.name}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-semibold">
          <MapPin className="h-2.5 w-2.5" />
          {route.location}
          <span className="mx-0.5">·</span>
          {route.doctorIds.length} doctors
        </div>
      </div>
      <div className="text-right shrink-0">
        <div
          className={cn(
            "text-[10px] font-bold",
            info.status === "due" && "text-amber-600 dark:text-amber-400",
            info.status === "overdue" && "text-rose-600 dark:text-rose-400",
            info.status === "completed" &&
              "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {info.status === "due" && "Due today"}
          {info.status === "overdue" &&
            `Overdue ${Math.abs(info.daysRemaining)}d`}
          {info.status === "completed" && `${info.daysRemaining}d left`}
        </div>
      </div>
    </div>
  );
}

const INITIAL_DISPLAY_LIMIT = 5;

function TodayViewImpl() {
  const { state } = useStore();
  const [profileDoctor, setProfileDoctor] = useState<Doctor | null>(null);
  const [showAllAssigned, setShowAllAssigned] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllDueToday, setShowAllDueToday] = useState(false);
  const [showAllOverdue, setShowAllOverdue] = useState(false);
  const today = getTodayKey();
  const isSunday = today === "sunday";
  const todayKey = isSunday ? null : (today as DayKey);

  const todayByLocation = useMemo(() => {
    if (!todayKey) return [];
    const map = new Map<string, ReturnType<typeof getDoctorsForLocationDay>>();
    for (const d of state.doctors) {
      if ((state.assignments[d.id] ?? []).includes(todayKey)) {
        if (!map.has(d.location)) {
          map.set(
            d.location,
            getDoctorsForLocationDay(state, d.location, todayKey),
          );
        }
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([location, doctors]) => ({
        location,
        doctors: doctors.filter((d) =>
          (state.assignments[d.id] ?? []).includes(todayKey),
        ),
      }));
  }, [state, todayKey]);

  const allAssignedDoctors = useMemo(() => {
    return todayByLocation.flatMap((loc) =>
      loc.doctors.map((doctor) => ({
        doctor,
        info: getDoctorVisitInfo(doctor),
      })),
    );
  }, [todayByLocation]);

  const routeStatus = useMemo(() => {
    const routesWithInfo: {
      route: RouteType;
      info: ReturnType<typeof getRouteStatusInfo>;
    }[] = state.routes.map((route) => ({
      route,
      info: getRouteStatusInfo(route),
    }));

    return {
      dueToday: routesWithInfo
        .filter((r) => r.info.status === "due")
        .sort((a, b) => a.route.location.localeCompare(b.route.location)),
      overdue: routesWithInfo
        .filter((r) => r.info.status === "overdue")
        .sort((a, b) => a.info.daysRemaining - b.info.daysRemaining),
      upcoming: routesWithInfo
        .filter(
          (r) => r.info.status === "completed" && r.info.daysRemaining > 0,
        )
        .sort((a, b) => a.info.daysRemaining - b.info.daysRemaining),
    };
  }, [state.routes]);

  const visitStats = useMemo(() => getVisitDashboardStats(state), [state]);
  const totalDoctors = todayByLocation.reduce(
    (s, l) => s + l.doctors.length,
    0,
  );

  const displayedAssigned = showAllAssigned
    ? allAssignedDoctors
    : allAssignedDoctors.slice(0, INITIAL_DISPLAY_LIMIT);
  const displayedUpcoming = showAllUpcoming
    ? visitStats.upcoming
    : visitStats.upcoming.slice(0, INITIAL_DISPLAY_LIMIT);
  const displayedDueToday = showAllDueToday
    ? visitStats.dueToday
    : visitStats.dueToday.slice(0, INITIAL_DISPLAY_LIMIT);
  const displayedOverdue = showAllOverdue
    ? visitStats.overdue
    : visitStats.overdue.slice(0, INITIAL_DISPLAY_LIMIT);

  return (
    <div className="space-y-5 pb-2">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
          Today's Work
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
          {isSunday ? "Sunday" : DAY_LABELS[todayKey!]} — here's your plan
        </p>
      </div>

      <div>
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
          Overview
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <TodayStatCard
            label="Assigned Doctors"
            value={totalDoctors}
            icon={<Users className="h-4 w-4" />}
            color="indigo"
          />
          <TodayStatCard
            label="Due Today"
            value={visitStats.dueToday.length}
            icon={<Clock className="h-4 w-4" />}
            color="amber"
          />
          <TodayStatCard
            label="Overdue"
            value={visitStats.overdue.length}
            icon={<AlertCircle className="h-4 w-4" />}
            color="rose"
          />
          <TodayStatCard
            label="Upcoming"
            value={visitStats.upcoming.length}
            icon={<CalendarDays className="h-4 w-4" />}
            color="emerald"
          />
        </div>
      </div>

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
          <div className="card-clean py-4 text-center text-sm text-slate-500 dark:text-slate-400 px-3">
            Sunday — no day assignment schedule.
          </div>
        ) : totalDoctors === 0 ? (
          <div className="card-clean py-4 text-center text-sm text-slate-500 dark:text-slate-400 px-3">
            <UserX className="h-6 w-6 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
            No doctors assigned today.
          </div>
        ) : (
          <div className="space-y-2">
            {displayedAssigned.map(({ doctor, info }, idx) => (
              <AssignedDoctorCard
                key={doctor.id}
                doctor={doctor}
                info={info}
                index={idx}
                onOpenProfile={() => setProfileDoctor(doctor)}
              />
            ))}
            {allAssignedDoctors.length > INITIAL_DISPLAY_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllAssigned(!showAllAssigned)}
                className="w-full card-clean px-3 py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                {showAllAssigned ? "Show Less" : "Show All"} (
                {allAssignedDoctors.length})
                {showAllAssigned ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <RouteIcon className="h-4 w-4 text-indigo-500" />
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Today's Routes
          </h2>
        </div>
        {[
          ...routeStatus.overdue,
          ...routeStatus.dueToday,
          ...routeStatus.upcoming,
        ].length === 0 ? (
          <div className="card-clean py-4 text-center text-sm text-slate-500 dark:text-slate-400 px-3">
            No due or upcoming route timers.
          </div>
        ) : (
          <div className="space-y-2">
            {[
              ...routeStatus.overdue,
              ...routeStatus.dueToday,
              ...routeStatus.upcoming,
            ].map(({ route, info }) => (
              <RouteCard key={route.id} route={route} info={info} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Upcoming Doctors
          </h2>
        </div>
        {visitStats.upcoming.length === 0 ? (
          <div className="card-clean py-4 text-center text-sm text-slate-500 dark:text-slate-400 px-3">
            No upcoming doctor visits yet.
          </div>
        ) : (
          <div className="space-y-2">
            {displayedUpcoming.map(({ doctor, info }) => (
              <button
                key={doctor.id}
                type="button"
                onClick={() => setProfileDoctor(doctor)}
                className="card-clean w-full px-3 py-2 border border-emerald-100 dark:border-emerald-500/20 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-50 truncate flex-1">
                        {doctor.doctorName}
                      </div>
                      {info.isVisited && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {doctor.location}
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Last: {formatShortDate(info.lastVisitDate)}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Next: {formatShortDate(info.nextDueDate)}
                      </div>
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                      {getVisitStatusLabel(info)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {visitStats.upcoming.length > INITIAL_DISPLAY_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                className="w-full card-clean px-3 py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                {showAllUpcoming ? "Show Less" : "Show All"} (
                {visitStats.upcoming.length})
                {showAllUpcoming ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Clock className="h-4 w-4 text-amber-500" />
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Due Today ({visitStats.dueToday.length})
          </h2>
        </div>
        {visitStats.dueToday.length === 0 ? (
          <div className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            No due doctors.
          </div>
        ) : (
          <div className="space-y-2">
            {displayedDueToday.map(({ doctor, info }) => (
              <button
                key={doctor.id}
                type="button"
                onClick={() => setProfileDoctor(doctor)}
                className="card-clean w-full px-3 py-2 border border-amber-200 dark:border-amber-500/30 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-50 truncate flex-1">
                        {doctor.doctorName}
                      </div>
                      {info.isVisited && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {doctor.location}
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Last: {formatShortDate(info.lastVisitDate)}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Next: {formatShortDate(info.nextDueDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {visitStats.dueToday.length > INITIAL_DISPLAY_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllDueToday(!showAllDueToday)}
                className="w-full card-clean px-3 py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                {showAllDueToday ? "Show Less" : "Show All"} (
                {visitStats.dueToday.length})
                {showAllDueToday ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <AlertCircle className="h-4 w-4 text-rose-500" />
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Overdue ({visitStats.overdue.length})
          </h2>
        </div>
        {visitStats.overdue.length === 0 ? (
          <div className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            No overdue doctors.
          </div>
        ) : (
          <div className="space-y-2">
            {displayedOverdue.map(({ doctor, info }) => (
              <button
                key={doctor.id}
                type="button"
                onClick={() => setProfileDoctor(doctor)}
                className="card-clean w-full px-3 py-2 border border-rose-200 dark:border-rose-500/30 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-50 truncate flex-1">
                        {doctor.doctorName}
                      </div>
                      {info.isVisited && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {doctor.location}
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Last: {formatShortDate(info.lastVisitDate)}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Next: {formatShortDate(info.nextDueDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {visitStats.overdue.length > INITIAL_DISPLAY_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllOverdue(!showAllOverdue)}
                className="w-full card-clean px-3 py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                {showAllOverdue ? "Show Less" : "Show All"} (
                {visitStats.overdue.length})
                {showAllOverdue ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <DoctorDetailsDialog
        doctor={profileDoctor}
        open={!!profileDoctor}
        onOpenChange={(open) => !open && setProfileDoctor(null)}
      />
    </div>
  );
}

export const TodayView = memo(TodayViewImpl);