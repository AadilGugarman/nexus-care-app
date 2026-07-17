'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Phone, Building2, MapPin } from 'lucide-react';
import { DirectoryService, type PublicDoctor } from '@/lib/supabase/services';

export default function DoctorsListPage({ 
  params 
}: { 
  params: Promise<{ location: string; speciality: string }> 
}) {
  const { location, speciality } = use(params);
  const decodedLocation = decodeURIComponent(location);
  const decodedSpeciality = decodeURIComponent(speciality);
  const isAllDoctors = decodedSpeciality === 'all';
  
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDoctors();
  }, [decodedLocation, decodedSpeciality]);

  async function loadDoctors() {
    try {
      setLoading(true);
      setError(null);

      const allDoctors = await DirectoryService.getPublicDoctors();
      
      // Filter by location
      let filtered = allDoctors.filter(d => d.location === decodedLocation);

      // Filter by speciality if not "all"
      if (!isAllDoctors) {
        filtered = filtered.filter(d => d.speciality === decodedSpeciality);
      }

      // Sort alphabetically
      filtered.sort((a, b) => a.doctor_name.localeCompare(b.doctor_name));

      setDoctors(filtered);
    } catch (err) {
      console.error('Error loading doctors:', err);
      setError('Failed to load doctors');
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
            <p className="text-slate-400">Loading doctors...</p>
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
              href={`/directory/location/${encodeURIComponent(decodedLocation)}`}
              className="mt-4 inline-block px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
            >
              Back
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
            href={`/directory/location/${encodeURIComponent(decodedLocation)}`}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{decodedLocation}</span>
          </Link>
          
          <h1 className="text-2xl font-bold text-white">
            {isAllDoctors ? 'All Doctors' : decodedSpeciality}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'} in {decodedLocation}
          </p>
        </div>
      </div>

      {/* Doctors List */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {doctors.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400">No doctors found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {doctors.map(doctor => (
              <Link
                key={doctor.id}
                href={`/directory/${doctor.id}`}
                className="block bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl p-4 transition-colors border border-slate-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-white text-lg pr-2">
                    {doctor.doctor_name}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                </div>

                <div className="space-y-2">
                  {doctor.speciality && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      </div>
                      <span className="text-sm text-emerald-300 font-medium">
                        {doctor.speciality}
                      </span>
                    </div>
                  )}

                  {doctor.hospital && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400 ml-0.5" />
                      <span className="text-sm text-slate-300">
                        {doctor.hospital}
                      </span>
                    </div>
                  )}

                  {doctor.mobile && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-400 ml-0.5" />
                      <a
                        href={`tel:${doctor.mobile}`}
                        className="text-sm text-blue-300 hover:text-blue-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {doctor.mobile}
                      </a>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
