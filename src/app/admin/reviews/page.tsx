'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
  Edit,
  Power,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import {
  getDoctorCreationRequests,
  getDoctorChangeRequests,
  getDoctorStatusRequests,
  approveDoctorCreationRequest,
  rejectDoctorCreationRequest,
  approveDoctorChangeRequest,
  rejectDoctorChangeRequest,
  approveDoctorStatusRequest,
  rejectDoctorStatusRequest,
  getRequestStatistics,
} from '@/lib/supabase/services/doctor-requests.service';
import type {
  DoctorCreationRequestWithProfile,
  DoctorChangeRequestWithDetails,
  DoctorStatusRequestWithDetails,
  RequestStatistics,
  RequestStatus,
} from '@/lib/types/doctor-requests.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TabType = 'creation' | 'change' | 'status';

export default function AdminReviewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('creation');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('pending');
  const [stats, setStats] = useState<RequestStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  // Requests state
  const [creationRequests, setCreationRequests] = useState<DoctorCreationRequestWithProfile[]>([]);
  const [changeRequests, setChangeRequests] = useState<DoctorChangeRequestWithDetails[]>([]);
  const [statusRequests, setStatusRequests] = useState<DoctorStatusRequestWithDetails[]>([]);

  // Expanded request IDs for detail view
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Review modal state
  const [reviewingRequest, setReviewingRequest] = useState<{
    type: TabType;
    id: number;
    action: 'approve' | 'reject';
  } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, activeTab]);

  async function loadData() {
    try {
      setLoading(true);
      const [statsData, creation, change, status] = await Promise.all([
        getRequestStatistics(),
        getDoctorCreationRequests({ status: statusFilter }),
        getDoctorChangeRequests({ status: statusFilter }),
        getDoctorStatusRequests({ status: statusFilter }),
      ]);

      setStats(statsData);
      setCreationRequests(creation);
      setChangeRequests(change);
      setStatusRequests(status);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpanded(id: number) {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  }

  async function handleReview() {
    if (!reviewingRequest || !user) return;

    try {
      setProcessing(true);
      const { type, id, action } = reviewingRequest;

      if (type === 'creation') {
        if (action === 'approve') {
          await approveDoctorCreationRequest(id, user.id, adminNotes);
        } else {
          await rejectDoctorCreationRequest(id, user.id, adminNotes);
        }
      } else if (type === 'change') {
        if (action === 'approve') {
          await approveDoctorChangeRequest(id, user.id, adminNotes);
        } else {
          await rejectDoctorChangeRequest(id, user.id, adminNotes);
        }
      } else if (type === 'status') {
        if (action === 'approve') {
          await approveDoctorStatusRequest(id, user.id, adminNotes);
        } else {
          await rejectDoctorStatusRequest(id, user.id, adminNotes);
        }
      }

      // Reload data
      await loadData();

      // Close modal
      setReviewingRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error reviewing request:', error);
      alert('Failed to process request');
    } finally {
      setProcessing(false);
    }
  }

  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading requests...</p>
        </div>
      </div>
    );
  }

  const currentRequests =
    activeTab === 'creation'
      ? creationRequests
      : activeTab === 'change'
      ? changeRequests
      : statusRequests;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Request Review</h1>
        <p className="text-slate-400">Review and approve doctor data change requests from MRs</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.total_pending}</div>
                <div className="text-xs text-slate-400 font-semibold">Pending Review</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {stats.creation_requests.pending}
                </div>
                <div className="text-xs text-slate-400 font-semibold">New Doctors</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Edit className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {stats.change_requests.pending}
                </div>
                <div className="text-xs text-slate-400 font-semibold">Updates</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Power className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {stats.status_requests.pending}
                </div>
                <div className="text-xs text-slate-400 font-semibold">Status Changes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('creation')}
          className={cn(
            'px-4 py-2 font-semibold text-sm border-b-2 transition-colors',
            activeTab === 'creation'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          )}
        >
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            New Doctors
            {stats && stats.creation_requests.pending > 0 && (
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {stats.creation_requests.pending}
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('change')}
          className={cn(
            'px-4 py-2 font-semibold text-sm border-b-2 transition-colors',
            activeTab === 'change'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          )}
        >
          <div className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Updates
            {stats && stats.change_requests.pending > 0 && (
              <span className="bg-purple-500/20 text-purple-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {stats.change_requests.pending}
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={cn(
            'px-4 py-2 font-semibold text-sm border-b-2 transition-colors',
            activeTab === 'status'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          )}
        >
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4" />
            Status Changes
            {stats && stats.status_requests.pending > 0 && (
              <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {stats.status_requests.pending}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-300'
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {currentRequests.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No {statusFilter} requests found</p>
          </div>
        ) : (
          currentRequests.map((request: any) => (
            <RequestCard
              key={request.id}
              request={request}
              type={activeTab}
              expanded={expandedIds.has(request.id)}
              onToggleExpand={() => toggleExpanded(request.id)}
              onReview={(action) =>
                setReviewingRequest({ type: activeTab, id: request.id, action })
              }
              formatDate={formatDate}
            />
          ))
        )}
      </div>

      {/* Review Modal */}
      {reviewingRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              {reviewingRequest.action === 'approve' ? 'Approve' : 'Reject'} Request
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">
                  Admin Notes {reviewingRequest.action === 'reject' && '(Required)'}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for the MR..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleReview}
                  disabled={processing || (reviewingRequest.action === 'reject' && !adminNotes)}
                  className={cn(
                    'flex-1',
                    reviewingRequest.action === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  )}
                >
                  {processing ? 'Processing...' : reviewingRequest.action === 'approve' ? 'Approve' : 'Reject'}
                </Button>
                <Button
                  onClick={() => {
                    setReviewingRequest(null);
                    setAdminNotes('');
                  }}
                  disabled={processing}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Request Card Component
function RequestCard({
  request,
  type,
  expanded,
  onToggleExpand,
  onReview,
  formatDate,
}: {
  request: any;
  type: TabType;
  expanded: boolean;
  onToggleExpand: () => void;
  onReview: (action: 'approve' | 'reject') => void;
  formatDate: (date: string) => string;
}) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/30',
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  'text-xs font-bold px-2 py-1 rounded border',
                  statusColors[request.status]
                )}
              >
                {request.status.toUpperCase()}
              </span>
              {type === 'creation' && <span className="text-white font-bold">{request.name}</span>}
              {type === 'change' && (
                <span className="text-white font-bold">{request.doctor_name}</span>
              )}
              {type === 'status' && (
                <span className="text-white font-bold">{request.doctor_name}</span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {request.requester_name || request.requester_email}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(request.requested_at)}
              </div>
            </div>
          </div>

          <button
            onClick={onToggleExpand}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <>
          <div className="border-t border-slate-700 p-4 bg-slate-900/50">
            {type === 'creation' && <CreationRequestDetails request={request} />}
            {type === 'change' && <ChangeRequestDetails request={request} />}
            {type === 'status' && <StatusRequestDetails request={request} />}
          </div>

          {/* Actions */}
          {request.status === 'pending' && (
            <div className="border-t border-slate-700 p-4 flex gap-3">
              <Button
                onClick={() => onReview('approve')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => onReview('reject')}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}

          {request.status !== 'pending' && request.admin_notes && (
            <div className="border-t border-slate-700 p-4 bg-slate-900/50">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1">Admin Notes</div>
                  <div className="text-sm text-slate-300">{request.admin_notes}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Creation Request Details
function CreationRequestDetails({ request }: { request: DoctorCreationRequestWithProfile }) {
  const fields = [
    { label: 'Name', value: request.name },
    { label: 'Location', value: request.location },
    { label: 'Speciality', value: request.speciality },
    { label: 'Qualification', value: request.qualification },
    { label: 'Hospital', value: request.hospital },
    { label: 'Mobile', value: request.mobile },
    { label: 'Address', value: request.address },
    { label: 'Notes', value: request.notes },
  ].filter((f) => f.value);

  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map((field) => (
        <div key={field.label}>
          <div className="text-xs font-semibold text-slate-400 mb-1">{field.label}</div>
          <div className="text-sm text-white">{field.value}</div>
        </div>
      ))}
    </div>
  );
}

// Change Request Details
function ChangeRequestDetails({ request }: { request: DoctorChangeRequestWithDetails }) {
  return (
    <div className="space-y-3">
      {request.change_reason && (
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-1">Reason for Change</div>
          <div className="text-sm text-white">{request.change_reason}</div>
        </div>
      )}

      <div>
        <div className="text-xs font-semibold text-slate-400 mb-2">Proposed Changes</div>
        <div className="space-y-2">
          {Object.entries(request.changes).map(([field, change]) => (
            <div key={field} className="flex items-center gap-3 text-sm">
              <span className="text-slate-400 font-semibold capitalize">
                {field.replace(/_/g, ' ')}:
              </span>
              <span className="text-red-400 line-through">{change.old || '(empty)'}</span>
              <span className="text-slate-600">→</span>
              <span className="text-emerald-400">{change.new || '(empty)'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Status Request Details
function StatusRequestDetails({ request }: { request: DoctorStatusRequestWithDetails }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-semibold text-slate-400 mb-1">Request Type</div>
        <div className="text-sm text-white font-semibold capitalize">
          {request.request_type.replace(/_/g, ' ')}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-400 mb-1">Current Status</div>
        <div className="text-sm text-white">
          {request.doctor_is_active ? (
            <span className="text-emerald-400">Active</span>
          ) : (
            <span className="text-red-400">Inactive</span>
          )}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-400 mb-1">Reason</div>
        <div className="text-sm text-white">{request.reason}</div>
      </div>
    </div>
  );
}
