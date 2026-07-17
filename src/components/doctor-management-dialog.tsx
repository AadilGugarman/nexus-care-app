'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { NewDoctorRequestForm, EditDoctorRequestForm, DoctorStatusRequestForm } from '@/components/doctor-requests/DoctorRequestForms';
import { DoctorFormDialog } from '@/components/doctor-form-dialog';
import type { Doctor } from '@/lib/types';
import type { DoctorRow } from '@/lib/supabase/database.types';

type ActionType = 'add' | 'edit' | 'status' | null;

interface DoctorManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ActionType;
  doctor?: Doctor | null;
  defaultLocation?: string;
  locations: string[];
  // Admin direct actions
  onDirectAdd?: (data: any) => Promise<void>;
  onDirectEdit?: (id: number, data: any) => Promise<void>;
  onDirectDelete?: () => Promise<void>;
}

export function DoctorManagementDialog({
  open,
  onOpenChange,
  action,
  doctor,
  defaultLocation,
  locations,
  onDirectAdd,
  onDirectEdit,
  onDirectDelete,
}: DoctorManagementDialogProps) {
  const { user, role } = useAuth();
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const isAdmin = role === 'admin';
  const isMR = role === 'mr';
  const isLoggedIn = !!user;

  // Convert Doctor to DoctorRow for form
  const doctorRow: DoctorRow | undefined = doctor ? {
    id: doctor.id,
    doctor_name: doctor.doctorName,
    location: doctor.location,
    address: doctor.address || null,
    speciality: doctor.speciality || null,
    qualification: doctor.qualification || null,
    hospital: doctor.hospital || null,
    mobile: doctor.mobile || null,
    notes: null,
    is_active: true,
    public_visible: true, // Default to visible
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } : undefined;

  function handleClose() {
    setRequestSubmitted(false);
    onOpenChange(false);
  }

  function handleRequestSuccess() {
    setRequestSubmitted(true);
    setTimeout(() => {
      handleClose();
    }, 2000);
  }

  // Admin: Use direct form
  if (isAdmin && (action === 'add' || action === 'edit')) {
    return (
      <DoctorFormDialog
        open={open}
        onOpenChange={onOpenChange}
        initial={doctor}
        defaultLocation={defaultLocation}
        locations={locations}
        onSubmit={async (data) => {
          if (action === 'add' && onDirectAdd) {
            await onDirectAdd(data);
          } else if (action === 'edit' && doctor && onDirectEdit) {
            await onDirectEdit(doctor.id, data);
          }
        }}
        onDelete={action === 'edit' ? onDirectDelete : undefined}
      />
    );
  }

  // MR/Logged in: Use request forms
  if (isLoggedIn) {
    if (action === 'add') {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="p-0 overflow-hidden max-w-md max-h-[90vh] flex flex-col">
            <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <DialogTitle>Submit New Doctor Request</DialogTitle>
              <DialogDescription>
                Your submission will be reviewed by an administrator before being added to the master database.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto px-5 py-4">
              <NewDoctorRequestForm
                onSuccess={handleRequestSuccess}
                onCancel={handleClose}
              />
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    if (action === 'edit' && doctorRow) {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="p-0 overflow-hidden max-w-md max-h-[90vh] flex flex-col">
            <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <DialogTitle>Suggest Doctor Edit</DialogTitle>
              <DialogDescription>
                Your changes will be reviewed by an administrator before being applied.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto px-5 py-4">
              <EditDoctorRequestForm
                doctor={doctorRow}
                onSuccess={handleRequestSuccess}
                onCancel={handleClose}
              />
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    if (action === 'status' && doctorRow) {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="p-0 overflow-hidden max-w-md max-h-[90vh] flex flex-col">
            <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <DialogTitle>Request Status Change</DialogTitle>
              <DialogDescription>
                Your request will be reviewed by an administrator.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto px-5 py-4">
              <DoctorStatusRequestForm
                doctor={doctorRow}
                onSuccess={handleRequestSuccess}
                onCancel={handleClose}
              />
            </div>
          </DialogContent>
        </Dialog>
      );
    }
  }

  // Public: Show login prompt
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-md">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle>Login Required</DialogTitle>
          <DialogDescription>
            Please login to submit doctor requests.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 py-4">
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You need to be logged in to submit doctor changes for review.
            </p>
            <div className="flex gap-3">
              <a
                href="/login"
                className="flex-1 h-11 px-4 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Sign In
              </a>
              <a
                href="/signup"
                className="flex-1 h-11 px-4 rounded-lg text-sm font-bold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
