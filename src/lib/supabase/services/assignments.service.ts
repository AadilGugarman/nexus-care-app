// Assignments Service - Manage day assignments for doctors
import { supabase, requireAuth } from '../client';
import type { DoctorDayAssignment, DoctorDayAssignmentInsert, DayKey } from '../database.types';

export class AssignmentsService {
  /**
   * Get all day assignments for current user
   */
  static async getAllAssignments(): Promise<DoctorDayAssignment[]> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('doctor_day_assignments')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Get assignments for specific doctor
   */
  static async getAssignmentsForDoctor(doctorId: number): Promise<DayKey[]> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('doctor_day_assignments')
      .select('day_key')
      .eq('user_id', userId)
      .eq('doctor_id', doctorId);
    
    if (error) throw error;
    return (data as any)?.map((a: any) => a.day_key as DayKey) ?? [];
  }

  /**
   * Get doctors for location and day
   */
  static async getDoctorsForLocationDay(location: string, day: DayKey): Promise<number[]> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('doctor_day_assignments')
      .select('doctor_id')
      .eq('user_id', userId)
      .eq('location', location)
      .eq('day_key', day)
      .order('order_index');
    
    if (error) throw error;
    return (data as any)?.map((a: any) => a.doctor_id as number) ?? [];
  }

  /**
   * Set day assignments for doctor
   */
  static async setDayAssignments(doctorId: number, location: string, days: DayKey[]): Promise<void> {
    const userId = await requireAuth();
    
    // Delete existing assignments
    await supabase
      .from('doctor_day_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('doctor_id', doctorId);
    
    // Insert new assignments
    if (days.length > 0) {
      const assignments: DoctorDayAssignmentInsert[] = days.map((day, index) => ({
        user_id: userId,
        doctor_id: doctorId,
        location,
        day_key: day,
        order_index: index,
      }));
      
      const { error } = await supabase
        .from('doctor_day_assignments')
        .insert(assignments as any);
      
      if (error) throw error;
    }
  }

  /**
   * Toggle single day assignment
   */
  static async toggleDayAssignment(doctorId: number, location: string, day: DayKey): Promise<void> {
    const userId = await requireAuth();
    
    // Check if assignment exists
    const { data: existing } = await supabase
      .from('doctor_day_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('doctor_id', doctorId)
      .eq('day_key', day)
      .maybeSingle();
    
    if (existing) {
      // Remove assignment
      await supabase
        .from('doctor_day_assignments')
        .delete()
        .eq('id', (existing as any).id);
    } else {
      // Add assignment
      await supabase
        .from('doctor_day_assignments')
        .insert({
          user_id: userId,
          doctor_id: doctorId,
          location,
          day_key: day,
          order_index: 0,
        } as any);
    }
  }

  /**
   * Reorder doctors for location and day
   */
  static async reorderLocationDay(location: string, day: DayKey, orderedDoctorIds: number[]): Promise<void> {
    const userId = await requireAuth();
    
    const updates = orderedDoctorIds.map((doctorId, index) =>
      (supabase as any)
        .from('doctor_day_assignments')
        .update({ order_index: index })
        .eq('user_id', userId)
        .eq('location', location)
        .eq('day_key', day)
        .eq('doctor_id', doctorId)
    );
    
    await Promise.all(updates);
  }

  /**
   * Get all assignments grouped by location and day
   */
  static async getAssignmentsGrouped(): Promise<Record<string, Record<DayKey, number[]>>> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('doctor_day_assignments')
      .select('*')
      .eq('user_id', userId)
      .order('order_index');
    
    if (error) throw error;
    
    // Group by location and day
    const grouped: Record<string, Record<string, number[]>> = {};
    
    (data as any)?.forEach((assignment: any) => {
      if (!grouped[assignment.location]) {
        grouped[assignment.location] = {};
      }
      if (!grouped[assignment.location][assignment.day_key]) {
        grouped[assignment.location][assignment.day_key] = [];
      }
      grouped[assignment.location][assignment.day_key].push(assignment.doctor_id);
    });
    
    return grouped as Record<string, Record<DayKey, number[]>>;
  }
}
