import { NextResponse } from 'next/server';
import { DirectoryService } from '@/lib/supabase/services/directory.service';

// Cache for 5 minutes (300 seconds)
export const revalidate = 300;

export async function GET() {
  try {
    const stats = await DirectoryService.getPublicStatistics();
    
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { totalDoctors: 0, totalLocations: 0, totalSpecialities: 0 },
      { status: 500 }
    );
  }
}
