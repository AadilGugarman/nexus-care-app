// ============================================================================
// Phase 5: Analytics Service
// Admin-only service for viewing multi-MR statistics and data
// ============================================================================

import { supabase } from '../client';
import type { Profile } from '../database.types';

/**
 * Analytics data types
 */

export interface MRStatistics {
  user_id: string;
  full_name: string | null;
  email: string;
  route_count: number;
  active_route_count: number;
  completed_route_count: number;
  total_visit_count: number;
  visited_doctor_count: number;
  assigned_doctor_count: number;
  last_activity: string | null;
  created_at: string;
}

export interface SystemStatistics {
  total_mrs: number;
  active_mrs: number; // MRs with activity in last 30 days
  total_routes: number;
  total_visits: number;
  total_doctors: number;
  total_active_doctors: number;
  average_routes_per_mr: number;
  average_visits_per_mr: number;
}

export interface DoctorUsageStatistics {
  doctor_id: number;
  doctor_name: string;
  location: string;
  used_by_count: number; // How many MRs have this doctor in routes/assignments
  total_visits: number; // Total visits across all MRs
  users: Array<{
    user_id: string;
    full_name: string | null;
    email: string;
    visit_count: number;
  }>;
}

export interface RouteAnalytics {
  route_id: string;
  route_name: string;
  location: string;
  user_id: string;
  full_name: string | null;
  email: string;
  doctor_count: number;
  completed_at: string | null;
  cycle_days: number;
  created_at: string;
}

// ============================================================================
// Analytics Service Class
// ============================================================================

export class AnalyticsService {
  /**
   * Get statistics for all MRs
   * Admin only
   */
  static async getMRStatistics(): Promise<MRStatistics[]> {
    // Get all MR users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .eq('role', 'mr')
      .order('full_name');

    if (profileError) throw profileError;
    if (!profiles || profiles.length === 0) return [];

    // For each MR, get their statistics
    const statistics: MRStatistics[] = [];

    for (const profileRow of profiles) {
      // Type assertion for profile data
      const profile = profileRow as {
        id: string;
        full_name: string | null;
        email: string;
        role: string;
        created_at: string;
      };

      // Count routes
      const { data: routes } = await supabase
        .from('user_routes')
        .select('id, completed_at, updated_at')
        .eq('user_id', profile.id);

      const routeCount = routes?.length || 0;
      const activeRoutes = routes?.filter((r: any) => !r.completed_at) || [];
      const completedRoutes = routes?.filter((r: any) => r.completed_at) || [];

      // Count visits
      const { data: visits } = await supabase
        .from('doctor_visits')
        .select('id, is_visited')
        .eq('user_id', profile.id);

      const totalVisitCount = visits?.length || 0;
      const visitedDoctorCount = visits?.filter((v: any) => v.is_visited).length || 0;

      // Count assigned doctors
      const { data: assignments } = await supabase
        .from('doctor_day_assignments')
        .select('doctor_id')
        .eq('user_id', profile.id);

      const uniqueDoctorIds = new Set(assignments?.map((a: any) => a.doctor_id) || []);
      const assignedDoctorCount = uniqueDoctorIds.size;

      // Get last activity date (most recent: route update, visit update, or assignment)
      const routeDates = routes?.map((r: any) => r.updated_at).filter(Boolean) || [];
      const lastActivity = routeDates.length > 0
        ? routeDates.sort().reverse()[0]
        : null;

      statistics.push({
        user_id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        route_count: routeCount,
        active_route_count: activeRoutes.length,
        completed_route_count: completedRoutes.length,
        total_visit_count: totalVisitCount,
        visited_doctor_count: visitedDoctorCount,
        assigned_doctor_count: assignedDoctorCount,
        last_activity: lastActivity,
        created_at: profile.created_at,
      });
    }

    return statistics;
  }

  /**
   * Get system-wide statistics
   * Admin only
   */
  static async getSystemStatistics(): Promise<SystemStatistics> {
    // Count MRs
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('role', 'mr');

    const totalMrs = profiles?.length || 0;

    // Count active MRs (activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    const { data: recentRoutes } = await supabase
      .from('user_routes')
      .select('user_id')
      .gte('updated_at', thirtyDaysAgoStr);

    const activeMrIds = new Set(recentRoutes?.map((r: any) => r.user_id) || []);
    const activeMrs = activeMrIds.size;

    // Count routes
    const { data: routes } = await supabase
      .from('user_routes')
      .select('id');

    const totalRoutes = routes?.length || 0;

    // Count visits
    const { data: visits } = await supabase
      .from('doctor_visits')
      .select('id');

    const totalVisits = visits?.length || 0;

    // Count doctors
    const { data: doctors } = await supabase
      .from('doctors')
      .select('id, is_active');

    const totalDoctors = doctors?.length || 0;
    const totalActiveDoctors = doctors?.filter((d: any) => d.is_active).length || 0;

    return {
      total_mrs: totalMrs,
      active_mrs: activeMrs,
      total_routes: totalRoutes,
      total_visits: totalVisits,
      total_doctors: totalDoctors,
      total_active_doctors: totalActiveDoctors,
      average_routes_per_mr: totalMrs > 0 ? Math.round((totalRoutes / totalMrs) * 10) / 10 : 0,
      average_visits_per_mr: totalMrs > 0 ? Math.round((totalVisits / totalMrs) * 10) / 10 : 0,
    };
  }

