'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore, getRouteStatusInfo, getDoctorsInRoute, getRoutesForLocation, getDoctorVisitInfo, getVisitStatusLabel } from '@/lib/store';
import type { Doctor, Route as RouteType } from '@/lib/types';
import { RouteBottomSheet } from '@/components/route-bottom-sheet';
import { RouteDoctorPicker } from '@/components/route-doctor-picker';
import { Button } from '@/components/ui/button';

function RouteStatusBadge({ info }: { info: ReturnType<typeof getRouteStatusInfo> }) {
  if (info.status === 'active') return null;
  const config = {
    completed: {
      icon: CheckCircle2,
      label: `${info.daysRemaining}d left`,
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    },
    due: {
      icon: Clock,
      label: 'Due today',
      cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    },
    overdue: {
      icon: AlertCircle,
      label: `Overdue ${Math.abs(info.daysRemaining)}d`,
      cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    },
  }[info.status];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border', config.cls)}>
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
  const isCompleted = info.status !== 'active';

  return (
    <div
      className={cn(
        'card-clean overflow-hidden',
        isCompleted && 'border-emerald-200 dark:border-emerald-500/30',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div
          className={cn(
            'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
            isCompleted
              ? 'bg-emerald-100 dark:bg-emerald-500/20'
              : 'bg-indigo-100 dark:bg-indigo-500/20',
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
            {doctorCount} doctor{doctorCount === 1 ? '' : 's'}
            {info.completedDate && (
              <span className="ml-1.5">· Done {info.completedDate.toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <RouteStatusBadge info={info} />
        <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
      </button>

      <div className="grid grid-cols-3 border-t border-slate-200 dark:border-slate-700">
        <ActionButton
          icon={isCompleted ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
          label={isCompleted ? 'Reopen' : 'Complete'}
          onClick={onComplete}
          variant={isCompleted ? 'neutral' : 'success'}
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
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-t border-slate-200 dark:border-slate-700 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete Route
      </button>
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
  variant: 'success' | 'primary' | 'neutral';
  borderLeft?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors',
        borderLeft && 'border-l border-slate-200 dark:border-slate-700',
        variant === 'success' && 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        variant === 'primary' && 'text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
        variant === 'neutral' && 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40',
      )}
    >
      {icon}
      {label}
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
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
      className={cn('relative', isDragging && 'z-50')}
    >
      <div className={cn(isDragging && 'shadow-xl scale-[1.01] opacity-95 rounded-xl')}>
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
  onRemove,
}: {
  doctor: Doctor;
  index: number;
  isRouteCompleted: boolean;
  onRemove: () => void;
}) {
  const { markDoctorVisited, resetDoctorVisit } = useStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: doctor.id,
  });
  const visitInfo = getDoctorVisitInfo(doctor);
  const isVisited = visitInfo.isVisited;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function toggleVisited() {
    try {
      if (isVisited) {
        await resetDoctorVisit(doctor.id);
        toast.success('Visit reset');
      } else {
        await markDoctorVisited(doctor.id);
        toast.success('Visit marked');
      }
    } catch (error) {
      // Error toast already shown by store
    }
  }

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
      <button
        type="button"
        onClick={toggleVisited}
        className={cn(
          'h-8 w-8 rounded-md flex items-center justify-center shrink-0 transition-colors',
          isVisited
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
            : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        )}
        aria-label={isVisited ? 'Reset visit' : 'Mark visited'}
      >
        {isVisited ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={cn(
          'font-bold text-sm text-slate-900 dark:text-slate-50 truncate min-w-0',
          isRouteCompleted && 'line-through text-slate-500',
        )}>
          {doctor.doctorName}
        </div>
        <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
          {isVisited ? '✓ Visited' : '○ Not Visited'} · {getVisitStatusLabel(visitInfo)}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
        aria-label="Remove from route"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});

function RoutesImpl() {
  const { state, createRoute, updateRoute, deleteRoute, reorderRoutes, removeDoctorFromRoute, reorderDoctorsInRoute, completeRoute, uncompleteRoute } = useStore();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteType | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRouteId, setPickerRouteId] = useState<string | null>(null);

  const locationsWithRoutes = useMemo(() => {
    const locs = new Set(state.routes.map((r) => r.location));
    return Array.from(locs).sort((a, b) => a.localeCompare(b));
  }, [state.routes]);

  const allLocations = useMemo(() => {
    return Array.from(new Set(state.doctors.map((d) => d.location))).sort((a, b) => a.localeCompare(b));
  }, [state.doctors]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const openPicker = useCallback((routeId: string) => {
    setPickerRouteId(routeId);
    setPickerOpen(true);
  }, []);

  const openRouteSheet = useCallback(() => {
    setEditingRoute(null);
    setFormOpen(true);
  }, []);

  useEffect(() => {
    (window as typeof window & { __openRouteSheet?: () => void }).__openRouteSheet =
      openRouteSheet;

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
    const isRouteCompleted = info.status !== 'active';

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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedRoute(null)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 truncate">{route.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{route.location}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Doctors ({doctors.length})
            </h2>
          </div>
          <div className="card-clean overflow-hidden">
            {doctors.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                No doctors in this route yet.
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDoctorDragEnd}>
                <SortableContext items={doctors.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                  <div>
                    {doctors.map((d, idx) => (
                      <SortableRouteDoctorItem
                        key={d.id}
                        doctor={d}
                        index={idx}
                        isRouteCompleted={isRouteCompleted}
                        onRemove={async () => {
                          try {
                            await removeDoctorFromRoute(routeId, d.id);
                            toast.success('Doctor removed from route');
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

        <Button
          onClick={async () => {
            try {
              await deleteRoute(routeId);
              toast.success('Route deleted');
            } catch (error) {
              // Error toast already shown by store
            }
          }}
          variant="outline"
          className="w-full h-11 text-sm rounded-lg gap-1.5 font-bold border-2 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
        >
          <Trash2 className="h-4 w-4" />
          Delete Route
        </Button>

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
              await updateRoute(editingRoute!.id, { name: data.name });
              toast.success('Route updated');
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
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">{selectedLocation}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{routes.length} routes</p>
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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRouteDragEnd}>
          <SortableContext items={routes.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {routes.map((route) => (
                <SortableRouteListItem
                  key={route.id}
                  route={route}
                  onClick={() => setSelectedRoute(route.id)}
                  onComplete={async () => {
                    const info = getRouteStatusInfo(route);
                    try {
                      if (info.status === 'active') {
                        await completeRoute(route.id);
                        toast.success('Route completed');
                      } else {
                        await uncompleteRoute(route.id);
                        toast.success('Route reopened');
                      }
                    } catch (error) {
                      // Error toast already shown by store
                    }
                  }}
                  onRename={() => {
                    setEditingRoute(route);
                    setFormOpen(true);
                  }}
                  onDelete={async () => {
                    try {
                      await deleteRoute(route.id);
                      toast.success('Route deleted');
                    } catch (error) {
                      // Error toast already shown by store
                    }
                  }}
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
            state.doctors.filter((doctor) => doctor.location === location).length
          }
          onSubmit={async (data) => {
            try {
              if (editingRoute) {
                await updateRoute(editingRoute.id, { name: data.name });
                toast.success('Route updated');
              } else {
                await createRoute(data.location, data.name);
                toast.success('Route created');
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
            const totalDoctors = locRoutes.reduce((s, r) => s + r.doctorIds.length, 0);
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
                  <div className="font-bold text-slate-900 dark:text-slate-50 truncate text-sm">{loc}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                    {locRoutes.length} route{locRoutes.length === 1 ? '' : 's'} · {totalDoctors} doctors
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
            console.error('Failed to save route:', error);
          }
        }}
      />
    </div>
  );
}

export const Routes = memo(RoutesImpl);
