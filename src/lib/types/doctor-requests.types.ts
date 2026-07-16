// ============================================================================
// Phase 4: Doctor Request Types
// TypeScript types for doctor contribution & approval system
// ============================================================================

export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type StatusRequestType = 'mark_inactive' | 'mark_active';

// ============================================================================
// Doctor Creation Request
// ============================================================================

export interface DoctorCreationRequest {
  id: number;
  
  // Request metadata
  requested_by: string; // UUID
  requested_at: string; // ISO timestamp
  reviewed_by: string | null; // UUID
  reviewed_at: string | null; // ISO timestamp
  status: RequestStatus;
  admin_notes: string | null;
  
  // Proposed doctor data (matching actual doctors table)
  name: string;                    // doctor_name
  location: string | null;         // location
  address: string | null;          // address
  speciality: string | null;       // speciality
  qualification: string | null;    // qualification
  hospital: string | null;         // hospital
  mobile: string | null;           // mobile
  notes: string | null;            // notes
  
  // Audit trail
  created_at: string;
  updated_at: string;
  
  // Result tracking
  created_doctor_id: number | null;
}

// Form data for creating a new doctor request
export interface DoctorCreationRequestInput {
  name: string;
  location?: string;
  address?: string;
  speciality?: string;
  qualification?: string;
  hospital?: string;
  mobile?: string;
  notes?: string;
}

// ============================================================================
// Doctor Change Request
// ============================================================================

export interface FieldChange {
  old: string | null;
  new: string | null;
}

export interface DoctorChanges {
  [fieldName: string]: FieldChange;
}

export interface DoctorChangeRequest {
  id: number;
  
  // Request metadata
  doctor_id: number;
  requested_by: string; // UUID
  requested_at: string; // ISO timestamp
  reviewed_by: string | null; // UUID
  reviewed_at: string | null; // ISO timestamp
  status: RequestStatus;
  admin_notes: string | null;
  
  // Changed fields
  changes: DoctorChanges;
  change_reason: string | null;
  
  // Audit trail
  created_at: string;
  updated_at: string;
}

// Form data for creating a change request
export interface DoctorChangeRequestInput {
  doctor_id: number;
  changes: DoctorChanges;
  change_reason?: string;
}

// ============================================================================
// Doctor Status Request
// ============================================================================

export interface DoctorStatusRequest {
  id: number;
  
  // Request metadata
  doctor_id: number;
  requested_by: string; // UUID
  requested_at: string; // ISO timestamp
  reviewed_by: string | null; // UUID
  reviewed_at: string | null; // ISO timestamp
  status: RequestStatus;
  admin_notes: string | null;
  
  // Request details
  request_type: StatusRequestType;
  reason: string;
  
  // Audit trail
  created_at: string;
  updated_at: string;
}

// Form data for creating a status request
export interface DoctorStatusRequestInput {
  doctor_id: number;
  request_type: StatusRequestType;
  reason: string;
}

// ============================================================================
// Extended Types with Related Data
// ============================================================================

// Doctor creation request with requester profile
export interface DoctorCreationRequestWithProfile extends DoctorCreationRequest {
  requester_name: string | null;
  requester_email: string | null;
  reviewer_name: string | null;
  reviewer_email: string | null;
}

// Doctor change request with doctor and profile info
export interface DoctorChangeRequestWithDetails extends DoctorChangeRequest {
  doctor_name: string;
  requester_name: string | null;
  requester_email: string | null;
  reviewer_name: string | null;
  reviewer_email: string | null;
}

// Doctor status request with doctor and profile info
export interface DoctorStatusRequestWithDetails extends DoctorStatusRequest {
  doctor_name: string;
  doctor_is_active: boolean;
  requester_name: string | null;
  requester_email: string | null;
  reviewer_name: string | null;
  reviewer_email: string | null;
}

// ============================================================================
// Request Review Actions
// ============================================================================

export interface RequestReviewInput {
  request_id: number;
  action: 'approve' | 'reject';
  admin_notes?: string;
  reviewed_by: string; // UUID of admin
}

// ============================================================================
// Request Statistics
// ============================================================================

export interface RequestStatistics {
  creation_requests: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  change_requests: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  status_requests: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  total_pending: number;
}

// ============================================================================
// Filter Options
// ============================================================================

export interface RequestFilters {
  status?: RequestStatus | 'all';
  requested_by?: string; // UUID
  date_from?: string; // ISO date
  date_to?: string; // ISO date
}
