// Doctors Service - Manage doctor master data
import { supabase, requireAuth } from '../client';
import type { DoctorRow, DoctorInsert, DoctorUpdate } from '../database.types';
import { validateDoctor, sanitizeDoctor, type DoctorInput } from '../../validation/doctor-validation';
import { prepareBulkImport } from '../../utils/bulk-import';

// Type-safe wrapper for Supabase
const doctorsTable = () => (supabase as any).from('doctors');
const deletedDoctorsTable = () => (supabase as any).from('deleted_doctors');

export class DoctorsService {
  // ========== READ OPERATIONS ==========
  
  /**
   * Get all doctors (excluding user's deleted doctors)
   */
  static async getAllDoctors(): Promise<DoctorRow[]> {
    // In single-user mode, we can skip auth check and deleted doctors filter for now
    const { data, error } = await doctorsTable()
      .select('*')
      .order('doctor_name');
    
    if (error) {
      console.error('Failed to fetch doctors:', error);
      throw error;
    }
    return data ?? [];
  }

  /**
   * Get doctors by location
   */
  static async getDoctorsByLocation(location: string): Promise<DoctorRow[]> {
    const { data, error } = await doctorsTable()
      .select('*')
      .eq('location', location)
      .order('doctor_name');
    
    if (error) {
      console.error('Failed to fetch doctors by location:', error);
      throw error;
    }
    return data ?? [];
  }

