"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

import { useAuth } from "@/lib/auth";
import {
  Clock,
  CheckCircle,
  Pencil,
  MessageSquare,
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
  Square,
  CheckSquare,
  Loader2,
} from "lucide-react";
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
  editAndApproveDoctorCreationRequest,
  editAndApproveDoctorChangeRequest,
  requestChangesForDoctorCreationRequest,
  requestChangesForDoctorChangeRequest,
  requestChangesForDoctorStatusRequest,
} from "@/lib/supabase/services/doctor-requests.service";
import type {
  DoctorCreationRequestWithProfile,
  DoctorChangeRequestWithDetails,
  DoctorStatusRequestWithDetails,
  RequestStatistics,
  RequestStatus,
  DoctorChanges,
} from "@/lib/types/doctor-requests.types";
import { cn } from "@/lib/utils";

type TabType = "creation" | "change" | "status";
type ModalType = "review" | "edit" | "request-changes" | "bulk-confirm";

export default function AdminReviewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("creation");
  const [statusFilter, setStatusFilter] = useState<
    RequestStatus | "all" | "pending"
  >("pending");
  const [stats, setStats] = useState<RequestStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Requests state
  const [creationRequests, setCreationRequests] = useState<
    DoctorCreationRequestWithProfile[]
  >([]);
  const [changeRequests, setChangeRequests] = useState<
    DoctorChangeRequestWithDetails[]
  >([]);
  const [statusRequests, setStatusRequests] = useState<
    DoctorStatusRequestWithDetails[]
  >([]);

  // Expanded request IDs for detail view
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Modal state
  const [modalState, setModalState] = useState<{
    type: ModalType;
    requestType: TabType;
    requestId?: number;
    bulkAction?: "approve" | "request-changes" | "reject";
  } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [statusFilter, activeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalState || processing) return;
      if (selectedIds.size > 0) return;

      const currentRequests =
        activeTab === "creation"
          ? creationRequests
          : activeTab === "change"
            ? changeRequests
            : statusRequests;
      if (currentRequests.length === 0) return;

      switch (e.key.toLowerCase()) {
        case "a":
          const firstPending = currentRequests.find(
            (r) => r.status === "pending",
          );
          if (firstPending) openModal("review", activeTab, firstPending.id);
          break;
        case "e":
          const firstPendingForEdit = currentRequests.find(
            (r) =>
              r.status === "pending" &&
              (activeTab === "creation" || activeTab === "change"),
          );
          if (firstPendingForEdit)
            openModal("edit", activeTab, firstPendingForEdit.id);
          break;
        case "r":
          const firstPendingForReject = currentRequests.find(
            (r) => r.status === "pending",
          );
          if (firstPendingForReject)
            setModalState({
              type: "review",
              requestType: activeTab,
              requestId: firstPendingForReject.id,
            });
          break;
        case "c":
          const firstPendingForChanges = currentRequests.find(
            (r) => r.status === "pending",
          );
          if (firstPendingForChanges)
            openModal("request-changes", activeTab, firstPendingForChanges.id);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    modalState,
    processing,
    selectedIds,
    activeTab,
    creationRequests,
    changeRequests,
    statusRequests,
  ]);

  async function loadData() {
    try {
      setLoading(true);
      const [statsData, creation, change, status] = await Promise.all([
        getRequestStatistics(),
        getDoctorCreationRequests({
          status: statusFilter === "all" ? undefined : statusFilter,
        }),
        getDoctorChangeRequests({
          status: statusFilter === "all" ? undefined : statusFilter,
        }),
        getDoctorStatusRequests({
          status: statusFilter === "all" ? undefined : statusFilter,
        }),
      ]);

      setStats(statsData);
      setCreationRequests(creation);
      setChangeRequests(change);
      setStatusRequests(status);
    } catch (error) {
      console.error("Error loading data:", error);
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

  function toggleSelectId(id: number) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }

  function toggleSelectAll() {
    const currentRequests =
      activeTab === "creation"
        ? creationRequests
        : activeTab === "change"
          ? changeRequests
          : statusRequests;
    const pendingIds = currentRequests
      .filter((r) => r.status === "pending")
      .map((r) => r.id);
    const allSelected = pendingIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function openModal(
    type: ModalType,
    requestType: TabType,
    requestId?: number,
    bulkAction?: "approve" | "request-changes" | "reject",
  ) {
    setModalState({ type, requestType, requestId, bulkAction });
    setAdminNotes("");

    if (type === "edit" && requestId) {
      // Prefill edit form
      if (requestType === "creation") {
        const req = creationRequests.find((r) => r.id === requestId);
        if (req) {
          setEditFormData({
            name: req.name || "",
            location: req.location || "",
            address: req.address || "",
            speciality: req.speciality || "",
            qualification: req.qualification || "",
            hospital: req.hospital || "",
            mobile: req.mobile || "",
            notes: req.notes || "",
          });
        }
      } else if (requestType === "change") {
        const req = changeRequests.find((r) => r.id === requestId);
        if (req) {
          const data: Record<string, string> = {};
          Object.entries(req.changes).forEach(([key, change]) => {
            data[key] = change.new || "";
          });
          setEditFormData(data);
        }
      }
    }
  }

  function closeModal() {
    setModalState(null);
    setAdminNotes("");
    setEditFormData({});
  }

  async function handleApprove() {
    if (!modalState || !user || !modalState.requestId) return;

    try {
      setProcessing(true);
      const { requestType, requestId } = modalState;

      if (requestType === "creation") {
        await approveDoctorCreationRequest(
          requestId,
          user.id,
          user.user_metadata?.full_name || null,
          adminNotes,
        );
      } else if (requestType === "change") {
        await approveDoctorChangeRequest(
          requestId,
          user.id,
          user.user_metadata?.full_name || null,
          adminNotes,
        );
      } else if (requestType === "status") {
        await approveDoctorStatusRequest(
          requestId,
          user.id,
          user.user_metadata?.full_name || null,
          adminNotes,
        );
      }

      await loadData();
      closeModal();
    } catch (error) {
      console.error("Error reviewing request:", error);
      alert("Failed to process request");
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!modalState || !user || !modalState.requestId) return;

    try {
      setProcessing(true);
      const { requestType, requestId } = modalState;

      if (requestType === "creation") {
        await rejectDoctorCreationRequest(
          requestId,
          user.id,
          user.user_metadata?.full_name || null,
          adminNotes,
        );
      } else if (requestType === "change") {
        await rejectDoctorChangeRequest(
          requestId,
          user.id,
          user.user_metadata?.full_name || null,
          adminNotes,
        );
      } else if (requestType === "status") {
        await rejectDoctorStatusRequest(
          requestId,
          user.id,
          user.user_metadata?.full_name || null,
          adminNotes,
        );
      }

      await loadData();
      closeModal();
    } catch (error) {
      console.error("Error reviewing request:", error);
      alert("Failed to process request");
    } finally {
      setProcessing(false);
    }
  }

  async function handleRequestChanges() {
    if (!modalState || !user || !modalState.requestId) return;
    if (!adminNotes) {
      alert("Please provide feedback for the MR");
      return;
    }

    try {
      setProcessing(true);
      const { requestType, requestId } = modalState;

      if (requestType === "creation") {
        await requestChangesForDoctorCreationRequest(
          requestId,
          user.id,
          user.user_metadata?.full_name || null,
          adminNotes,
        );
      } else if (requestType === "change") {
        await requestChangesForDoctorChangeRequest(
          requestId,
          user.id,
          user.user_metadata?.full_name || null,
          adminNotes,
        );
      } else if (requestType === "status") {
        await requestChangesForDoctorStatusRequest(
          requestId,
          user.id,
          user.user_metadata?.full_name || null,
          adminNotes,
        );
      }

      await loadData();
      closeModal();
    } catch (error) {
      console.error("Error requesting changes:", error);
      alert("Failed to process request");
    } finally {
      setProcessing(false);
    }
  }

  async function handleEditAndApprove() {
    if (!modalState || !user || !modalState.requestId) return;

    try {
      setProcessing(true);
      const { requestType, requestId } = modalState;
      const request = getCurrentRequest();
      if (!request) return;

      // Build changes object
      const changes: DoctorChanges = {};
      Object.entries(editFormData).forEach(([key, value]) => {
        let originalValue: string | null = null;
        if (requestType === "creation") {
          const req = request as DoctorCreationRequestWithProfile;
          originalValue = key === "name" ? req.name : (req as any)[key];
        } else if (requestType === "change") {
          const req = request as DoctorChangeRequestWithDetails;
          originalValue = req.changes[key]?.new || null;
        }
        changes[key] = { old: originalValue, new: value };
      });

      if (requestType === "creation") {
        await editAndApproveDoctorCreationRequest(
          requestId,
          user.id,
          user.user_metadata?.full_name || null,
          changes,
          adminNotes,
        );
      } else if (requestType === "change") {
        await editAndApproveDoctorChangeRequest(
          requestId,
          user.id,
          user.user_metadata?.full_name || null,
          changes,
          adminNotes,
        );
      }

      await loadData();
      closeModal();
    } catch (error) {
      console.error("Error editing and approving:", error);
      alert("Failed to process request");
    } finally {
      setProcessing(false);
    }
  }

  async function handleBulkAction(
    action: "approve" | "request-changes" | "reject",
  ) {
    if (!user || selectedIds.size === 0) return;

    if (action === "request-changes" && !adminNotes) {
      alert("Please provide feedback for the MR");
      return;
    }

    try {
      setProcessing(true);
      const currentRequests =
        activeTab === "creation"
          ? creationRequests
          : activeTab === "change"
            ? changeRequests
            : statusRequests;
      const requestsToProcess = currentRequests.filter((r) =>
        selectedIds.has(r.id),
      );

      for (const request of requestsToProcess) {
        try {
          if (activeTab === "creation") {
            if (action === "approve")
              await approveDoctorCreationRequest(
                request.id,
                user.id,
                user.user_metadata?.full_name || null,
                adminNotes,
              );
            else if (action === "reject")
              await rejectDoctorCreationRequest(
                request.id,
                user.id,
                user.user_metadata?.full_name || null,
                adminNotes,
              );
            else if (action === "request-changes")
              await requestChangesForDoctorCreationRequest(
                request.id,
                user.id,
                user.user_metadata?.full_name || null,
                adminNotes,
              );
          } else if (activeTab === "change") {
            if (action === "approve")
              await approveDoctorChangeRequest(
                request.id,
                user.id,
                user.user_metadata?.full_name || null,
                adminNotes,
              );
            else if (action === "reject")
              await rejectDoctorChangeRequest(
                request.id,
                user.id,
                user.user_metadata?.full_name || null,
                adminNotes,
              );
            else if (action === "request-changes")
              await requestChangesForDoctorChangeRequest(
                request.id,
                user.id,
                user.user_metadata?.full_name || null,
                adminNotes,
              );
          } else if (activeTab === "status") {
            if (action === "approve")
              await approveDoctorStatusRequest(
                request.id,
                user.id,
                user.user_metadata?.full_name || null,
                adminNotes,
              );
            else if (action === "reject")
              await rejectDoctorStatusRequest(
                request.id,
                user.id,
                user.user_metadata?.full_name || null,
                adminNotes,
              );
            else if (action === "request-changes")
              await requestChangesForDoctorStatusRequest(
                request.id,
                user.id,
                user.user_metadata?.full_name || null,
                adminNotes,
              );
          }
        } catch (e) {
          console.error("Failed to process request:", request.id, e);
        }
      }

      await loadData();
      clearSelection();
      closeModal();
    } catch (error) {
      console.error("Error processing bulk action:", error);
      alert("Failed to process bulk action");
    } finally {
      setProcessing(false);
    }
  }

  function getCurrentRequest() {
    if (!modalState?.requestId) return null;
    const { requestType, requestId } = modalState;
    if (requestType === "creation") {
      return creationRequests.find((r) => r.id === requestId);
    } else if (requestType === "change") {
      return changeRequests.find((r) => r.id === requestId);
    } else {
      return statusRequests.find((r) => r.id === requestId);
    }
  }

  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const currentRequests =
    activeTab === "creation"
      ? creationRequests
      : activeTab === "change"
        ? changeRequests
        : statusRequests;
  const pendingCurrentRequests = currentRequests.filter(
    (r) => r.status === "pending",
  );
  const allSelected =
    pendingCurrentRequests.length > 0 &&
    pendingCurrentRequests.every((id) => selectedIds.has(id.id));

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-8">
      {/* Main Content Area */}
      <div className="px-4 sm:px-5 lg:px-6 space-y-6">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Clock className="w-5 h-5 text-yellow-400" />}
              label="Pending Review"
              value={stats.total_pending}
              color="yellow"
            />
            <StatCard
              icon={<UserPlus className="w-5 h-5 text-blue-400" />}
              label="New Doctors"
              value={stats.creation_requests.pending}
              color="blue"
            />
            <StatCard
              icon={<Edit className="w-5 h-5 text-indigo-400" />}
              label="Updates"
              value={stats.change_requests.pending}
              color="indigo"
            />
            <StatCard
              icon={<Power className="w-5 h-5 text-orange-400" />}
              label="Status Changes"
              value={stats.status_requests.pending}
              color="orange"
            />
          </div>
        )}

        {/* Tabs & Filters - Sticky Container */}
        <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 -mx-4 sm:-mx-5 lg:-mx-6 px-4 sm:px-5 lg:px-6 py-4">
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <TabButton
                active={activeTab === "creation"}
                onClick={() => setActiveTab("creation")}
                icon={<UserPlus className="w-4 h-4" />}
                label="New Doctors"
                count={stats?.creation_requests.pending}
              />
              <TabButton
                active={activeTab === "change"}
                onClick={() => setActiveTab("change")}
                icon={<Edit className="w-4 h-4" />}
                label="Updates"
                count={stats?.change_requests.pending}
              />
              <TabButton
                active={activeTab === "status"}
                onClick={() => setActiveTab("status")}
                icon={<Power className="w-4 h-4" />}
                label="Status Changes"
                count={stats?.status_requests.pending}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterButton
                active={statusFilter === "pending"}
                onClick={() => setStatusFilter("pending")}
                label="Pending"
              />
              <FilterButton
                active={statusFilter === "requested_changes"}
                onClick={() => setStatusFilter("requested_changes")}
                label="Requested Changes"
              />
              <FilterButton
                active={statusFilter === "approved"}
                onClick={() => setStatusFilter("approved")}
                label="Approved"
              />
              <FilterButton
                active={statusFilter === "rejected"}
                onClick={() => setStatusFilter("rejected")}
                label="Rejected"
              />
              <FilterButton
                active={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
                label="All"
              />
            </div>
          </div>
        </div>

        {/* Select All Row */}
        {pendingCurrentRequests.length > 0 && (
          <div className="flex items-center gap-3 px-1">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">Select All</span>
            </button>
            <div className="h-4 w-px bg-slate-800" />
            <span className="text-xs text-slate-500">
              Shortcuts: A (Approve), E (Edit), R (Reject), C (Request Changes)
            </span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
              <p className="text-slate-400">Loading requests...</p>
            </div>
          </div>
        )}

        {/* Requests List */}
        {!loading && (
          <div className="space-y-4">
            {currentRequests.length === 0 ? (
              <EmptyState statusFilter={statusFilter} />
            ) : (
              currentRequests.map((request: any) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  type={activeTab}
                  expanded={expandedIds.has(request.id)}
                  onToggleExpand={() => toggleExpanded(request.id)}
                  onOpenModal={openModal}
                  formatDate={formatDate}
                  isSelected={selectedIds.has(request.id)}
                  onToggleSelect={() => toggleSelectId(request.id)}
                  isPending={request.status === "pending"}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 shadow-2xl">
          <div className="px-4 sm:px-5 lg:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">
                  Selected{" "}
                  <span className="text-blue-400 font-bold">
                    {selectedIds.size}
                  </span>{" "}
                  {selectedIds.size === 1 ? "request" : "requests"}
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <BulkActionButton
                  onClick={() =>
                    openModal("bulk-confirm", activeTab, undefined, "approve")
                  }
                  color="emerald"
                  icon={<CheckCircle className="w-4 h-4" />}
                  label="Approve Selected"
                />
                <BulkActionButton
                  onClick={() =>
                    openModal(
                      "bulk-confirm",
                      activeTab,
                      undefined,
                      "request-changes",
                    )
                  }
                  color="amber"
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="Request Changes"
                />
                <BulkActionButton
                  onClick={() =>
                    openModal("bulk-confirm", activeTab, undefined, "reject")
                  }
                  color="red"
                  icon={<XCircle className="w-4 h-4" />}
                  label="Reject Selected"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modals
        modalState={modalState}
        adminNotes={adminNotes}
        setAdminNotes={setAdminNotes}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        processing={processing}
        onClose={closeModal}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestChanges={handleRequestChanges}
        onEditAndApprove={handleEditAndApprove}
        onBulkAction={handleBulkAction}
        selectedCount={selectedIds.size}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    yellow: "bg-yellow-500/10 border-yellow-500/20",
    blue: "bg-blue-500/10 border-blue-500/20",
    indigo: "bg-indigo-500/10 border-indigo-500/20",
    orange: "bg-orange-500/10 border-orange-500/20",
  };

  return (
    <div
      className={cn(
        "bg-slate-900 border rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-lg hover:border-slate-700",
        colorClasses[color as keyof typeof colorClasses],
      )}
    >
      <div className="p-3 bg-slate-800 rounded-xl">{icon}</div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap",
        active
          ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
          : "text-slate-400 hover:text-white hover:bg-slate-800/50",
      )}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-700 text-xs text-slate-200 font-bold">
          {count}
        </span>
      )}
    </button>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
        active
          ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
          : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700",
      )}
    >
      {label}
    </button>
  );
}

