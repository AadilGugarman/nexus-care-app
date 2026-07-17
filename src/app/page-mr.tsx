// ============================================================================
// Phase 8: MR Dashboard Page
// Full MR operational experience (routes, visits, contributions)
// ============================================================================

'use client';

import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Route, Settings as SettingsIcon } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { Dashboard } from '@/components/views/dashboard';
import { Locations } from '@/components/views/locations';
import { Days } from '@/components/views/days';
import { Routes } from '@/components/views/routes';
import { TodayView } from '@/components/views/today';
import { Settings } from '@/components/views/settings';
import { DoctorManagementDialog } from '@/components/doctor-management-dialog';
import { RouteFormDialog } from '@/components/route-form-dialog';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import type { Doctor, TabKey } from '@/lib/types';

type ActionType = 'add' | 'edit' | 'status' | null;

export function MRDashboard() {
  const { state, addDoctor, updateDoctor, deleteDoctor, createRoute, isLoaded } = useStore();
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);
  const [doctorAction, setDoctorAction] = useState<ActionType>(null);
  const [routeFormOpen, setRouteFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const isAdmin = role === 'admin';

  const locations = useMemo(() => {
    return Array.from(new Set(state.doctors.map((d) => d.location))).sort((a, b) => a.localeCompare(b));
  }, [state.doctors]);

  const handleAddDoctor = useCallback(() => {
    setEditingDoctor(null);
    setDoctorAction('add');
    setDoctorDialogOpen(true);
  }, []);

  const handleEditDoctor = useCallback((d: Doctor) => {
    setEditingDoctor(d);
    setDoctorAction('edit');
    setDoctorDialogOpen(true);
  }, []);

  const handleSuggestEdit = useCallback((d: Doctor) => {
    setEditingDoctor(d);
    setDoctorAction('edit');
    setDoctorDialogOpen(true);
  }, []);

  const handleRequestInactive = useCallback((d: Doctor) => {
    setEditingDoctor(d);
    setDoctorAction('status');
    setDoctorDialogOpen(true);
  }, []);

  async function handleDoctorSubmit(data: {
    doctorName: string;
    location: string;
    address: string;
    speciality: string;
    qualification: string;
    hospital: string;
    mobile: string;
  }) {
    try {
      if (editingDoctor) {
        await updateDoctor(editingDoctor.id, data);
        toast.success('Doctor updated successfully');
      } else {
        await addDoctor(data);
        toast.success('Doctor added successfully');
      }
    } catch (error) {
      // Error toast already shown by store
    }
  }

  async function handleDoctorDelete() {
    if (editingDoctor) {
      try {
        await deleteDoctor(editingDoctor.id);
        toast.success('Doctor deleted successfully');
      } catch (error) {
        // Error toast already shown by store
      }
    }
  }

  function handleExport() {
    const data = {
      doctors: state.doctors,
      deletedDoctorIds: state.deletedDoctorIds,
      assignments: state.assignments,
      routeOrder: state.routeOrder,
      routes: state.routes,
      settings: state.settings,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `mr-route-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const fabConfig = useMemo(() => {
    if (activeTab === 'dashboard' || activeTab === 'settings') return null;
    if (activeTab === 'routes') {
      return {
        icon: <Route className="h-6 w-6" />,
        onClick: () => setRouteFormOpen(true),
        label: 'Create Route',
      };
    }
    return {
      icon: <Plus className="h-6 w-6" />,
      onClick: handleAddDoctor,
      label: 'Add Doctor',
    };
  }, [activeTab, handleAddDoctor]);

  return (
    <main className="min-h-screen relative">
      {!isLoaded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-xl px-4 pt-4 safe-top" style={{ paddingBottom: 120 }}>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className="fixed top-3 right-3 z-30 h-10 w-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          aria-label="Settings"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>

        <div key={activeTab} className="animate-fade-in">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={setActiveTab}
              onAddDoctor={handleAddDoctor}
              onCreateRoute={() => setRouteFormOpen(true)}
              onExport={handleExport}
            />
          )}
          {activeTab === 'locations' && (
            <Locations
              onEditDoctor={handleEditDoctor}
              onSuggestEdit={handleSuggestEdit}
              onRequestInactive={handleRequestInactive}
            />
          )}
          {activeTab === 'days' && (
            <Days
              onEditDoctor={handleEditDoctor}
              onSuggestEdit={handleSuggestEdit}
              onRequestInactive={handleRequestInactive}
            />
          )}
          {activeTab === 'routes' && <Routes />}
          {activeTab === 'today' && <TodayView />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </div>

      {fabConfig && (
        <button
          type="button"
          onClick={fabConfig.onClick}
          className="fixed bottom-[88px] right-4 z-30 h-14 w-14 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center"
          aria-label={fabConfig.label}
        >
          {fabConfig.icon}
        </button>
      )}

      <BottomNav active={activeTab} onChange={setActiveTab} />

      <DoctorManagementDialog
        open={doctorDialogOpen}
        onOpenChange={setDoctorDialogOpen}
        action={doctorAction}
        doctor={editingDoctor}
        locations={locations}
        onDirectAdd={isAdmin ? handleDoctorSubmit : undefined}
        onDirectEdit={isAdmin ? async (id, data) => {
          await updateDoctor(id, data);
          toast.success('Doctor updated');
        } : undefined}
        onDirectDelete={isAdmin && editingDoctor ? handleDoctorDelete : undefined}
      />

      <RouteFormDialog
        open={routeFormOpen}
        onOpenChange={setRouteFormOpen}
        locations={locations}
        onSubmit={async (data) => {
          try {
            await createRoute(data.location, data.name);
            toast.success('Route created successfully');
          } catch (error) {
            // Error toast already shown by store
          }
        }}
      />
    </main>
  );
}
