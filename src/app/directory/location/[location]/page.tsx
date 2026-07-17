'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Stethoscope, Users } from 'lucide-react';
import { DirectoryService, type PublicDoctor } from '@/lib/supabase/services';

interface SpecialityStats {
  speciality: string;
  count: number;
}

export default function LocationDetailPage({ params }: { params: Promise<{ location: string }> }) {
  const { location } = use(params);
  const decodedLocation = decodeURIComponent(location);
  
  const [specialities, setSpecialities] = useState<SpecialityStats[]>([]);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocationData();
  }, [decodedLocation]);

  async function loadLocationData() {
    try {
      setLoading(true);
      setError(null);

      // Get all doctors for this location
      const doctors = await DirectoryService.getPublicDoctors();
      const locationDoctors = doctors.filter(d => d.location === decodedLocation);

      setTotalDoctors(locationDoctors.length);

      // Group by speciality
      const specialityMap = new Map<string, number>();
      locationDoctors.forEach(doc => {
        if (doc.speciality) {
          const current = specialityMap.get(doc.speciality) || 0;
          specialityMap.set(doc.speciality, current + 1);
        }
      });

      // Convert to array and sort
      const specialityStats: SpecialityStats[] = Array.from(specialityMap.entries())
        .map(([speciality, count]) => ({ speciality, count }))
        .sort((a, b) => b.count - a.count);

      setSpecialities(specialityStats);
    } catch (err) {
      console.error('Error loading location data:', err);
      setError('Failed to load location data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-300 font-semibold">{error}</p>
            <Link
              href="/directory"
              className="mt-4 inline-block px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
            >
              Back to Locations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Locations</span>
          </Link>
          
          <h1 className="text-2xl font-bold text-white">{decodedLocation}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {totalDoctors} {totalDoctors === 1 ? 'doctor' : 'doctors'} • {specialities.length} {specialities.length === 1 ? 'speciality' : 'specialities'}
          </p>
        </div>
      </div>

      {/* All Doctors Button */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <Link
          href={`/directory/location/${encodeURIComponent(decodedLocation)}/all`}
          className="block bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl p-4 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">All Doctors</h3>
                <p className="text-sm text-blue-100">{totalDoctors} doctors in {decodedLocation}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70 shrink-0" />
          </div>
        </Link>
      </div>

      {/* Specialities List */}
      <div className="max-w-2xl mx-auto px-4 pb-6">
        <h2 className="text-lg font-bold text-white mb-3 px-1">By Speciality</h2>
        
        {specialities.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No specialities available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {specialities.map(spec => (
              <Link
                key={spec.speciality}
                href={`/directory/location/${encodeURIComponent(decodedLocation)}/${encodeURIComponent(spec.speciality)}`}
                className="block bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl p-4 transition-colors border border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white">
                        {spec.speciality}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {spec.count} {spec.count === 1 ? 'doctor' : 'doctors'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
