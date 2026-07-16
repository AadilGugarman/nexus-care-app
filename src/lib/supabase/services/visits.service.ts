// Visits Service - Manage doctor visits tracking
import { supabase, requireAuth } from '../client';
import type { DoctorVisit, DoctorVisitUpdate } from '../database.types';

export class VisitsService {
  /**
   * Get all visit records for current user
   */
  static async getAllVisits(): Promise<DoctorVisit[]> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('doctor_visits')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Get visit record for specific doctor
   */
  static async getVisitForDoctor(doctorId: number): Promise<DoctorVisit | null> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('doctor_visits')
      .select('*')
      .eq('user_id', userId)
      .eq('doctor_id', doctorId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  /**
   * Mark doctor as visited
   */
  static async markDoctorVisited(doctorId: number, frequencyDays: number = 30): Promise<DoctorVisit> {
    const userId = await requireAuth();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + frequencyDays);
    const nextDue = nextDueDate.toISOString().split('T')[0];

    // Upsert visit record
    const { data, error } = await (supabase as any)
      .from('doctor_visits')
      .upsert({
        user_id: userId,
        doctor_id: doctorId,
        last_visit_date: today,
        next_due_date: nextDue,
        frequency_days: frequencyDays,
        is_visited: true,
      }, {
        onConflict: 'user_id,doctor_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Reset visit record
   */
  static async resetDoctorVisit(doctorId: number): Promise<void> {
    const userId = await requireAuth();
    
    const { error } = await supabase
      .from('doctor_visits')
      .delete()
      .eq('user_id', userId)
      .eq('doctor_id', doctorId);
    
    if (error) throw error;
  }

  /**
   * Update visit record
   */
  static async updateVisit(doctorId: number, update: DoctorVisitUpdate): Promise<DoctorVisit> {
    const userId = await requireAuth();
    
    const { data, error } = await (supabase as any)
      .from('doctor_visits')
      .update(update)
      .eq('user_id', userId)
      .eq('doctor_id', doctorId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get visits due today
   */
  static async getVisitsDueToday(): Promise<DoctorVisit[]> {
    const userId = await requireAuth();
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('doctor_visits')
      .select('*')
      .eq('user_id', userId)
      .lte('next_due_date', today)
      .order('next_due_date');
    
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Get overdue visits
   */
  static async getOverdueVisits(): Promise<DoctorVisit[]> {
    const userId = await requireAuth();
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('doctor_visits')
      .select('*')
      .eq('user_id', userId)
      .lt('next_due_date', today)
      .order('next_due_date');
    
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Get visits due within days
   */
  static async getVisitsDueWithin(days: number): Promise<DoctorVisit[]> {
    const userId = await requireAuth();
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('doctor_visits')
      .select('*')
      .eq('user_id', userId)
      .gte('next_due_date', todayStr)
      .lte('next_due_date', futureStr)
      .order('next_due_date');
    
    if (error) throw error;
    return data ?? [];
  }
}
