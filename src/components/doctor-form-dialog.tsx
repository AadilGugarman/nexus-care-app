'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Doctor } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DoctorFormData {
  doctorName: string;
  location: string;
  address: string;
  speciality: string;
  qualification: string;
  hospital: string;
  mobile: string;
}

interface DoctorFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Doctor | null;
  defaultLocation?: string;
  locations: string[];
  onSubmit: (data: DoctorFormData) => void;
  onDelete?: () => void;
}

export function DoctorFormDialog({
  open,
  onOpenChange,
  initial,
  defaultLocation,
  locations,
  onSubmit,
  onDelete,
}: DoctorFormDialogProps) {
  const [form, setForm] = useState<DoctorFormData>({
    doctorName: '',
    location: '',
    address: '',
    speciality: '',
    qualification: '',
    hospital: '',
    mobile: '',
  });
  const [showAdditional, setShowAdditional] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        doctorName: initial?.doctorName ?? '',
        location: initial?.location ?? defaultLocation ?? locations[0] ?? '',
        address: initial?.address ?? '',
        speciality: initial?.speciality ?? '',
        qualification: initial?.qualification ?? '',
        hospital: initial?.hospital ?? '',
        mobile: initial?.mobile ?? '',
      });
      setShowAdditional(false);
      setConfirmDelete(false);
    }
  }, [open, initial, defaultLocation, locations]);

  const isEditing = !!initial;
  const isValid = form.doctorName.trim().length > 0 && form.location.trim().length > 0;

  function updateField<K extends keyof DoctorFormData>(key: K, value: DoctorFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        doctorName: form.doctorName.trim(),
        location: form.location.trim(),
        address: form.address.trim(),
        speciality: form.speciality.trim(),
        qualification: form.qualification.trim(),
        hospital: form.hospital.trim(),
        mobile: form.mobile.trim(),
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <DialogTitle>{isEditing ? 'Edit Doctor' : 'Add Doctor'}</DialogTitle>
          <DialogDescription>
            Only Doctor Name and Location are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="px-5 py-4 space-y-4 overflow-y-auto min-h-0">
            <div className="space-y-1.5">
              <Label htmlFor="doctor-name">Doctor Name *</Label>
              <Input
                id="doctor-name"
                autoFocus
                value={form.doctorName}
                onChange={(e) => updateField('doctorName', e.target.value)}
                placeholder="Dr. ..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doctor-location">Location *</Label>
              <Input
                id="doctor-location"
                list="locations-list"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="e.g. Nadiad"
              />
              <datalist id="locations-list">
                {locations.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <button
                type="button"
                onClick={() => setShowAdditional((v) => !v)}
                className="w-full flex items-center justify-between rounded-lg px-1 py-2 text-left"
              >
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Additional Details (Optional)
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-slate-500 transition-transform',
                    showAdditional && 'rotate-180',
                  )}
                />
              </button>

              {showAdditional && (
                <div className="mt-3 space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <Label htmlFor="doctor-address">Address</Label>
                    <Input
                      id="doctor-address"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Clinic / chamber address"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="doctor-speciality">Speciality</Label>
                    <Input
                      id="doctor-speciality"
                      value={form.speciality}
                      onChange={(e) => updateField('speciality', e.target.value)}
                      placeholder="e.g. Physician"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="doctor-qualification">Qualification</Label>
                    <Input
                      id="doctor-qualification"
                      value={form.qualification}
                      onChange={(e) => updateField('qualification', e.target.value)}
                      placeholder="e.g. MD Medicine"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="doctor-hospital">Hospital</Label>
                    <Input
                      id="doctor-hospital"
                      value={form.hospital}
                      onChange={(e) => updateField('hospital', e.target.value)}
                      placeholder="e.g. Patel Hospital"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="doctor-mobile">Mobile Number</Label>
                    <Input
                      id="doctor-mobile"
                      inputMode="tel"
                      value={form.mobile}
                      onChange={(e) => updateField('mobile', e.target.value)}
                      placeholder="e.g. 9876543210"
                    />
                  </div>

                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 safe-bottom shrink-0 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2">
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirmDelete) {
                      setConfirmDelete(true);
                      return;
                    }
                    onDelete();
                    onOpenChange(false);
                  }}
                  className="h-11 px-4 rounded-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all"
                >
                  {confirmDelete ? 'Confirm Delete' : 'Delete'}
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-11 px-4 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="h-11 px-5 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {isEditing ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
