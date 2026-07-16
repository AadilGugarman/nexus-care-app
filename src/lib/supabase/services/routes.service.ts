// Routes Service - Manage user routes
import { supabase, requireAuth } from '../client';
import type { UserRoute, UserRouteInsert, UserRouteUpdate } from '../database.types';

export class RoutesService {
  /**
   * Get all routes for current user
   */
  static async getAllRoutes(): Promise<UserRoute[]> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('user_routes')
      .select('*')
      .eq('user_id', userId)
      .order('order_index');
    
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Get routes by location
   */
  static async getRoutesByLocation(location: string): Promise<UserRoute[]> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('user_routes')
      .select('*')
      .eq('user_id', userId)
      .eq('location', location)
      .order('order_index');
    
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Create new route
   */
  static async createRoute(route: Omit<UserRouteInsert, 'user_id'>): Promise<UserRoute> {
    const userId = await requireAuth();
    
    const { data, error } = await (supabase as any)
      .from('user_routes')
      .insert({ ...route, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Update route
   */
  static async updateRoute(routeId: string, update: UserRouteUpdate): Promise<UserRoute> {
    const { data, error } = await (supabase as any)
      .from('user_routes')
      .update(update)
      .eq('id', routeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Delete route
   */
  static async deleteRoute(routeId: string): Promise<void> {
    const { error } = await supabase
      .from('user_routes')
      .delete()
      .eq('id', routeId);
    
    if (error) throw error;
  }

  /**
   * Complete route
   */
  static async completeRoute(routeId: string): Promise<UserRoute> {
    return this.updateRoute(routeId, { completed_at: new Date().toISOString() });
  }

  /**
   * Uncomplete route
   */
  static async uncompleteRoute(routeId: string): Promise<UserRoute> {
    return this.updateRoute(routeId, { completed_at: null });
  }

  /**
   * Get doctor IDs in route
   */
  static async getRouteDoctorIds(routeId: string): Promise<number[]> {
    const { data, error } = await supabase
      .from('route_doctors')
      .select('doctor_id')
      .eq('route_id', routeId)
      .order('order_index');
    
    if (error) throw error;
    return (data as any)?.map((rd: any) => rd.doctor_id as number) ?? [];
  }

  /**
   * Add doctor to route
   */
  static async addDoctorToRoute(routeId: string, doctorId: number): Promise<void> {
    // Get current max order_index
    const { data: existing } = await supabase
      .from('route_doctors')
      .select('order_index')
      .eq('route_id', routeId)
      .order('order_index', { ascending: false })
      .limit(1);
    
    const nextOrder = existing && existing.length > 0 ? (existing as any)[0].order_index + 1 : 0;
    
    const { error } = await (supabase as any)
      .from('route_doctors')
      .insert({ 
        route_id: routeId, 
        doctor_id: doctorId,
        order_index: nextOrder
      });
    
    if (error && error.code !== '23505') { // Ignore duplicate errors
      throw error;
    }
  }

  /**
   * Remove doctor from route
   */
  static async removeDoctorFromRoute(routeId: string, doctorId: number): Promise<void> {
    const { error } = await supabase
      .from('route_doctors')
      .delete()
      .eq('route_id', routeId)
      .eq('doctor_id', doctorId);
    
    if (error) throw error;
  }

  /**
   * Reorder doctors in route
   */
  static async reorderDoctorsInRoute(routeId: string, orderedDoctorIds: number[]): Promise<void> {
    // Update order_index for each doctor
    const updates = orderedDoctorIds.map((doctorId, index) =>
      (supabase as any)
        .from('route_doctors')
        .update({ order_index: index })
        .eq('route_id', routeId)
        .eq('doctor_id', doctorId)
    );
    
    await Promise.all(updates);
  }

  /**
   * Reorder routes within a location
   */
  static async reorderRoutes(location: string, orderedRouteIds: string[]): Promise<void> {
    const updates = orderedRouteIds.map((routeId, index) =>
      (supabase as any)
        .from('user_routes')
        .update({ order_index: index })
        .eq('id', routeId)
    );
    
    await Promise.all(updates);
  }
}