  /**
   * Get doctor by ID
   */
  static async getDoctorById(id: number): Promise<DoctorRow | null> {
    const { data, error } = await doctorsTable()
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Failed to fetch doctor by ID:', error);
      throw error;
    }
    return data;
  }

  /**
   * Search doctors by query
   */
  static async searchDoctors(query: string): Promise<DoctorRow[]> {
    const { data, error} = await doctorsTable()
      .select('*')
      .or(`doctor_name.ilike.%${query}%,location.ilike.%${query}%,speciality.ilike.%${query}%,hospital.ilike.%${query}%`)
      .order('doctor_name');
    
    if (error) {
      console.error('Failed to search doctors:', error);
      throw error;
    }
    return data ?? [];
  }

  /**
   * Get unique locations
   */
  static async getLocations(): Promise<string[]> {
    const { data, error } = await doctorsTable()
      .select('location')
      .order('location');
    
    if (error) {
      console.error('Failed to fetch locations:', error);
      throw error;
    }
    
    // Get unique locations
    const locations = [...new Set((data as any)?.map((d: any) => d.location as string) ?? [])] as string[];
    return locations;
  }

  /**
   * Get doctors count by location
   */
  static async getDoctorCountByLocation(): Promise<Record<string, number>> {
    const doctors = await this.getAllDoctors();
    const counts: Record<string, number> = {};
    
    doctors.forEach(doctor => {
      counts[doctor.location] = (counts[doctor.location] || 0) + 1;
    });
    
    return counts;
  }

  /**
   * Get total doctor count
   */
  static async getTotalCount(): Promise<number> {
    const { count, error } = await doctorsTable()
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Failed to count doctors:', error);
      throw error;
    }
    return count ?? 0;
  }

  // ========== CREATE OPERATIONS ==========

  /**
   * Add new doctor with validation
   */
  static async createDoctor(doctor: DoctorInput): Promise<DoctorRow> {
    console.log('Creating doctor:', doctor);
    
    // Sanitize input
    const sanitized = sanitizeDoctor(doctor);
    
    // Validate
    const validation = validateDoctor(sanitized);
    if (!validation.valid) {
      const errorMsg = validation.errors.map(e => e.message).join(', ');
      throw new Error(`Validation failed: ${errorMsg}`);
    }
    
    try {
      const { data, error } = await doctorsTable()
        .insert(sanitized)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        });
        throw error;
      }
      
      console.log('Doctor created successfully:', data);
      return data;
    } catch (err) {
      console.error('Caught exception:', err);
      throw err;
    }
  }

  /**
   * Legacy method - alias for createDoctor
   */
  static async addDoctor(doctor: Omit<DoctorInsert, 'id'>): Promise<DoctorRow> {
    return this.createDoctor(doctor as DoctorInput);
  }

  // ========== UPDATE OPERATIONS ==========

  /**
   * Update doctor with validation
   */
  static async updateDoctor(id: number, update: Partial<DoctorInput>): Promise<DoctorRow> {
    console.log('Updating doctor:', id, update);
    
    // Sanitize input
    const sanitized = sanitizeDoctor(update);
    
    // Validate (partial validation - only provided fields)
    const validation = validateDoctor({ 
      doctor_name: 'placeholder', // Required fields get placeholder for partial validation
      location: 'placeholder',
      ...sanitized 
    });
    
    // Filter errors to only include fields that were actually provided
    const relevantErrors = validation.errors.filter(err => 
      Object.keys(sanitized).includes(err.field)
    );
    
    if (relevantErrors.length > 0) {
      const errorMsg = relevantErrors.map(e => e.message).join(', ');
      throw new Error(`Validation failed: ${errorMsg}`);
    }
    
    try {
      const { data, error } = await doctorsTable()
        .update(sanitized)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Failed to update doctor:', error);
        throw error;
      }
      
      console.log('Doctor updated successfully:', data);
      return data;
    } catch (err) {
      console.error('Caught exception:', err);
      throw err;
    }
  }

  // ========== DELETE OPERATIONS ==========

  /**
   * Soft delete doctor (user-specific)
   */
  static async deleteDoctor(doctorId: number): Promise<void> {
    const userId = await requireAuth();
    
    const { error } = await deletedDoctorsTable()
      .insert({ user_id: userId, doctor_id: doctorId });
    
    if (error && error.code !== '23505') { // Ignore duplicate errors
      console.error('Failed to delete doctor:', error);
      throw error;
    }
  }

  /**
   * Restore deleted doctor
   */
  static async restoreDoctor(doctorId: number): Promise<void> {
    const userId = await requireAuth();
    
    const { error } = await deletedDoctorsTable()
      .delete()
      .eq('user_id', userId)
      .eq('doctor_id', doctorId);
    
    if (error) {
      console.error('Failed to restore doctor:', error);
      throw error;
    }
  }

  /**
   * Hard delete doctor (permanent - admin only)
   */
  static async hardDeleteDoctor(doctorId: number): Promise<void> {
    const { error } = await doctorsTable()
      .delete()
      .eq('id', doctorId);
    
    if (error) {
      console.error('Failed to hard delete doctor:', error);
      throw error;
    }
  }

  // ========== BULK OPERATIONS ==========

  /**
   * Bulk import doctors with validation
   */
  static async bulkImportDoctors(doctors: DoctorInput[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ index: number; doctor: DoctorInput; errors: string[] }>;
    imported: DoctorRow[];
  }> {
    console.log(`Bulk importing ${doctors.length} doctors...`);
    
    // Prepare and validate
    const { ready, rejected } = prepareBulkImport(doctors);
    
    console.log(`Valid: ${ready.length}, Invalid: ${rejected.length}`);
    
    // Import valid doctors
    const imported: DoctorRow[] = [];
    const errors: Array<{ index: number; doctor: DoctorInput; errors: string[] }> = [...rejected];
    
    for (const doctor of ready) {
      try {
        const result = await this.createDoctor(doctor);
        imported.push(result);
      } catch (err: any) {
        const originalIndex = doctors.indexOf(doctor);
        errors.push({
          index: originalIndex,
          doctor,
          errors: [err.message || 'Failed to import']
        });
      }
    }
    
    console.log(`Import complete: ${imported.length} successful, ${errors.length} failed`);
    
    return {
      success: imported.length,
      failed: errors.length,
      errors,
      imported
    };
  }

  /**
   * Bulk update doctors
   */
  static async bulkUpdateDoctors(updates: Array<{ id: number; data: Partial<DoctorInput> }>): Promise<{
    success: number;
    failed: number;
    errors: Array<{ id: number; error: string }>;
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ id: number; error: string }>
    };
    
    for (const update of updates) {
      try {
        await this.updateDoctor(update.id, update.data);
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({
          id: update.id,
          error: err.message || 'Failed to update'
        });
      }
    }
    
    return results;
  }

  /**
   * Bulk delete doctors
   */
  static async bulkDeleteDoctors(doctorIds: number[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ id: number; error: string }>;
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ id: number; error: string }>
    };
    
    for (const id of doctorIds) {
      try {
        await this.deleteDoctor(id);
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({
          id,
          error: err.message || 'Failed to delete'
        });
      }
    }
    
    return results;
  }
}
