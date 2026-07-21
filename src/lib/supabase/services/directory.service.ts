// ============================================================================
// Phase 6: Directory Service
// Public doctor directory and analytics tracking
// ============================================================================

import { supabase } from '../client';

/**
 * Public directory types
 */

export interface PublicDoctor {
  id: number;
  doctor_name: string;
  speciality: string | null;
  location: string;
  address: string | null;
  mobile: string | null;
  hospital: string | null;
  qualification: string | null;
}

export interface DirectoryFilters {
  search?: string;
  speciality?: string;
  location?: string;
}

export interface DirectoryAnalytics {
  total_views: number;
  profile_views: number;
  unique_doctors_viewed: number;
  top_specialities: Array<{
    speciality: string;
    count: number;
  }>;
  top_locations: Array<{
    location: string;
    count: number;
  }>;
}

export interface MostViewedDoctor {
  doctor_id: number;
  doctor_name: string;
  speciality: string | null;
  location: string;
  view_count: number;
}

// ============================================================================
// Directory Service Class
// ============================================================================

export class DirectoryService {
  /**
   * Get all public doctors (for directory listing)
   * Only returns doctors with public_visible = true
   */
  static async getPublicDoctors(filters?: DirectoryFilters): Promise<PublicDoctor[]> {
    let query = supabase
      .from('doctors')
      .select('id, doctor_name, speciality, location, address, mobile, hospital, qualification')
      .eq('public_visible', true)
      .eq('is_active', true)
      .order('doctor_name');

    // Apply search filter
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`doctor_name.ilike.${searchTerm},location.ilike.${searchTerm},speciality.ilike.${searchTerm}`);
    }

    // Apply speciality filter
    if (filters?.speciality) {
      query = query.eq('speciality', filters.speciality);
    }

    // Apply location filter
    if (filters?.location) {
      query = query.eq('location', filters.location);
    }

    const { data, error } = await query;

    if (error) {
      console.error('getPublicDoctors error:', error);
      throw error;
    }
    
    console.log(`✅ getPublicDoctors returned ${data?.length || 0} doctors`);
    
    return (data as any[])?.map(d => ({
      id: d.id,
      doctor_name: d.doctor_name,
      speciality: d.speciality,
      location: d.location,
      address: d.address,
      mobile: d.mobile,
      hospital: d.hospital,
      qualification: d.qualification,
    })) || [];
  }

  /**
   * Get single public doctor by ID
   * Only returns if public_visible and is_active
   */
  static async getPublicDoctorById(doctorId: number): Promise<PublicDoctor | null> {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, doctor_name, speciality, location, address, mobile, hospital, qualification')
      .eq('id', doctorId)
      .eq('public_visible', true)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: (data as any).id,
      doctor_name: (data as any).doctor_name,
      speciality: (data as any).speciality,
      location: (data as any).location,
      address: (data as any).address,
      mobile: (data as any).mobile,
      hospital: (data as any).hospital,
      qualification: (data as any).qualification,
    };
  }

  /**
   * Get unique specialities from public doctors
   */
  static async getPublicSpecialities(): Promise<string[]> {
    const { data, error } = await supabase
      .from('doctors')
      .select('speciality')
      .eq('public_visible', true)
      .eq('is_active', true)
      .not('speciality', 'is', null);

    if (error) throw error;

    const specialities = new Set<string>();
    (data as any[])?.forEach((row: any) => {
      if (row.speciality) specialities.add(row.speciality);
    });

    return Array.from(specialities).sort();
  }

  /**
   * Get unique locations from public doctors
   */
  static async getPublicLocations(): Promise<string[]> {
    const { data, error } = await supabase
      .from('doctors')
      .select('location')
      .eq('public_visible', true)
      .eq('is_active', true);

    if (error) throw error;

    const locations = new Set<string>();
    (data as any[])?.forEach((row: any) => {
      if (row.location) locations.add(row.location);
    });

    return Array.from(locations).sort();
  }

  /**
   * Get public directory statistics
   * Returns live counts of doctors, locations, and specialities
   */
  static async getPublicStatistics(): Promise<{
    totalDoctors: number;
    totalLocations: number;
    totalSpecialities: number;
  }> {
    try {
      // Get all public visible and active doctors
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select('location, speciality')
        .eq('public_visible', true)
        .eq('is_active', true);

      if (error) throw error;

      const doctorsList = (doctors as any[]) || [];
      
      // Count unique locations
      const locations = new Set<string>();
      doctorsList.forEach((d: any) => {
        if (d.location) locations.add(d.location);
      });

      // Count unique specialities
      const specialities = new Set<string>();
      doctorsList.forEach((d: any) => {
        if (d.speciality) specialities.add(d.speciality);
      });

      return {
        totalDoctors: doctorsList.length,
        totalLocations: locations.size,
        totalSpecialities: specialities.size,
      };
    } catch (error) {
      console.error('Failed to fetch public statistics:', error);
      // Return zeros on error instead of throwing
      return {
        totalDoctors: 0,
        totalLocations: 0,
        totalSpecialities: 0,
      };
    }
  }

  /**
   * Track directory view
   */
  static async trackDirectoryView(metadata?: {
    userAgent?: string;
    referrer?: string;
  }): Promise<void> {
    try {
      // Skip analytics tracking for now - requires RLS policy updates
      // await supabase
      //   .from('directory_analytics')
      //   .insert({
      //     event_type: 'directory_view',
      //     doctor_id: null,
      //     user_agent: metadata?.userAgent || null,
      //     referrer: metadata?.referrer || null,
      //   } as any);
    } catch (error) {
      // Don't throw - analytics failures shouldn't break the app
      console.error('Failed to track directory view:', error);
    }
  }

  /**
   * Track doctor profile view
   */
  static async trackDoctorView(
    doctorId: number,
    metadata?: {
      userAgent?: string;
      referrer?: string;
    }
  ): Promise<void> {
    try {
      // Skip analytics tracking for now - requires RLS policy updates
      // await supabase
      //   .from('directory_analytics')
      //   .insert({
      //     event_type: 'doctor_profile_view',
      //     doctor_id: doctorId,
      //     user_agent: metadata?.userAgent || null,
      //     referrer: metadata?.referrer || null,
      //   } as any);
    } catch (error) {
      // Don't throw - analytics failures shouldn't break the app
      console.error('Failed to track doctor view:', error);
    }
  }

  /**
   * Get directory analytics (admin only)
   */
  static async getDirectoryAnalytics(days: number = 30): Promise<DirectoryAnalytics> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString();

    // Get total views
    const { data: allViews } = await supabase
      .from('directory_analytics')
      .select('event_type, doctor_id')
      .gte('viewed_at', sinceStr);

    const views = (allViews as any[]) || [];
    const directoryViews = views.filter(v => v.event_type === 'directory_view');
    const profileViews = views.filter(v => v.event_type === 'doctor_profile_view');
    const uniqueDoctors = new Set(profileViews.map(v => v.doctor_id).filter(Boolean));

    // Get top specialities
    const { data: topSpecData } = await supabase
      .from('directory_analytics')
      .select('doctor_id')
      .eq('event_type', 'doctor_profile_view')
      .gte('viewed_at', sinceStr)
      .not('doctor_id', 'is', null);

    const doctorIds = ((topSpecData || []) as any[]).map(v => v.doctor_id).filter(Boolean);
    const { data: doctors } = doctorIds.length > 0
      ? await supabase
          .from('doctors')
          .select('speciality')
          .in('id', doctorIds)
      : { data: [] };

    const specCounts: Record<string, number> = {};
    (doctors as any[])?.forEach((d: any) => {
      if (d.speciality) {
        specCounts[d.speciality] = (specCounts[d.speciality] || 0) + 1;
      }
    });

    const topSpecialities = Object.entries(specCounts)
      .map(([speciality, count]) => ({ speciality, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get top locations
    const { data: topLocData } = await supabase
      .from('directory_analytics')
      .select('doctor_id')
      .eq('event_type', 'doctor_profile_view')
      .gte('viewed_at', sinceStr)
      .not('doctor_id', 'is', null);

    const locDoctorIds = ((topLocData || []) as any[]).map(v => v.doctor_id).filter(Boolean);
    const { data: locDoctors } = locDoctorIds.length > 0
      ? await supabase
          .from('doctors')
          .select('location')
          .in('id', locDoctorIds)
      : { data: [] };

    const locCounts: Record<string, number> = {};
    (locDoctors as any[])?.forEach((d: any) => {
      if (d.location) {
        locCounts[d.location] = (locCounts[d.location] || 0) + 1;
      }
    });

    const topLocations = Object.entries(locCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total_views: directoryViews.length,
      profile_views: profileViews.length,
      unique_doctors_viewed: uniqueDoctors.size,
      top_specialities: topSpecialities,
      top_locations: topLocations,
    };
  }

  /**
   * Get most viewed doctors (admin only)
   */
  static async getMostViewedDoctors(limit: number = 10): Promise<MostViewedDoctor[]> {
    // Use the database function
    const { data, error } = await (supabase as any)
      .rpc('get_most_viewed_doctors', { limit_count: limit });

    if (error) {
      console.error('Error getting most viewed doctors:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      doctor_id: row.doctor_id,
      doctor_name: row.doctor_name,
      speciality: row.speciality,
      location: row.location,
      view_count: parseInt(row.view_count) || 0,
    }));
  }

  /**
   * Update doctor public visibility (admin only)
   */
  static async updateDoctorVisibility(
    doctorId: number,
    publicVisible: boolean
  ): Promise<void> {
    const { error } = await (supabase as any)
      .from('doctors')
      .update({ public_visible: publicVisible })
      .eq('id', doctorId);

    if (error) throw error;
  }

  /**
   * Get doctor statistics for admin
   */
  static async getDoctorVisibilityStats(): Promise<{
    total: number;
    public_visible: number;
    hidden: number;
  }> {
    const { data: all } = await supabase
      .from('doctors')
      .select('id, public_visible');

    const doctors = (all as any[]) || [];

    return {
      total: doctors.length,
      public_visible: doctors.filter(d => d.public_visible).length,
      hidden: doctors.filter(d => !d.public_visible).length,
    };
  }
}
