'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  getDoctorCreationRequests,
  getDoctorChangeRequests,
  getDoctorStatusRequests,
} from '@/lib/supabase/services/doctor-requests.service';
import type {
  DoctorCreationRequestWithProfile,
  DoctorChangeRequestWithDetails,
  DoctorStatusRequestWithDetails,
} from '@/lib/types/doctor-requests.types';
import { Clock, CheckCircle, XCircle, FileText, Edit, Power } from 'lucide-react';
import toast from 'react-hot-toast';

type RequestType = 'creation' | 'change' | 'status';
type RequestStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function MyRequestsPage() {
  const { user, role } = useAuth();
  const router = useRouter();

  const [creationRequests, setCreationRequests] = useState<DoctorCreationRequestWithProfile[]>([]);
  const [changeRequests, setChangeRequests] = useState<DoctorChangeRequestWithDetails[]>([]);
  const [statusRequests, setStatusRequests] = useState<DoctorStatusRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<RequestType>('creation');
  const [statusFilter, setStatusFilter] = useState<RequestStatus>('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (role !== 'mr') {
      router.push('/');
      return;
    }
    loadRequests();
  }, [user, role]);

  async function loadRequests() {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [creation, change, status] = await Promise.all([
        getDoctorCreationRequests({ requested_by: user.id }),
        getDoctorChangeRequests({ requested_by: user.id }),
        getDoctorStatusRequests({ requested_by: user.id }),
      ]);

      setCreationRequests(creation);
      setChangeRequests(change);
      setStatusRequests(status);
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
    }
  }

  function filterByStatus<T extends { status: string }>(items: T[]): T[] {
    if (statusFilter === 'all') return items;
    return items.filter(item => item.status === statusFilter);
  }

  const filteredCreation = filterByStatus(creationRequests);
  const filteredChange = filterByStatus(changeRequests);
  const filteredStatus = filterByStatus(statusRequests);

  const totalPending =
    creationRequests.filter(r => r.status === 'pending').length +
    changeRequests.filter(r => r.status === 'pending').length +
    statusRequests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-slate-400">Loading your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            My Requests
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track all your doctor submission requests
          </p>
          {totalPending > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">
                {totalPending} request{totalPending !== 1 ? 's' : ''} pending review
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => setActiveTab('creation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'creation'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              New Doctors ({creationRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('change')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'change'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Edit className="w-4 h-4" />
              Updates ({changeRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'status'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Power className="w-4 h-4" />
              Status Changes ({statusRequests.length})
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {/* Creation Requests */}
          {activeTab === 'creation' && (
            <>
              {filteredCreation.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">
                    {statusFilter === 'all'
                      ? 'No new doctor requests yet'
                      : `No ${statusFilter} new doctor requests`}
                  </p>
                </div>
              ) : (
                filteredCreation.map(request => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                          {request.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {request.speciality} • {request.location}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      {request.hospital && (
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Hospital:</span>{' '}
                          <span className="text-slate-900 dark:text-white">{request.hospital}</span>
                        </div>
                      )}
                      {request.mobile && (
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Mobile:</span>{' '}
                          <span className="text-slate-900 dark:text-white">{request.mobile}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Submitted: {new Date(request.requested_at).toLocaleDateString('en-IN')}
                      </span>
                      {request.reviewed_at && (
                        <span>
                          Reviewed: {new Date(request.reviewed_at).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>

                    {request.admin_notes && (
                      <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Admin Notes:
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {request.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* Change Requests */}
          {activeTab === 'change' && (
            <>
              {filteredChange.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                  <Edit className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">
                    {statusFilter === 'all'
                      ? 'No update requests yet'
                      : `No ${statusFilter} update requests`}
                  </p>
                </div>
              ) : (
                filteredChange.map(request => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                          {request.doctor_name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Suggested Updates
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {/* Changes */}
                    <div className="mb-4 space-y-2">
                      {Object.entries(request.changes).map(([field, change]: [string, any]) => (
                        <div key={field} className="p-3 bg-slate-100 dark:bg-slate-700 rounded">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {field.replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <div className="text-sm">
                            <span className="text-red-600 dark:text-red-400 line-through">
                              {change.old || '(empty)'}
                            </span>
                            {' → '}
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {change.new || '(empty)'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {request.change_reason && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Your Reason:
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          {request.change_reason}
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Submitted: {new Date(request.requested_at).toLocaleDateString('en-IN')}
                      </span>
                      {request.reviewed_at && (
                        <span>
                          Reviewed: {new Date(request.reviewed_at).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>

                    {request.admin_notes && (
                      <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Admin Notes:
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {request.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* Status Requests */}
          {activeTab === 'status' && (
            <>
              {filteredStatus.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                  <Power className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">
                    {statusFilter === 'all'
                      ? 'No status change requests yet'
                      : `No ${statusFilter} status change requests`}
                  </p>
                </div>
              ) : (
                filteredStatus.map(request => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                          {request.doctor_name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Request to{' '}
                          {request.request_type === 'mark_inactive'
                            ? 'Mark as Inactive'
                            : 'Mark as Active'}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                        Your Reason:
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">{request.reason}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Submitted: {new Date(request.requested_at).toLocaleDateString('en-IN')}
                      </span>
                      {request.reviewed_at && (
                        <span>
                          Reviewed: {new Date(request.reviewed_at).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>

                    {request.admin_notes && (
                      <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Admin Notes:
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {request.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
