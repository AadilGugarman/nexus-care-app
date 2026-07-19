// ============================================================================
// Phase 4: Doctor Requests Service
// Service layer for doctor contribution & approval system
// ============================================================================

import { supabase } from "../client";
import type {
  DoctorCreationRequest,
  DoctorCreationRequestInput,
  DoctorCreationRequestWithProfile,
  DoctorChangeRequest,
  DoctorChangeRequestInput,
  DoctorChangeRequestWithDetails,
  DoctorStatusRequest,
  DoctorStatusRequestInput,
  DoctorStatusRequestWithDetails,
  RequestReviewInput,
  RequestStatistics,
  RequestFilters,
  RequestStatus,
  DoctorChanges,
  ReviewHistoryEntry,
} from "@/lib/types/doctor-requests.types";

// Type-safe helpers for new tables (cast to any since tables don't exist in types yet)
const requestTables = {
  creation: () => (supabase as any).from("doctor_creation_requests"),
  change: () => (supabase as any).from("doctor_change_requests"),
  status: () => (supabase as any).from("doctor_status_requests"),
};

// ============================================================================
// Doctor Creation Requests
// ============================================================================

/**
 * Create a new doctor creation request (MR submits new doctor)
 */
export async function createDoctorCreationRequest(
  input: DoctorCreationRequestInput,
  requestedBy: string,
): Promise<DoctorCreationRequest> {
  const { data, error } = await requestTables
    .creation()
    .insert({
      ...input,
      requested_by: requestedBy,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data as DoctorCreationRequest;
}

/**
 * Get all doctor creation requests with filters
 */
export async function getDoctorCreationRequests(
  filters?: RequestFilters,
): Promise<DoctorCreationRequestWithProfile[]> {
  let query = requestTables
    .creation()
    .select(
      `
      *,
      requester:profiles!doctor_creation_requests_requested_by_fkey(full_name, email),
      reviewer:profiles!doctor_creation_requests_reviewed_by_fkey(full_name, email)
    `,
    )
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.requested_by) {
    query = query.eq("requested_by", filters.requested_by);
  }
  if (filters?.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte("created_at", filters.date_to);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Transform the data to flatten profile information
  return ((data as any[]) || []).map((item: any) => ({
    ...item,
    requester_name: item.requester?.full_name || null,
    requester_email: item.requester?.email || null,
    reviewer_name: item.reviewer?.full_name || null,
    reviewer_email: item.reviewer?.email || null,
  }));
}

/**
 * Get single doctor creation request by ID
 */
export async function getDoctorCreationRequestById(
  id: number,
): Promise<DoctorCreationRequestWithProfile | null> {
  const { data, error } = await requestTables
    .creation()
    .select(
      `
      *,
      requester:profiles!doctor_creation_requests_requested_by_fkey(full_name, email),
      reviewer:profiles!doctor_creation_requests_reviewed_by_fkey(full_name, email)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  const result = data as any;
  return {
    ...result,
    requester_name: result.requester?.full_name || null,
    requester_email: result.requester?.email || null,
    reviewer_name: result.reviewer?.full_name || null,
    reviewer_email: result.reviewer?.email || null,
  };
}

/**
 * Approve doctor creation request (Admin creates doctor)
 */
export async function approveDoctorCreationRequest(
  requestId: number,
  reviewedBy: string,
  adminName: string | null,
  adminNotes?: string,
): Promise<{ request: DoctorCreationRequest; doctor_id: number }> {
  // Get the request
  const request = await getDoctorCreationRequestById(requestId);
  if (!request) throw new Error("Request not found");
  if (request.status !== "pending") throw new Error("Request already reviewed");

  // Create the doctor
  const { data: doctor, error: doctorError } = await supabase
    .from("doctors")
    .insert({
      doctor_name: request.name,
      location: request.location || "",
      address: request.address,
      speciality: request.speciality,
      qualification: request.qualification,
      hospital: request.hospital,
      mobile: request.mobile,
      notes: request.notes,
      is_active: true,
    } as any) // Type cast for new field
    .select()
    .single();

  if (doctorError) throw doctorError;
  const doctorResult = doctor as any;

  // Create review history entry
  const reviewHistoryEntry = createReviewHistoryEntry(
    "approve",
    reviewedBy,
    adminName,
    adminNotes || null,
  );

  // Update request as approved
  // Try with review_history first, fallback if column doesn't exist
  let updateData: any = {
    status: "approved",
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    admin_notes: adminNotes,
    created_doctor_id: doctorResult.id,
  };

  // Add review_history if it might exist
  updateData.review_history = [
    ...(request.review_history || []),
    reviewHistoryEntry,
  ];

  const { data: updatedRequest, error: updateError } = await requestTables
    .creation()
    .update(updateData)
    .eq("id", requestId)
    .select()
    .single();

  if (updateError) {
    // If column doesn't exist, try without it
    if (updateError.code === "42703") {
      const { data: fallbackRequest, error: fallbackError } =
        await requestTables
          .creation()
          .update({
            status: "approved",
            reviewed_by: reviewedBy,
            reviewed_at: new Date().toISOString(),
            admin_notes: adminNotes,
            created_doctor_id: doctorResult.id,
          })
          .eq("id", requestId)
          .select()
          .single();

      if (fallbackError) throw fallbackError;
      return { request: fallbackRequest, doctor_id: doctorResult.id };
    }
    throw updateError;
  }

  return { request: updatedRequest, doctor_id: doctorResult.id };
}

/**
 * Reject doctor creation request
 */
export async function rejectDoctorCreationRequest(
  requestId: number,
  reviewedBy: string,
  adminName: string | null,
  adminNotes?: string,
): Promise<DoctorCreationRequest> {
  // Get the request first to get existing review history
  const request = await getDoctorCreationRequestById(requestId);
  if (!request) throw new Error("Request not found");

  const reviewHistoryEntry = createReviewHistoryEntry(
    "reject",
    reviewedBy,
    adminName,
    adminNotes || null,
  );

  // Try with review_history first, fallback if column doesn't exist
  let updateData: any = {
    status: "rejected",
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    admin_notes: adminNotes,
  };

  // Add review_history if it might exist
  updateData.review_history = [
    ...(request.review_history || []),
    reviewHistoryEntry,
  ];

  const { data, error } = await requestTables
    .creation()
    .update(updateData)
    .eq("id", requestId)
    .eq("status", "pending") // Only update if still pending
    .select()
    .single();

  if (error) {
    // If column doesn't exist, try without it
    if (error.code === "42703") {
      const { data: fallbackData, error: fallbackError } = await requestTables
        .creation()
        .update({
          status: "rejected",
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", requestId)
        .eq("status", "pending")
        .select()
        .single();

      if (fallbackError) throw fallbackError;
      return fallbackData;
    }
    throw error;
  }

  return data;
}

// ============================================================================
// Doctor Change Requests
// ============================================================================

/**
 * Create a doctor change request (MR suggests edit)
 */
export async function createDoctorChangeRequest(
  input: DoctorChangeRequestInput,
  requestedBy: string,
): Promise<DoctorChangeRequest> {
  const { data, error } = await requestTables
    .change()
    .insert({
      doctor_id: input.doctor_id,
      changes: input.changes,
      change_reason: input.change_reason,
      requested_by: requestedBy,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data as DoctorChangeRequest;
}

/**
 * Get all doctor change requests with filters
 */
export async function getDoctorChangeRequests(
  filters?: RequestFilters,
): Promise<DoctorChangeRequestWithDetails[]> {
  let query = requestTables
    .change()
    .select(
      `
      *,
      doctor:doctors!doctor_change_requests_doctor_id_fkey(doctor_name),
      requester:profiles!doctor_change_requests_requested_by_fkey(full_name, email),
      reviewer:profiles!doctor_change_requests_reviewed_by_fkey(full_name, email)
    `,
    )
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.requested_by) {
    query = query.eq("requested_by", filters.requested_by);
  }
  if (filters?.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte("created_at", filters.date_to);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data as any[]) || []).map((item: any) => ({
    ...item,
    doctor_name: item.doctor?.doctor_name || "Unknown Doctor",
    requester_name: item.requester?.full_name || null,
    requester_email: item.requester?.email || null,
    reviewer_name: item.reviewer?.full_name || null,
    reviewer_email: item.reviewer?.email || null,
  }));
}

/**
 * Get single doctor change request by ID
 */
export async function getDoctorChangeRequestById(
  id: number,
): Promise<DoctorChangeRequestWithDetails | null> {
  const { data, error } = await requestTables
    .change()
    .select(
      `
      *,
      doctor:doctors!doctor_change_requests_doctor_id_fkey(doctor_name),
      requester:profiles!doctor_change_requests_requested_by_fkey(full_name, email),
      reviewer:profiles!doctor_change_requests_reviewed_by_fkey(full_name, email)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  const result = data as any;
  return {
    ...result,
    doctor_name: result.doctor?.doctor_name || "Unknown Doctor",
    requester_name: result.requester?.full_name || null,
    requester_email: result.requester?.email || null,
    reviewer_name: result.reviewer?.full_name || null,
    reviewer_email: result.reviewer?.email || null,
  };
}

/**
 * Approve doctor change request (Admin applies changes)
 */
export async function approveDoctorChangeRequest(
  requestId: number,
  reviewedBy: string,
  adminName: string | null,
  adminNotes?: string,
): Promise<DoctorChangeRequest> {
  // Get the request
  const request = await getDoctorChangeRequestById(requestId);
  if (!request) throw new Error("Request not found");
  if (request.status !== "pending") throw new Error("Request already reviewed");

  // Apply changes to doctor
  const updates: any = {};
  Object.keys(request.changes).forEach((field) => {
    updates[field] = request.changes[field].new;
  });

  const { error: updateError } = await (supabase as any)
    .from("doctors")
    .update(updates)
    .eq("id", request.doctor_id);

  if (updateError) throw updateError;

  // Create review history entry
  const reviewHistoryEntry = createReviewHistoryEntry(
    "approve",
    reviewedBy,
    adminName,
    adminNotes || null,
  );

  // Mark request as approved - try with review_history first
  let updateData: any = {
    status: "approved",
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    admin_notes: adminNotes,
  };

  // Add review_history if it might exist
  updateData.review_history = [
    ...(request.review_history || []),
    reviewHistoryEntry,
  ];

  const { data, error } = await requestTables
    .change()
    .update(updateData)
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    // If column doesn't exist, try without it
    if (error.code === "42703") {
      const { data: fallbackData, error: fallbackError } = await requestTables
        .change()
        .update({
          status: "approved",
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", requestId)
        .select()
        .single();

      if (fallbackError) throw fallbackError;
      return fallbackData;
    }
    throw error;
  }

  return data;
}

/**
 * Reject doctor change request
 */
export async function rejectDoctorChangeRequest(
  requestId: number,
  reviewedBy: string,
  adminName: string | null,
  adminNotes?: string,
): Promise<DoctorChangeRequest> {
  const request = await getDoctorChangeRequestById(requestId);
  if (!request) throw new Error("Request not found");

  const reviewHistoryEntry = createReviewHistoryEntry(
    "reject",
    reviewedBy,
    adminName,
    adminNotes || null,
  );

  // Try with review_history first
  let updateData: any = {
    status: "rejected",
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    admin_notes: adminNotes,
  };

  // Add review_history if it might exist
  updateData.review_history = [
    ...(request.review_history || []),
    reviewHistoryEntry,
  ];

  const { data, error } = await requestTables
    .change()
    .update(updateData)
    .eq("id", requestId)
    .eq("status", "pending")
    .select()
    .single();

  if (error) {
    // If column doesn't exist, try without it
    if (error.code === "42703") {
      const { data: fallbackData, error: fallbackError } = await requestTables
        .change()
        .update({
          status: "rejected",
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", requestId)
        .eq("status", "pending")
        .select()
        .single();

      if (fallbackError) throw fallbackError;
      return fallbackData;
    }
    throw error;
  }

  return data;
}

// ============================================================================
// Doctor Status Requests
// ============================================================================

/**
 * Create a doctor status request (MR requests inactive/active)
 */
export async function createDoctorStatusRequest(
  input: DoctorStatusRequestInput,
  requestedBy: string,
): Promise<DoctorStatusRequest> {
  const { data, error } = await requestTables
    .status()
    .insert({
      doctor_id: input.doctor_id,
      request_type: input.request_type,
      reason: input.reason,
      requested_by: requestedBy,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data as DoctorStatusRequest;
}

/**
 * Get all doctor status requests with filters
 */
export async function getDoctorStatusRequests(
  filters?: RequestFilters,
): Promise<DoctorStatusRequestWithDetails[]> {
  let query = requestTables
    .status()
    .select(
      `
      *,
      doctor:doctors!doctor_status_requests_doctor_id_fkey(doctor_name, is_active),
      requester:profiles!doctor_status_requests_requested_by_fkey(full_name, email),
      reviewer:profiles!doctor_status_requests_reviewed_by_fkey(full_name, email)
    `,
    )
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.requested_by) {
    query = query.eq("requested_by", filters.requested_by);
  }
  if (filters?.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte("created_at", filters.date_to);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data as any[]) || []).map((item: any) => ({
    ...item,
    doctor_name: item.doctor?.doctor_name || "Unknown Doctor",
    doctor_is_active: item.doctor?.is_active ?? true,
    requester_name: item.requester?.full_name || null,
    requester_email: item.requester?.email || null,
    reviewer_name: item.reviewer?.full_name || null,
    reviewer_email: item.reviewer?.email || null,
  }));
}

/**
 * Get single doctor status request by ID
 */
export async function getDoctorStatusRequestById(
  id: number,
): Promise<DoctorStatusRequestWithDetails | null> {
  const { data, error } = await requestTables
    .status()
    .select(
      `
      *,
      doctor:doctors!doctor_status_requests_doctor_id_fkey(doctor_name, is_active),
      requester:profiles!doctor_status_requests_requested_by_fkey(full_name, email),
      reviewer:profiles!doctor_status_requests_reviewed_by_fkey(full_name, email)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  const result = data as any;
  return {
    ...result,
    doctor_name: result.doctor?.doctor_name || "Unknown Doctor",
    doctor_is_active: result.doctor?.is_active ?? true,
    requester_name: result.requester?.full_name || null,
    requester_email: result.requester?.email || null,
    reviewer_name: result.reviewer?.full_name || null,
    reviewer_email: result.reviewer?.email || null,
  };
}

/**
 * Approve doctor status request (Admin changes status)
 */
export async function approveDoctorStatusRequest(
  requestId: number,
  reviewedBy: string,
  adminName: string | null,
  adminNotes?: string,
): Promise<DoctorStatusRequest> {
  // Get the request
  const request = await getDoctorStatusRequestById(requestId);
  if (!request) throw new Error("Request not found");
  if (request.status !== "pending") throw new Error("Request already reviewed");

  // Update doctor status
  const newStatus = request.request_type === "mark_inactive" ? false : true;
  const { error: updateError } = await (supabase as any)
    .from("doctors")
    .update({ is_active: newStatus })
    .eq("id", request.doctor_id);

  if (updateError) throw updateError;

  // Create review history entry
  const reviewHistoryEntry = createReviewHistoryEntry(
    "approve",
    reviewedBy,
    adminName,
    adminNotes || null,
  );

  // Mark request as approved - try with review_history first
  let updateData: any = {
    status: "approved",
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    admin_notes: adminNotes,
  };

  // Add review_history if it might exist
  updateData.review_history = [
    ...(request.review_history || []),
    reviewHistoryEntry,
  ];

  const { data, error } = await requestTables
    .status()
    .update(updateData)
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    // If column doesn't exist, try without it
    if (error.code === "42703") {
      const { data: fallbackData, error: fallbackError } = await requestTables
        .status()
        .update({
          status: "approved",
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", requestId)
        .select()
        .single();

      if (fallbackError) throw fallbackError;
      return fallbackData;
    }
    throw error;
  }

  return data;
}

/**
 * Reject doctor status request
 */
export async function rejectDoctorStatusRequest(
  requestId: number,
  reviewedBy: string,
  adminName: string | null,
  adminNotes?: string,
): Promise<DoctorStatusRequest> {
  const request = await getDoctorStatusRequestById(requestId);
  if (!request) throw new Error("Request not found");

  const reviewHistoryEntry = createReviewHistoryEntry(
    "reject",
    reviewedBy,
    adminName,
    adminNotes || null,
  );

  // Try with review_history first
  let updateData: any = {
    status: "rejected",
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    admin_notes: adminNotes,
  };

  // Add review_history if it might exist
  updateData.review_history = [
    ...(request.review_history || []),
    reviewHistoryEntry,
  ];

  const { data, error } = await requestTables
    .status()
    .update(updateData)
    .eq("id", requestId)
    .eq("status", "pending")
    .select()
    .single();

  if (error) {
    // If column doesn't exist, try without it
    if (error.code === "42703") {
      const { data: fallbackData, error: fallbackError } = await requestTables
        .status()
        .update({
          status: "rejected",
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", requestId)
        .eq("status", "pending")
        .select()
        .single();

      if (fallbackError) throw fallbackError;
      return fallbackData;
    }
    throw error;
  }

  return data;
}

// ============================================================================
// Statistics & Summary
// ============================================================================

/**
 * Get request statistics for dashboard
 */
export async function getRequestStatistics(): Promise<RequestStatistics> {
  // Parallel queries for better performance
  const [creationStats, changeStats, statusStats] = await Promise.all([
    requestTables.creation().select("status", { count: "exact", head: true }),
    requestTables.change().select("status", { count: "exact", head: true }),
    requestTables.status().select("status", { count: "exact", head: true }),
  ]);

  // Get counts by status for each type
  const getStatusCounts = async (table: "creation" | "change" | "status") => {
    const tableRef = requestTables[table];
    const [pending, approved, rejected, total] = await Promise.all([
      tableRef()
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      tableRef()
        .select("*", { count: "exact", head: true })
        .eq("status", "approved"),
      tableRef()
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected"),
      tableRef().select("*", { count: "exact", head: true }),
    ]);

    return {
      pending: pending.count || 0,
      approved: approved.count || 0,
      rejected: rejected.count || 0,
      total: total.count || 0,
    };
  };

  const [creation_requests, change_requests, status_requests] =
    await Promise.all([
      getStatusCounts("creation"),
      getStatusCounts("change"),
      getStatusCounts("status"),
    ]);

  return {
    creation_requests,
    change_requests,
    status_requests,
    total_pending:
      creation_requests.pending +
      change_requests.pending +
      status_requests.pending,
  };
}

// ============================================================================
// Edit & Approve Functions
// ============================================================================

// Helper to create review history entry
function createReviewHistoryEntry(
  action: ReviewHistoryEntry["action"],
  adminId: string,
  adminName: string | null,
  notes: string | null,
  editedFields?: DoctorChanges,
): ReviewHistoryEntry {
  return {
    action,
    admin_id: adminId,
    admin_name: adminName,
    timestamp: new Date().toISOString(),
    notes,
    edited_fields: editedFields,
  };
}

/**
 * Edit and approve a doctor creation request
 */
export async function editAndApproveDoctorCreationRequest(
  requestId: number,
  reviewedBy: string,
  adminName: string | null,
  editedFields: DoctorChanges,
  adminNotes?: string,
): Promise<{ request: DoctorCreationRequest; doctor_id: number }> {
  // Get the request
  const request = await getDoctorCreationRequestById(requestId);
  if (!request) throw new Error("Request not found");
  if (request.status !== "pending") throw new Error("Request already reviewed");

  // Create updated doctor data by applying edits to request data
  const updatedDoctorData: any = {
    doctor_name: request.name,
    location: request.location,
    address: request.address,
    speciality: request.speciality,
    qualification: request.qualification,
    hospital: request.hospital,
    mobile: request.mobile,
    notes: request.notes,
    is_active: true,
  };

  // Apply edits (map creation request fields to doctor table fields)
  Object.keys(editedFields).forEach((field) => {
    const doctorField = field === "name" ? "doctor_name" : field;
    updatedDoctorData[doctorField] = editedFields[field].new;
  });

  // Create the doctor
  const { data: doctor, error: doctorError } = await supabase
    .from("doctors")
    .insert(updatedDoctorData)
    .select()
    .single();

  if (doctorError) throw doctorError;
  const doctorResult = doctor as any;

  // Create review history entry
  const reviewHistoryEntry = createReviewHistoryEntry(
    "edit_and_approve",
    reviewedBy,
    adminName,
    adminNotes || null,
    editedFields,
  );

  // Update request
  const { data: updatedRequest, error: updateError } = await requestTables
    .creation()
    .update({
      status: "approved",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
      created_doctor_id: doctorResult.id,
      review_history: [...(request.review_history || []), reviewHistoryEntry],
    })
    .eq("id", requestId)
    .select()
    .single();

  if (updateError) throw updateError;

  return { request: updatedRequest, doctor_id: doctorResult.id };
}

/**
 * Edit and approve a doctor change request
 */
export async function editAndApproveDoctorChangeRequest(
  requestId: number,
  reviewedBy: string,
  adminName: string | null,
  editedFields: DoctorChanges,
  adminNotes?: string,
): Promise<DoctorChangeRequest> {
  // Get the request
  const request = await getDoctorChangeRequestById(requestId);
  if (!request) throw new Error("Request not found");
  if (request.status !== "pending") throw new Error("Request already reviewed");

  // Build updates by combining request changes and admin edits
  const updates: any = {};

  // First apply the request's changes
  Object.keys(request.changes).forEach((field) => {
    updates[field] = request.changes[field].new;
  });

  // Then apply admin edits (overriding request changes if needed)
  Object.keys(editedFields).forEach((field) => {
    updates[field] = editedFields[field].new;
  });

  // Apply updates to doctor
  const { error: updateError } = await (supabase as any)
    .from("doctors")
    .update(updates)
    .eq("id", request.doctor_id);

  if (updateError) throw updateError;

  // Create review history entry
  const reviewHistoryEntry = createReviewHistoryEntry(
    "edit_and_approve",
    reviewedBy,
    adminName,
    adminNotes || null,
    editedFields,
  );

  // Mark request as approved
  const { data, error } = await requestTables
    .change()
    .update({
      status: "approved",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
      review_history: [...(request.review_history || []), reviewHistoryEntry],
    })
    .eq("id", requestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// Request Changes Functions
// ============================================================================

/**
 * Request changes for a doctor creation request
 */
export async function requestChangesForDoctorCreationRequest(
  requestId: number,
  reviewedBy: string,
  adminName: string | null,
  adminNotes: string,
): Promise<DoctorCreationRequest> {
  const request = await getDoctorCreationRequestById(requestId);
  if (!request) throw new Error("Request not found");
  if (request.status !== "pending") throw new Error("Request already reviewed");

  const reviewHistoryEntry = createReviewHistoryEntry(
    "request_changes",
    reviewedBy,
    adminName,
    adminNotes,
  );

  const { data, error } = await requestTables
    .creation()
    .update({
      status: "requested_changes",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
      review_history: [...(request.review_history || []), reviewHistoryEntry],
    })
    .eq("id", requestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Request changes for a doctor change request
 */
export async function requestChangesForDoctorChangeRequest(
  requestId: number,
  reviewedBy: string,
  adminName: string | null,
  adminNotes: string,
): Promise<DoctorChangeRequest> {
  const request = await getDoctorChangeRequestById(requestId);
  if (!request) throw new Error("Request not found");
  if (request.status !== "pending") throw new Error("Request already reviewed");

  const reviewHistoryEntry = createReviewHistoryEntry(
    "request_changes",
    reviewedBy,
    adminName,
    adminNotes,
  );

  const { data, error } = await requestTables
    .change()
    .update({
      status: "requested_changes",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
      review_history: [...(request.review_history || []), reviewHistoryEntry],
    })
    .eq("id", requestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Request changes for a doctor status request
 */
export async function requestChangesForDoctorStatusRequest(
  requestId: number,
  reviewedBy: string,
  adminName: string | null,
  adminNotes: string,
): Promise<DoctorStatusRequest> {
  const request = await getDoctorStatusRequestById(requestId);
  if (!request) throw new Error("Request not found");
  if (request.status !== "pending") throw new Error("Request already reviewed");

  const reviewHistoryEntry = createReviewHistoryEntry(
    "request_changes",
    reviewedBy,
    adminName,
    adminNotes,
  );

  const { data, error } = await requestTables
    .status()
    .update({
      status: "requested_changes",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
      review_history: [...(request.review_history || []), reviewHistoryEntry],
    })
    .eq("id", requestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