function BulkActionButton({
  onClick,
  color,
  icon,
  label,
}: {
  onClick: () => void;
  color: string;
  icon: React.ReactNode;
  label: string;
}) {
  const colorClasses = {
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
    amber: "bg-amber-600 hover:bg-amber-700 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md",
        colorClasses[color as keyof typeof colorClasses],
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function RequestCard({
  request,
  type,
  expanded,
  onToggleExpand,
  onOpenModal,
  formatDate,
  isSelected,
  onToggleSelect,
  isPending,
}: {
  request: any;
  type: TabType;
  expanded: boolean;
  onToggleExpand: () => void;
  onOpenModal: (
    type: ModalType,
    requestType: TabType,
    requestId?: number,
  ) => void;
  formatDate: (date: string) => string;
  isSelected: boolean;
  onToggleSelect: () => void;
  isPending: boolean;
}) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    rejected: "bg-red-500/10 text-red-400 border-red-500/30",
    requested_changes: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    requested_changes: "Changes Requested",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:border-slate-700">
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          {isPending && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              className="mt-1 text-slate-500 hover:text-white transition-colors"
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start flex-wrap gap-3 mb-4">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border",
                  statusColors[request.status],
                )}
              >
                {statusLabels[request.status]}
              </span>
              <h3 className="text-lg font-semibold text-white truncate">
                {type === "creation" ? request.name : request.doctor_name}
              </h3>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{request.requester_name || request.requester_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(request.requested_at)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onToggleExpand}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <>
          <div className="border-t border-slate-800 px-6 py-6 bg-slate-950/50">
            {type === "creation" && (
              <CreationRequestDetails request={request} />
            )}
            {type === "change" && <ChangeRequestDetails request={request} />}
            {type === "status" && <StatusRequestDetails request={request} />}
          </div>

          {isPending && (
            <>
              <div className="border-t border-slate-800 mx-6" />
              <div className="p-6">
                <ActionButtons
                  type={type}
                  onApprove={() => onOpenModal("review", type, request.id)}
                  onEdit={() => onOpenModal("edit", type, request.id)}
                  onRequestChanges={() =>
                    onOpenModal("request-changes", type, request.id)
                  }
                  onReject={() => onOpenModal("review", type, request.id)}
                />
              </div>
            </>
          )}

          {!isPending && request.admin_notes && (
            <div className="border-t border-slate-800 px-6 py-5 bg-slate-950/50">
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Admin Notes
                  </h4>
                  <p className="text-sm text-slate-300">
                    {request.admin_notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ActionButtons({
  type,
  onApprove,
  onEdit,
  onRequestChanges,
  onReject,
}: {
  type: TabType;
  onApprove: () => void;
  onEdit: () => void;
  onRequestChanges: () => void;
  onReject: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onApprove}
          className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Approve</span>
        </button>
        {(type === "creation" || type === "change") && (
          <button
            onClick={onEdit}
            className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit & Approve</span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onRequestChanges}
          className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-900/20 hover:shadow-amber-900/40"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Request Changes</span>
        </button>
        <button
          onClick={onReject}
          className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-transparent border-2 border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 font-semibold rounded-xl transition-all"
        >
          <XCircle className="w-4 h-4" />
          <span>Reject</span>
        </button>
      </div>
    </div>
  );
}

function CreationRequestDetails({
  request,
}: {
  request: DoctorCreationRequestWithProfile;
}) {
  const fields = [
    { label: "Name", value: request.name },
    { label: "Location", value: request.location },
    { label: "Speciality", value: request.speciality },
    { label: "Qualification", value: request.qualification },
    { label: "Hospital", value: request.hospital },
    { label: "Mobile", value: request.mobile },
    { label: "Address", value: request.address },
    { label: "Notes", value: request.notes },
  ].filter((f) => f.value);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
      {fields.map((field) => (
        <div key={field.label} className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {field.label}
          </span>
          <p className="text-sm text-slate-200 break-words">{field.value}</p>
        </div>
      ))}
    </div>
  );
}

function ChangeRequestDetails({
  request,
}: {
  request: DoctorChangeRequestWithDetails;
}) {
  return (
    <div className="space-y-5">
      {request.change_reason && (
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Reason for Change
          </span>
          <p className="text-sm text-slate-200">{request.change_reason}</p>
        </div>
      )}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Proposed Changes
        </span>
        <div className="space-y-3">
          {Object.entries(request.changes).map(([field, change]) => (
            <div
              key={field}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start"
            >
              <span className="text-sm font-semibold text-slate-400 capitalize pt-1">
                {field.replace(/_/g, " ")}
              </span>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-red-400 font-semibold mb-1">Old</p>
                  <p className="text-sm text-red-300 line-through">
                    {change.old || "(empty)"}
                  </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-emerald-400 font-semibold mb-1">
                    New
                  </p>
                  <p className="text-sm text-emerald-300">
                    {change.new || "(empty)"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusRequestDetails({
  request,
}: {
  request: DoctorStatusRequestWithDetails;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Request Type
        </span>
        <p className="text-sm text-slate-200 font-semibold capitalize">
          {request.request_type.replace(/_/g, " ")}
        </p>
      </div>
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Current Status
        </span>
        <p className="text-sm text-slate-200">
          {request.doctor_is_active ? (
            <span className="text-emerald-400 font-semibold">Active</span>
          ) : (
            <span className="text-red-400 font-semibold">Inactive</span>
          )}
        </p>
      </div>
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Reason
        </span>
        <p className="text-sm text-slate-200">{request.reason}</p>
      </div>
    </div>
  );
}

function EmptyState({ statusFilter }: { statusFilter: any }) {
  return (
    <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
      <AlertCircle className="w-14 h-14 text-slate-600 mx-auto mb-5" />
      <h3 className="text-lg font-semibold text-white mb-2">
        No requests found
      </h3>
      <p className="text-slate-400">
        There are no{" "}
        {statusFilter === "all" ? "" : statusFilter.replace(/_/g, " ") + " "}
        requests at the moment.
      </p>
    </div>
  );
}

function Modals({
  modalState,
  adminNotes,
  setAdminNotes,
  editFormData,
  setEditFormData,
  processing,
  onClose,
  onApprove,
  onReject,
  onRequestChanges,
  onEditAndApprove,
  onBulkAction,
  selectedCount,
}: any) {
  if (!modalState) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Review Modal */}
        {modalState.type === "review" && (
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Review Request</h3>
              <p className="text-slate-400 text-sm">
                Add notes (optional) and take action on this request.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes for the MR..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={onApprove}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {processing ? "Processing..." : "Approve"}
              </button>
              <button
                onClick={onReject}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {processing ? "Processing..." : "Reject"}
              </button>
            </div>
            <button
              onClick={onClose}
              disabled={processing}
              className="w-full px-5 py-3.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Edit & Approve Modal */}
        {modalState.type === "edit" && (
          <div className="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Edit & Approve</h3>
              <p className="text-slate-400 text-sm">
                Make corrections and approve the request.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(editFormData).map(([key, value]) => (
                <div key={key} className="sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-400 mb-2 capitalize">
                    {key.replace(/_/g, " ")}
                  </label>
                  <input
                    type="text"
                    value={String(value || "")}
                    onChange={(e) =>
                      setEditFormData((prev: Record<string, string>) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">
                Admin Correction Note (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about the changes you made..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={onEditAndApprove}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
                {processing ? "Processing..." : "Edit & Approve"}
              </button>
              <button
                onClick={onClose}
                disabled={processing}
                className="flex-1 px-5 py-3.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Request Changes Modal */}
        {modalState.type === "request-changes" && (
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Request Changes</h3>
              <p className="text-slate-400 text-sm">
                Provide clear feedback to the MR about what needs to change.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">
                Feedback for MR (Required)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Tell the MR what changes are needed..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={onRequestChanges}
                disabled={processing || !adminNotes}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                {processing ? "Processing..." : "Request Changes"}
              </button>
              <button
                onClick={onClose}
                disabled={processing}
                className="flex-1 px-5 py-3.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bulk Confirm Modal */}
        {modalState.type === "bulk-confirm" && (
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                Confirm Bulk Action
              </h3>
              <p className="text-slate-400 text-sm">
                You are about to{" "}
                <span className="text-white font-semibold">
                  {modalState.bulkAction?.replace("-", " ")}
                </span>{" "}
                {selectedCount} {selectedCount === 1 ? "request" : "requests"}.
              </p>
            </div>
            {modalState.bulkAction === "request-changes" && (
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">
                  Feedback for MR (Required)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Tell the MR what changes are needed..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
            )}
            {modalState.bulkAction !== "request-changes" && (
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => onBulkAction(modalState.bulkAction!)}
                disabled={
                  processing ||
                  (modalState.bulkAction === "request-changes" && !adminNotes)
                }
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-5 py-3.5 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                  modalState.bulkAction === "approve" &&
                    "bg-emerald-600 hover:bg-emerald-700 text-white",
                  modalState.bulkAction === "request-changes" &&
                    "bg-amber-600 hover:bg-amber-700 text-white",
                  modalState.bulkAction === "reject" &&
                    "bg-red-600 hover:bg-red-700 text-white",
                )}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {processing ? "Processing..." : "Confirm"}
              </button>
              <button
                onClick={onClose}
                disabled={processing}
                className="flex-1 px-5 py-3.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