  /**
   * Get doctor usage statistics
   * Shows which doctors are used by which MRs
   * Admin only
   */
  static async getDoctorUsageStatistics(): Promise<DoctorUsageStatistics[]> {
    // Get all doctors
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('id, doctor_name, location, is_active')
      .eq('is_active', true)
      .order('doctor_name');

    if (error) throw error;
    if (!doctors) return [];

    const statistics: DoctorUsageStatistics[] = [];

    for (const doctorRow of doctors) {
      const doctor = doctorRow as {
        id: number;
        doctor_name: string;
        location: string;
        is_active: boolean;
      };

      // Find all MRs who have this doctor in routes
      const { data: routeDoctors } = await supabase
        .from('route_doctors')
        .select('route_id')
        .eq('doctor_id', doctor.id);

      const routeIds = routeDoctors?.map((rd: any) => rd.route_id) || [];

      const { data: routes } = routeIds.length > 0
        ? await supabase
            .from('user_routes')
            .select('user_id')
            .in('id', routeIds)
        : { data: [] };

      // Find all MRs who have this doctor in assignments
      const { data: assignments } = await supabase
        .from('doctor_day_assignments')
        .select('user_id')
        .eq('doctor_id', doctor.id);

      // Combine unique user IDs
      const userIds = new Set([
        ...(routes?.map((r: any) => r.user_id) || []),
        ...(assignments?.map((a: any) => a.user_id) || []),
      ]);

      if (userIds.size === 0) continue;

      // Get user details and visit counts
      const users = [];
      let totalVisits = 0;

      for (const userId of userIds) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', userId)
          .single();

        const { data: visits } = await supabase
          .from('doctor_visits')
          .select('id, is_visited')
          .eq('user_id', userId)
          .eq('doctor_id', doctor.id);

        const visitCount = visits?.filter((v: any) => v.is_visited).length || 0;
        totalVisits += visitCount;

        if (profile) {
          const profileTyped = profile as { id: string; full_name: string | null; email: string };
          users.push({
            user_id: userId,
            full_name: profileTyped.full_name,
            email: profileTyped.email,
            visit_count: visitCount,
          });
        }
      }

      statistics.push({
        doctor_id: doctor.id,
        doctor_name: doctor.doctor_name,
        location: doctor.location,
        used_by_count: userIds.size,
        total_visits: totalVisits,
        users: users.sort((a, b) => b.visit_count - a.visit_count),
      });
    }

    // Sort by usage count descending
    return statistics.sort((a, b) => b.used_by_count - a.used_by_count);
  }

  /**
   * Get all routes across all MRs
   * Admin only
   */
  static async getAllRoutesWithDetails(): Promise<RouteAnalytics[]> {
    // Get all routes with user profiles
    const { data, error } = await supabase
      .from('user_routes')
      .select(`
        id,
        name,
        location,
        user_id,
        completed_at,
        cycle_days,
        created_at,
        profiles!user_routes_user_id_fkey (full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    // Get doctor count for each route
    const routes: RouteAnalytics[] = [];

    for (const routeRow of data) {
      const route = routeRow as any; // Type assertion for complex joined query
      
      const { data: routeDoctors } = await supabase
        .from('route_doctors')
        .select('doctor_id')
        .eq('route_id', route.id);

      const profile = route.profiles;

      routes.push({
        route_id: route.id,
        route_name: route.name,
        location: route.location,
        user_id: route.user_id,
        full_name: profile?.full_name || null,
        email: profile?.email || '',
        doctor_count: routeDoctors?.length || 0,
        completed_at: route.completed_at,
        cycle_days: route.cycle_days,
        created_at: route.created_at,
      });
    }

    return routes;
  }

  /**
   * Get visit history for specific doctor across all MRs
   * Admin only
   */
  static async getDoctorVisitHistory(doctorId: number): Promise<Array<{
    user_id: string;
    full_name: string | null;
    email: string;
    last_visit_date: string | null;
    next_due_date: string | null;
    frequency_days: number;
    is_visited: boolean;
  }>> {
    const { data, error } = await supabase
      .from('doctor_visits')
      .select(`
        user_id,
        last_visit_date,
        next_due_date,
        frequency_days,
        is_visited,
        profiles!doctor_visits_user_id_fkey (full_name, email)
      `)
      .eq('doctor_id', doctorId);

    if (error) throw error;
    if (!data) return [];

    return data.map((visit: any) => ({
      user_id: visit.user_id,
      full_name: visit.profiles?.full_name || null,
      email: visit.profiles?.email || '',
      last_visit_date: visit.last_visit_date,
      next_due_date: visit.next_due_date,
      frequency_days: visit.frequency_days,
      is_visited: visit.is_visited,
    }));
  }

  /**
   * Get user's full profile with statistics
   * Admin only
   */
  static async getUserProfile(userId: string): Promise<MRStatistics | null> {
    const stats = await this.getMRStatistics();
    return stats.find(s => s.user_id === userId) || null;
  }
}

