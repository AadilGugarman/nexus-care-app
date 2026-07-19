import { supabase } from "../client";

// ============================================================================
// TYPES
// ============================================================================

export type UserStatus = "pending" | "active" | "disabled" | "suspended";
export type UserRole = "mr" | "admin" | "public";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: UserStatus;
  territory: string[]; // Array of locations
  phone_number: string | null;
  notes: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
}

export interface UserActivityStats {
  user_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: UserStatus;
  territory: string[];
  last_login: string | null;
  join_date: string;

  // Doctor contributions
  doctors_added: number;
  doctors_edited: number;

  // Request statistics
  pending_creation_requests: number;
  approved_creation_requests: number;
  rejected_creation_requests: number;
  total_creation_requests: number;

  pending_change_requests: number;
  approved_change_requests: number;
  rejected_change_requests: number;
  total_change_requests: number;

  pending_status_requests: number;
  approved_status_requests: number;
  rejected_status_requests: number;
  total_status_requests: number;

  // Totals
  total_requests: number;
  total_pending_requests: number;
  total_approved_requests: number;
  total_rejected_requests: number;

  // Visits
  total_visits: number;
  visits_this_month: number;
}

export interface UpdateUserData {
  full_name?: string;
  role?: UserRole;
  status?: UserStatus;
  territory?: string[];
  phone_number?: string;
  notes?: string;
}

// ============================================================================
// USER MANAGEMENT SERVICE
// ============================================================================

