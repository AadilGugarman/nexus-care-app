// ============================================================================
// Doctor Request Forms
// MR-facing forms for submitting doctor creation, change, and status requests
// ============================================================================

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  createDoctorCreationRequest,
  createDoctorChangeRequest,
  createDoctorStatusRequest,
} from '@/lib/supabase/services/doctor-requests.service';
import type {
  DoctorCreationRequestInput,
  DoctorChangeRequestInput,
  DoctorStatusRequestInput,
  DoctorChanges,
} from '@/lib/types/doctor-requests.types';
import { Button } from '@/components/ui/button';
import { X, CheckCircle } from 'lucide-react';
import type { DoctorRow } from '@/lib/supabase/database.types';

// ============================================================================
// New Doctor Request Form
// ============================================================================

interface NewDoctorFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function NewDoctorRequestForm({ onSuccess, onCancel }: NewDoctorFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<DoctorCreationRequestInput>({
    name: '',
    location: '',
    speciality: '',
    qualification: '',
    hospital: '',
    mobile: '',
    address: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to submit requests');
      return;
    }

    try {
      setSubmitting(true);
      await createDoctorCreationRequest(formData, user.id);
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
        <p className="text-slate-400">
          Your new doctor request has been submitted for admin approval.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name - Required */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-300 mb-1">
            Doctor Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Dr. John Smith"
          />
        </div>

        {/* Location - Required */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">
            Location <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mumbai"
          />
        </div>

        {/* Speciality */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Speciality</label>
          <input
            type="text"
            value={formData.speciality}
            onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Cardiologist"
          />
        </div>

        {/* Qualification */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Qualification</label>
          <input
            type="text"
            value={formData.qualification}
            onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="MD, MBBS"
          />
        </div>

        {/* Hospital */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">
            Hospital
          </label>
          <input
            type="text"
            value={formData.hospital}
            onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="City General Hospital"
          />
        </div>

        {/* Mobile */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">
            Mobile
          </label>
          <input
            type="tel"
            value={formData.mobile}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+91 98765 43210"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-300 mb-1">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="123 Medical Plaza, Floor 2"
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-300 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Additional information about this doctor..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

// ============================================================================
// Doctor Edit Request Form
// ============================================================================

interface EditDoctorFormProps {
  doctor: DoctorRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditDoctorRequestForm({ doctor, onSuccess, onCancel }: EditDoctorFormProps) {
  const { user } = useAuth();
  const [changes, setChanges] = useState<DoctorChanges>({});
  const [changeReason, setChangeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Track which fields have been modified
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  function handleFieldChange(fieldName: string, newValue: string) {
    setModifiedFields(new Set(modifiedFields).add(fieldName));
    setChanges({
      ...changes,
      [fieldName]: {
        old: (doctor as any)[fieldName] || null,
        new: newValue || null,
      },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to submit requests');
      return;
    }

    if (Object.keys(changes).length === 0) {
      alert('No changes detected');
      return;
    }

    try {
      setSubmitting(true);
      await createDoctorChangeRequest(
        {
          doctor_id: doctor.id,
          changes,
          change_reason: changeReason,
        },
        user.id
      );
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
        <p className="text-slate-400">
          Your edit request has been submitted for admin approval.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-300">
          <strong>Current Doctor:</strong> {doctor.doctor_name}
        </p>
        <p className="text-xs text-blue-400 mt-1">
          Modify the fields you want to change. Only modified fields will be submitted for approval.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Editable Fields */}
        <FormField
          label="Doctor Name"
          value={doctor.doctor_name}
          onChange={(v) => handleFieldChange('doctor_name', v)}
          modified={modifiedFields.has('doctor_name')}
        />
        <FormField
          label="Location"
          value={doctor.location || ''}
          onChange={(v) => handleFieldChange('location', v)}
          modified={modifiedFields.has('location')}
        />
        <FormField
          label="Speciality"
          value={doctor.speciality || ''}
          onChange={(v) => handleFieldChange('speciality', v)}
          modified={modifiedFields.has('speciality')}
        />
        <FormField
          label="Qualification"
          value={doctor.qualification || ''}
          onChange={(v) => handleFieldChange('qualification', v)}
          modified={modifiedFields.has('qualification')}
        />
        <FormField
          label="Hospital"
          value={doctor.hospital || ''}
          onChange={(v) => handleFieldChange('hospital', v)}
          modified={modifiedFields.has('hospital')}
        />
        <FormField
          label="Mobile"
          value={doctor.mobile || ''}
          onChange={(v) => handleFieldChange('mobile', v)}
          modified={modifiedFields.has('mobile')}
        />
      </div>

      {/* Change Reason */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1">
          Reason for Changes (Optional)
        </label>
        <textarea
          value={changeReason}
          onChange={(e) => setChangeReason(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Explain why these changes are needed..."
        />
      </div>

      {/* Summary of Changes */}
      {Object.keys(changes).length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
          <div className="text-sm font-semibold text-slate-300 mb-2">Changes Summary:</div>
          <div className="space-y-1">
            {Object.entries(changes).map(([field, change]) => (
              <div key={field} className="text-xs text-slate-400 flex items-center gap-2">
                <span className="capitalize">{field.replace(/_/g, ' ')}:</span>
                <span className="line-through text-red-400">{change.old || '(empty)'}</span>
                <span>→</span>
                <span className="text-emerald-400">{change.new || '(empty)'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={submitting || Object.keys(changes).length === 0}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {submitting ? 'Submitting...' : 'Submit Changes'}
        </Button>
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

// Helper component for form fields with change tracking
function FormField({
  label,
  value,
  onChange,
  modified,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  modified: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-300 mb-1">
        {label}
        {modified && <span className="ml-2 text-xs text-yellow-400">(modified)</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg bg-slate-900 border ${
          modified ? 'border-yellow-500' : 'border-slate-700'
        } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />
    </div>
  );
}

// ============================================================================
// Doctor Status Request Form
// ============================================================================

interface StatusRequestFormProps {
  doctor: DoctorRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DoctorStatusRequestForm({ doctor, onSuccess, onCancel }: StatusRequestFormProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const isCurrentlyActive = doctor.is_active ?? true;
  const requestType = isCurrentlyActive ? 'mark_inactive' : 'mark_active';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to submit requests');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason for this status change');
      return;
    }

    try {
      setSubmitting(true);
      await createDoctorStatusRequest(
        {
          doctor_id: doctor.id,
          request_type: requestType,
          reason: reason.trim(),
        },
        user.id
      );
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
        <p className="text-slate-400">
          Your status change request has been submitted for admin approval.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
        <div className="text-sm font-semibold text-white mb-2">Status Change Request</div>
        <div className="text-sm text-slate-300">
          <strong>Doctor:</strong> {doctor.doctor_name}
        </div>
        <div className="text-sm text-slate-300 mt-1">
          <strong>Current Status:</strong>{' '}
          {isCurrentlyActive ? (
            <span className="text-emerald-400">Active</span>
          ) : (
            <span className="text-red-400">Inactive</span>
          )}
        </div>
        <div className="text-sm text-slate-300 mt-1">
          <strong>Requested Change:</strong>{' '}
          {requestType === 'mark_inactive' ? (
            <span className="text-orange-400">Mark as Inactive</span>
          ) : (
            <span className="text-emerald-400">Mark as Active</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1">
          Reason <span className="text-red-400">*</span>
        </label>
        <textarea
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder={
            requestType === 'mark_inactive'
              ? 'Why should this doctor be marked inactive? (e.g., retired, moved, no longer prescribing)'
              : 'Why should this doctor be reactivated?'
          }
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={submitting || !reason.trim()}
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
