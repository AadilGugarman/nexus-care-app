"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  MapPin,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Route,
  ArrowLeft,
  GripVertical,
  Trash2,
  Pencil,
  UserPlus,
  X,
  RotateCcw,
  Check,
  Circle,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStore,
  getRouteStatusInfo,
  getDoctorsInRoute,
  getRoutesForLocation,
  getDoctorVisitInfo,
  getVisitStatusLabel,
} from "@/lib/store";
import type { Doctor, Route as RouteType } from "@/lib/types";
import { RouteBottomSheet } from "@/components/route-bottom-sheet";
import { RouteDoctorPicker } from "@/components/route-doctor-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function RouteStatusBadge({
  info,
}: {
  info: ReturnType<typeof getRouteStatusInfo>;
}) {
  if (info.status === "active") return null;
  const config = {
    completed: {
      icon: CheckCircle2,
      label: `${info.daysRemaining}d left`,
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    },
    due: {
      icon: Clock,
      label: "Due today",
      cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    },
    overdue: {
      icon: AlertCircle,
      label: `Overdue ${Math.abs(info.daysRemaining)}d`,
      cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    },
  }[info.status];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
        config.cls,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

const RouteListItem = memo(function RouteListItem({
  route,
  onClick,
  onComplete,
  onRename,
  onDelete,
  onAddDoctors,
}: {
  route: RouteType;
  onClick: () => void;
  onComplete: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddDoctors: () => void;
}) {
  const info = getRouteStatusInfo(route);
  const doctorCount = route.doctorIds.length;
  const isCompleted = info.status !== "active";

  return (
    <div
      className={cn(
        "card-clean overflow-hidden",
        isCompleted && "border-emerald-200 dark:border-emerald-500/30",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div
          className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
            isCompleted
              ? "bg-emerald-100 dark:bg-emerald-500/20"
              : "bg-indigo-100 dark:bg-indigo-500/20",
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Route className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 dark:text-slate-50 truncate text-sm">
            {route.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
            {doctorCount} doctor{doctorCount === 1 ? "" : "s"}
            {info.completedDate && (
              <span className="ml-1.5">
                · Done {info.completedDate.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <RouteStatusBadge info={info} />
        <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
      </button>

      <div className="grid grid-cols-4 border-t border-slate-200 dark:border-slate-700">
        <ActionButton
          icon={
            isCompleted ? (
              <RotateCcw className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )
          }
          label={isCompleted ? "Reopen" : "Complete"}
          onClick={onComplete}
          variant={isCompleted ? "neutral" : "success"}
        />
        <ActionButton
          icon={<UserPlus className="h-3.5 w-3.5" />}
          label="Add Doctors"
          onClick={onAddDoctors}
          variant="primary"
          borderLeft
        />
        <ActionButton
          icon={<Pencil className="h-3.5 w-3.5" />}
          label="Rename"
          onClick={onRename}
          variant="neutral"
          borderLeft
        />
        <ActionButton
          icon={<Trash2 className="h-3.5 w-3.5" />}
          label="Delete Route"
          onClick={onDelete}
          variant="danger"
          borderLeft
        />
      </div>
    </div>
  );
});

function ActionButton({
  icon,
  label,
  onClick,
  variant,
  borderLeft,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: "success" | "primary" | "neutral" | "danger";
  borderLeft?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors",
        borderLeft && "border-l border-slate-200 dark:border-slate-700",
        variant === "success" &&
          "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
        variant === "primary" &&
          "text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10",
        variant === "neutral" &&
          "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40",
        variant === "danger" &&
          "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10",
      )}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

const SortableRouteListItem = memo(function SortableRouteListItem(props: {
  route: RouteType;
  onClick: () => void;
  onComplete: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddDoctors: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.route.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "z-50")}
    >
      <div
        className={cn(
          isDragging && "shadow-xl scale-[1.01] opacity-95 rounded-xl",
        )}
      >
        <div className="flex items-stretch">
          <button
            type="button"
            {...listeners}
            {...attributes}
            className="px-1.5 flex items-center justify-center text-slate-400 dark:text-slate-500 touch-none cursor-grab active:cursor-grabbing shrink-0"
            aria-label="Drag to reorder route"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <RouteListItem {...props} />
          </div>
        </div>
      </div>
    </div>
  );
});

const SortableRouteDoctorItem = memo(function SortableRouteDoctorItem({
  doctor,
  index,
  isRouteCompleted,
  isReorderMode,
  onRemove,
}: {
  doctor: Doctor;
  index: number;
  isRouteCompleted: boolean;
  isReorderMode: boolean;
  onRemove: () => void;
}) {
  const { markDoctorVisited, resetDoctorVisit } = useStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: doctor.id,
    disabled: !isReorderMode,
  });
  const visitInfo = getDoctorVisitInfo(doctor);
  const isVisited = visitInfo.isVisited;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function toggleVisited() {
    if (isReorderMode) return; // Disable in reorder mode
    try {
      if (isVisited) {
        await resetDoctorVisit(doctor.id);
        toast.success("Visit reset");
      } else {
        await markDoctorVisited(doctor.id);
        toast.success("Visit marked");
      }
    } catch (error) {
      // Error toast already shown by store
    }
  }

  // Format last visit date
  function formatLastVisit(): string {
    if (!visitInfo.lastVisitDate) return "";

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const visitDate = visitInfo.lastVisitDate;
    const isToday = visitDate.toDateString() === today.toDateString();
    const isYesterday = visitDate.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return visitDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Format due status
  function formatDueStatus(): string {
    if (!isVisited) return "";

    const daysUntil = visitInfo.daysUntilDue ?? 0;

    if (daysUntil < 0) {
      return `● Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"}`;
    }

    return `● Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
  }

  const lastVisitText = formatLastVisit();
  const dueStatusText = formatDueStatus();
  const hasVisitInfo = isVisited && (lastVisitText || dueStatusText);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/60 last:border-0 transition-colors",
        isDragging &&
          "shadow-xl z-50 opacity-95 rounded-lg border-2 border-indigo-400 dark:border-indigo-500 scale-[1.01]",
        isRouteCompleted && "bg-slate-50 dark:bg-slate-800/40",
        isReorderMode && !isDragging && "bg-indigo-50/30 dark:bg-indigo-500/5",
        hasVisitInfo ? "py-2.5" : "py-2",
      )}
    >
      {/* Drag Handle - Only visible in reorder mode */}
      {isReorderMode && (
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="p-1 -ml-1 text-indigo-600 dark:text-indigo-400 cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}

      <div className="h-6 w-6 shrink-0 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
        {index + 1}
      </div>

      {/* Visit Toggle Button - Hidden in reorder mode */}
      {!isReorderMode && (
        <button
          type="button"
          onClick={toggleVisited}
          className={cn(
            "h-8 w-8 rounded-md flex items-center justify-center shrink-0 transition-colors",
            isVisited
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
              : "text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
          )}
          aria-label={isVisited ? "Reset visit" : "Mark visited"}
        >
          {isVisited ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "font-bold text-sm text-slate-900 dark:text-slate-50 truncate min-w-0",
            isRouteCompleted && "line-through text-slate-500",
          )}
        >
          {doctor.doctorName}
        </div>

        {/* Visit Information - Only show if visited */}
        {!isReorderMode && hasVisitInfo && (
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>Last Visit: {lastVisitText}</span>
            <span>•</span>
            <span
              className={cn(
                visitInfo.status === "overdue" &&
                  "text-rose-600 dark:text-rose-400",
                visitInfo.status === "due-today" &&
                  "text-amber-600 dark:text-amber-400",
                visitInfo.status === "due-soon" &&
                  "text-amber-600 dark:text-amber-400",
              )}
            >
              {dueStatusText}
            </span>
          </div>
        )}

        {/* Reorder Mode Hint */}
        {isReorderMode && (
          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            Drag to reorder
          </div>
        )}
      </div>

      {/* Remove Button - Hidden in reorder mode */}
      {!isReorderMode && (
        <button
          type="button"
          onClick={onRemove}
          className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
          aria-label="Remove from route"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
});

function RoutesImpl() {
  const {
    state,
    createRoute,
    updateRoute,
    deleteRoute,
    reorderRoutes,
    removeDoctorFromRoute,
    reorderDoctorsInRoute,
    completeRoute,
    uncompleteRoute,
  } = useStore();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteType | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRouteId, setPickerRouteId] = useState<string | null>(null);
  const [deleteRouteId, setDeleteRouteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);

  const locationsWithRoutes = useMemo(() => {
    const locs = new Set(state.routes.map((r) => r.location));
    return Array.from(locs).sort((a, b) => a.localeCompare(b));
  }, [state.routes]);

  const allLocations = useMemo(() => {
    return Array.from(new Set(state.doctors.map((d) => d.location))).sort(
      (a, b) => a.localeCompare(b),
    );
  }, [state.doctors]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const openPicker = useCallback((routeId: string) => {
    setPickerRouteId(routeId);
    setPickerOpen(true);
  }, []);

  const openRouteSheet = useCallback(() => {
    setEditingRoute(null);
    setFormOpen(true);
  }, []);

  const toggleReorderMode = useCallback(() => {
    setIsReorderMode((prev) => !prev);
  }, []);

  const handleDeleteRoute = async () => {
    if (!deleteRouteId) return;

    setIsDeleting(true);
    try {
      await deleteRoute(deleteRouteId);
      toast.success("Route deleted");
      setDeleteRouteId(null);
    } catch (error) {
      // Error toast already shown by store
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    (
      window as typeof window & { __openRouteSheet?: () => void }
    ).__openRouteSheet = openRouteSheet;

    return () => {
      delete (window as typeof window & { __openRouteSheet?: () => void })
        .__openRouteSheet;
    };
  }, [openRouteSheet]);

  if (selectedRoute) {
    const routeId = selectedRoute;
    const route = state.routes.find((r) => r.id === routeId);
    if (!route) {
      setSelectedRoute(null);
      return null;
    }
    const doctors = getDoctorsInRoute(state, routeId);
    const info = getRouteStatusInfo(route);
    const isRouteCompleted = info.status !== "active";

    const handleDoctorDragEnd = async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = doctors.findIndex((d) => d.id === active.id);
      const newIndex = doctors.findIndex((d) => d.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(doctors, oldIndex, newIndex).map((d) => d.id);
      try {
        await reorderDoctorsInRoute(routeId, reordered);
      } catch (error) {
        // Error toast already shown by store
      }
    };

    return (
      <div
        className="flex min-h-0 flex-col"
        style={{ height: "calc(100dvh - 13rem)" }}
      >
        {/* Fixed Header */}
        <div className="shrink-0 space-y-3 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedRoute(null);
                setIsReorderMode(false);
              }}
              className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
              aria-label="Back to routes"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 truncate">
                {route.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {route.location}
              </p>
            </div>
          </div>

          {/* Reorder Mode Banner */}
          {isReorderMode && (
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-lg px-3 py-2.5 flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                Drag doctors to change their order
              </p>
            </div>
          )}

          {/* Doctors Header with Reorder Button */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Doctors ({doctors.length})
            </h2>
            {doctors.length > 1 && (
              <button
                type="button"
                onClick={toggleReorderMode}
                className={cn(
                  "h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all shrink-0",
                  isReorderMode
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
                )}
                aria-label={
                  isReorderMode ? "Exit reorder mode" : "Enter reorder mode"
                }
              >
                {isReorderMode ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Done
                  </>
                ) : (
                  <>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    Reorder
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Doctor List */}
        <div className="min-h-0 flex-1 -mx-4">
          <div
            className="card-clean h-full overflow-y-auto overscroll-contain mx-4"
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            {doctors.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500 dark:text-slate-400">
                No doctors in this route yet.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDoctorDragEnd}
              >
                <SortableContext
                  items={doctors.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div>
                    {doctors.map((d, idx) => (
                      <SortableRouteDoctorItem
                        key={d.id}
                        doctor={d}
                        index={idx}
                        isRouteCompleted={isRouteCompleted}
                        isReorderMode={isReorderMode}
                        onRemove={async () => {
                          try {
                            await removeDoctorFromRoute(routeId, d.id);
                            toast.success("Doctor removed from route");
                          } catch (error) {
                            // Error toast already shown by store
                          }
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        <RouteBottomSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          initialName={editingRoute?.name}
          initialLocation={editingRoute?.location}
          locations={allLocations}
          getDoctorCount={(location) =>
            state.doctors.filter((doctor) => doctor.location === location)
              .length
          }
          onSubmit={async (data) => {
            try {
              await updateRoute(editingRoute!.id, { name: data.name });
              toast.success("Route updated");
            } catch (error) {
              // Error toast already shown by store
            }
          }}
        />

        {pickerRouteId && (
          <RouteDoctorPicker
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            routeId={pickerRouteId}
          />
        )}
      </div>
    );
  }

  if (selectedLocation) {
    const loc = selectedLocation;
    const routes = getRoutesForLocation(state, loc);

    const handleRouteDragEnd = async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = routes.findIndex((r) => r.id === active.id);
      const newIndex = routes.findIndex((r) => r.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(routes, oldIndex, newIndex).map((r) => r.id);
      try {
        await reorderRoutes(loc, reordered);
      } catch (error) {
        // Error toast already shown by store
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedLocation(null)}
            className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
            aria-label="Back to all locations"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {selectedLocation}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {routes.length} routes
            </p>
          </div>
        </div>

        <Button
          onClick={openRouteSheet}
          className="w-full h-11 justify-start text-sm rounded-lg gap-2 font-bold bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Create New Route
        </Button>

        <p className="text-xs text-slate-500 dark:text-slate-400 px-1 flex items-center gap-1.5 font-semibold">
          <GripVertical className="h-3.5 w-3.5" />
          Drag the handle to reorder routes
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleRouteDragEnd}
        >
          <SortableContext
            items={routes.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {routes.map((route) => (
                <SortableRouteListItem
                  key={route.id}
                  route={route}
                  onClick={() => setSelectedRoute(route.id)}
                  onComplete={async () => {
                    const info = getRouteStatusInfo(route);
                    try {
                      if (info.status === "active") {
                        await completeRoute(route.id);
                        toast.success("Route completed");
                      } else {
                        await uncompleteRoute(route.id);
                        toast.success("Route reopened");
                      }
                    } catch (error) {
                      // Error toast already shown by store
                    }
                  }}
                  onRename={() => {
                    setEditingRoute(route);
                    setFormOpen(true);
                  }}
                  onDelete={() => setDeleteRouteId(route.id)}
                  onAddDoctors={() => openPicker(route.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <RouteBottomSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          initialName={editingRoute?.name}
          initialLocation={editingRoute?.location ?? selectedLocation}
          locations={allLocations}
          getDoctorCount={(location) =>
            state.doctors.filter((doctor) => doctor.location === location)
              .length
          }
          onSubmit={async (data) => {
            try {
              if (editingRoute) {
                await updateRoute(editingRoute.id, { name: data.name });
                toast.success("Route updated");
              } else {
                await createRoute(data.location, data.name);
                toast.success("Route created");
              }
            } catch (error) {
              // Error toast already shown by store
            }
          }}
        />

        {pickerRouteId && (
          <RouteDoctorPicker
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            routeId={pickerRouteId}
          />
        )}

        {/* Delete Route Confirmation Dialog */}
        <Dialog
          open={!!deleteRouteId}
          onOpenChange={(open) => !open && setDeleteRouteId(null)}
        >
          <DialogContent className="max-w-sm p-6">
            <div className="space-y-5">
              <div className="text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  Delete Route?
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-900 dark:text-slate-50">
                    {state.routes.find((r) => r.id === deleteRouteId)?.name}
                  </span>{" "}
                  will be permanently deleted.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDeleteRoute}
                  disabled={isDeleting}
                  className="w-full h-11 rounded-lg text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Route"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteRouteId(null)}
                  disabled={isDeleting}
                  className="w-full h-11 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
          Routes
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
          Manage your visit routes by location
        </p>
      </div>

      <Button
        onClick={openRouteSheet}
        className="w-full h-11 justify-start text-sm rounded-lg gap-2 font-bold bg-indigo-600 hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" />
        Create New Route
      </Button>

      {locationsWithRoutes.length === 0 ? (
        <div className="card-clean py-12 text-center text-sm text-slate-500 dark:text-slate-400 px-6">
          <Route className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          No routes yet. Create your first route to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {locationsWithRoutes.map((loc) => {
            const locRoutes = getRoutesForLocation(state, loc);
            const totalDoctors = locRoutes.reduce(
              (s, r) => s + r.doctorIds.length,
              0,
            );
            return (
              <button
                key={loc}
                type="button"
                onClick={() => setSelectedLocation(loc)}
                className="w-full card-clean px-3 py-3 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-50 truncate text-sm">
                    {loc}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                    {locRoutes.length} route{locRoutes.length === 1 ? "" : "s"}{" "}
                    · {totalDoctors} doctors
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            );
          })}
        </div>
      )}

      <RouteBottomSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        initialName={editingRoute?.name}
        initialLocation={editingRoute?.location}
        locations={allLocations}
        getDoctorCount={(location) =>
          state.doctors.filter((doctor) => doctor.location === location).length
        }
        onSubmit={async (data) => {
          try {
            if (editingRoute) {
              await updateRoute(editingRoute.id, { name: data.name });
            } else {
              await createRoute(data.location, data.name);
            }
          } catch (error) {
            console.error("Failed to save route:", error);
          }
        }}
      />
    </div>
  );
}

export const Routes = memo(RoutesImpl);