export const UserManagementService = {
  // Get all users (excluding deleted)
  async getAllUsers(): Promise<UserProfile[]> {
    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Try with is_deleted filter if column exists, otherwise fallback
    try {
      const { data, error } = await query.eq("is_deleted", false);
      if (error) {
        // If is_deleted column doesn't exist, fetch all and filter in memory
        if (error.code === "42703") {
          const { data: allData, error: fallbackError } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });
          if (fallbackError) throw fallbackError;
          return (allData || []).filter((u: any) => !u.is_deleted);
        }
        throw error;
      }
      return data || [];
    } catch (err: any) {
      // Fallback if column doesn't exist
      if (err?.code === "42703") {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).filter((u: any) => !u.is_deleted);
      }
      throw err;
    }
  },

  // Get all users including deleted
  async getAllUsersIncludingDeleted(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get user by ID
  async getUserById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Get users by role
  async getUsersByRole(role: UserRole): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", role)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42703") {
          // is_deleted column doesn't exist, fetch and filter
          const { data: allData, error: fallbackError } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", role)
            .order("created_at", { ascending: false });
          if (fallbackError) throw fallbackError;
          return (allData || []).filter((u: any) => !u.is_deleted);
        }
        throw error;
      }
      return data || [];
    } catch (err: any) {
      if (err?.code === "42703") {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", role)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).filter((u: any) => !u.is_deleted);
      }
      throw err;
    }
  },

  // Get users by status
  async getUsersByStatus(status: UserStatus): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("status", status)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42703") {
          // is_deleted column doesn't exist, fetch and filter
          const { data: allData, error: fallbackError } = await supabase
            .from("profiles")
            .select("*")
            .eq("status", status)
            .order("created_at", { ascending: false });
          if (fallbackError) throw fallbackError;
          return (allData || []).filter((u: any) => !u.is_deleted);
        }
        throw error;
      }
      return data || [];
    } catch (err: any) {
      if (err?.code === "42703") {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("status", status)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).filter((u: any) => !u.is_deleted);
      }
      throw err;
    }
  },

  // Update user
  async updateUser(
    userId: string,
    updates: UpdateUserData,
  ): Promise<UserProfile> {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .update({
        full_name: updates.full_name,
        role: updates.role,
        status: updates.status,
        territory: updates.territory,
        phone_number: updates.phone_number,
        notes: updates.notes,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  // Update user status
  async updateUserStatus(
    userId: string,
    status: UserStatus,
  ): Promise<UserProfile> {
    return this.updateUser(userId, { status });
  },

  // Update user role
  async updateUserRole(userId: string, role: UserRole): Promise<UserProfile> {
    return this.updateUser(userId, { role });
  },

  // Update user territory
  async updateUserTerritory(
    userId: string,
    territory: string[],
  ): Promise<UserProfile> {
    return this.updateUser(userId, { territory });
  },

  // Add location to user territory
  async addLocationToTerritory(
    userId: string,
    location: string,
  ): Promise<UserProfile> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User not found");

    const territory = user.territory || [];
    if (!territory.includes(location)) {
      territory.push(location);
      return this.updateUserTerritory(userId, territory);
    }

    return user;
  },

  // Remove location from user territory
  async removeLocationFromTerritory(
    userId: string,
    location: string,
  ): Promise<UserProfile> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User not found");

    const territory = (user.territory || []).filter((loc) => loc !== location);
    return this.updateUserTerritory(userId, territory);
  },

  // Soft delete user
  async softDeleteUser(userId: string): Promise<void> {
    const { error } = await (supabase as any).rpc("soft_delete_user", {
      p_user_id: userId,
    });

    if (error) throw error;
  },

  // Restore deleted user
  async restoreUser(userId: string): Promise<void> {
    const { error } = await (supabase as any).rpc("restore_user", {
      p_user_id: userId,
    });

    if (error) throw error;
  },

  // Update last login
  async updateLastLogin(userId: string): Promise<void> {
    const { error } = await (supabase as any).rpc("update_user_last_login", {
      p_user_id: userId,
    });

    if (error) throw error;
  },

  // Get user activity statistics
  async getUserActivityStats(): Promise<UserActivityStats[]> {
    try {
      // Try to refresh materialized view first
      await this.refreshActivityStats();

      const { data, error } = await supabase
        .from("user_activity_stats")
        .select("*")
        .order("join_date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Fallback: Calculate stats on-demand if materialized view doesn't exist
      console.warn(
        "Materialized view not available, calculating stats on-demand:",
        error,
      );
      return this.calculateUserActivityStatsOnDemand();
    }
  },

  // Fallback method to calculate stats without materialized view
  async calculateUserActivityStatsOnDemand(): Promise<UserActivityStats[]> {
    const users = await this.getAllUsers();

    const statsPromises = users.map(async (user) => {
      // Get request counts
      const [creationReqs, changeReqs, statusReqs] = await Promise.all([
        supabase
          .from("doctor_creation_requests")
          .select("status", { count: "exact" })
          .eq("requested_by", user.id),
        supabase
          .from("doctor_change_requests")
          .select("status", { count: "exact" })
          .eq("requested_by", user.id),
        supabase
          .from("doctor_status_requests")
          .select("status", { count: "exact" })
          .eq("requested_by", user.id),
      ]);

      return {
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        territory: user.territory || [],
        last_login: user.last_login,
        join_date: user.created_at,

        doctors_added: creationReqs.count || 0,
        doctors_edited: 0,

        pending_creation_requests: 0,
        approved_creation_requests: 0,
        rejected_creation_requests: 0,
        total_creation_requests: creationReqs.count || 0,

        pending_change_requests: 0,
        approved_change_requests: 0,
        rejected_change_requests: 0,
        total_change_requests: changeReqs.count || 0,

        pending_status_requests: 0,
        approved_status_requests: 0,
        rejected_status_requests: 0,
        total_status_requests: statusReqs.count || 0,

        total_requests:
          (creationReqs.count || 0) +
          (changeReqs.count || 0) +
          (statusReqs.count || 0),
        total_pending_requests: 0,
        total_approved_requests: 0,
        total_rejected_requests: 0,

        total_visits: 0,
        visits_this_month: 0,
      };
    });

    return Promise.all(statsPromises);
  },

  // Get activity stats for specific user
  async getUserActivityStatsById(
    userId: string,
  ): Promise<UserActivityStats | null> {
    try {
      // Refresh materialized view first
      await this.refreshActivityStats();

      const { data, error } = await supabase
        .from("user_activity_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      // Fallback: Calculate on-demand
      console.warn(
        "Materialized view not available, calculating stats on-demand:",
        error,
      );
      const allStats = await this.calculateUserActivityStatsOnDemand();
      return allStats.find((stat) => stat.user_id === userId) || null;
    }
  },

  // Refresh activity statistics
  async refreshActivityStats(): Promise<void> {
    try {
      const { error } = await (supabase as any).rpc(
        "refresh_user_activity_stats",
      );
      if (error) throw error;
    } catch (error) {
      // Silently fail if materialized view or function doesn't exist
      // The app will use fallback on-demand calculation
      console.warn(
        "Could not refresh activity stats (materialized view may not exist):",
        error,
      );
    }
  },

  // Get users with pending requests
  async getUsersWithPendingRequests(): Promise<UserActivityStats[]> {
    try {
      await this.refreshActivityStats();

      const { data, error } = await supabase
        .from("user_activity_stats")
        .select("*")
        .gt("total_pending_requests", 0)
        .order("total_pending_requests", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Fallback: Calculate on-demand and filter
      console.warn("Using fallback for pending requests stats");
      const allStats = await this.calculateUserActivityStatsOnDemand();
      return allStats
        .filter((stat) => stat.total_pending_requests > 0)
        .sort((a, b) => b.total_pending_requests - a.total_pending_requests);
    }
  },

  // Get active MRs (for dashboard)
  async getActiveMRs(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "mr")
      .eq("status", "active")
      .eq("is_deleted", false)
      .order("last_login", { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data || [];
  },

  // Get inactive MRs (no login in last 30 days)
  async getInactiveMRs(): Promise<UserProfile[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "mr")
      .eq("status", "active")
      .eq("is_deleted", false)
      .or(`last_login.is.null,last_login.lt.${thirtyDaysAgo.toISOString()}`)
      .order("last_login", { ascending: true, nullsFirst: true });

    if (error) throw error;
    return data || [];
  },

  // Get user summary statistics
  async getUserSummaryStats() {
    const users = await this.getAllUsers();

    const summary = {
      total: users.length,
      byRole: {
        admin: users.filter((u) => u.role === "admin").length,
        mr: users.filter((u) => u.role === "mr").length,
        public: users.filter((u) => u.role === "public").length,
      },
      byStatus: {
        active: users.filter((u) => u.status === "active").length,
        pending: users.filter((u) => u.status === "pending").length,
        disabled: users.filter((u) => u.status === "disabled").length,
        suspended: users.filter((u) => u.status === "suspended").length,
      },
    };

    return summary;
  },

  // Search users
  async searchUsers(query: string): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_deleted", false)
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
