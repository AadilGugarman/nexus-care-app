// Seed Database Script - Import SEED_DOCTORS to Supabase
import { supabase } from './client';
import { SEED_DOCTORS } from '@/data/doctors';

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');
    
    // Check if doctors already exist
    const { count } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true });
    
    if (count && count > 0) {
      console.log(`ℹ️  Database already has ${count} doctors. Skipping seed.`);
      return { success: true, count, skipped: true };
    }
    
    console.log(`📝 Preparing to seed ${SEED_DOCTORS.length} doctors...`);
    
    // Convert to database format
    const doctorsToInsert: Array<{
      id: number;
      doctor_name: string;
      location: string;
      address: string | null;
      speciality: string | null;
      qualification: string | null;
      hospital: string | null;
      mobile: string | null;
      notes: string | null;
    }> = SEED_DOCTORS.map(doctor => ({
      id: doctor.id,
      doctor_name: doctor.doctorName,
      location: doctor.location,
      address: null,
      speciality: null,
      qualification: null,
      hospital: null,
      mobile: null,
      notes: null,
    }));
    
    // Insert in batches (Supabase has a limit)
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < doctorsToInsert.length; i += batchSize) {
      const batch = doctorsToInsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('doctors')
        .insert(batch as any);
      
      if (error) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
        throw error;
      }
      
      inserted += batch.length;
      console.log(`✅ Inserted ${inserted}/${doctorsToInsert.length} doctors`);
    }
    
    console.log('🎉 Database seeded successfully!');
    return { success: true, count: inserted, skipped: false };
    
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    throw error;
  }
}

// Run if called directly
if (typeof window !== 'undefined' && (window as any).__seedDatabase) {
  seedDatabase().then(result => {
    console.log('Seed result:', result);
  });
}
