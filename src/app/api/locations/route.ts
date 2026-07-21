import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Cache for 10 minutes
export const revalidate = 600;

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('location')
      .eq('public_visible', true)
      .eq('is_active', true);

    if (error) throw error;

    // Group and count
    const locationMap = new Map<string, number>();
    (data || []).forEach((doc: any) => {
      const count = locationMap.get(doc.location) || 0;
      locationMap.set(doc.location, count + 1);
    });

    const locations = Array.from(locationMap.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(locations, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('Locations API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
