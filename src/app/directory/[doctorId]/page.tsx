'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Stethoscope, GraduationCap, Building2, Navigation, Home } from 'lucide-react';
import { DirectoryService, type PublicDoctor } from '@/lib/supabase/services';

export default function DoctorProfilePage({ params }: { params: Promise<{ doctorId: string }> }) {
  const resolvedParams = use(params);
  const doctorId = parseInt(resolvedParams.doctorId);

  const [doctor, setDoctor] = useState<PublicDoctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDoctor();
  }, [doctorId]);

  async function loadDoctor() {
    try {
      setLoading(true);
      setError(null);

      const doctorData = await DirectoryService.getPublicDoctorById(doctorId);

      if (!doctorData) {
        setError('Doctor not found or not publicly visible');
        return;
      }

      setDoctor(doctorData);

      // Track doctor view
      DirectoryService.trackDoctorView(doctorId, {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      });
    } catch (err) {
      console.error('Error loading doctor:', err);
      setError(err instanceof Error ? err.message : 'Failed to load doctor profile');
    } finally {
      setLoading(false);
    }
  }

  function handleGetDirections() {
    if (!doctor) return;
    
    if (doctor.address) {
      // Google Maps search URL
      const query = encodeURIComponent(`${doctor.doctor_name} ${doctor.address} ${doctor.location}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    } else {
      // Fallback to location search
      const query = encodeURIComponent(`${doctor.doctor_name} ${doctor.location}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading doctor profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl p-6 text-center">
            <p className="text-rose-700 dark:text-rose-300 font-bold mb-4">
              {error || 'Doctor not found'}
            </p>
            <Link
              href="/directory"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 transition-colors shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-32">
      {/* Compact Header - Mobile Optimized */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <Link
            href="/directory"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>

          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-tight mb-2">
            {doctor.doctor_name}
          </h1>
          
          {/* Speciality Badge + Qualification on same line */}
          <div className="flex flex-wrap items-center gap-2">
            {doctor.speciality && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-md border border-emerald-200 dark:border-emerald-500/30">
                <Stethoscope className="h-3.5 w-3.5" />
                {doctor.speciality}
              </span>
            )}
            {doctor.qualification && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-md border border-blue-200 dark:border-blue-500/30">
                <GraduationCap className="h-3.5 w-3.5" />
                {doctor.qualification}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content - True Mobile First */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Information Cards - Reordered for better hierarchy */}
        <div className="space-y-2.5">
          {/* Location Card - Most important for finding doctor */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/30">
              <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                Location
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-50 break-words">
                {doctor.location}
              </div>
            </div>
          </div>

          {/* Address Card */}
          {doctor.address && doctor.address !== '—' && (
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm">
              <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/30">
                <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                  Address
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 break-words leading-relaxed">
                  {doctor.address}
                </div>
              </div>
            </div>
          )}

          {/* Hospital Card */}
          {doctor.hospital && doctor.hospital !== '—' && (
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/30">
                <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                  Hospital / Clinic
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 break-words">
                  {doctor.hospital}
                </div>
              </div>
            </div>
          )}

          {/* Mobile Number Card - Important for contact */}
          {doctor.mobile && doctor.mobile !== '—' && (
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm">
              <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-500/15 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-500/30">
                <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                  Phone Number
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-50 break-words font-mono">
                  {doctor.mobile}
                </div>
              </div>
            </div>
          )}

          {/* Qualification Card - Only if not shown in header */}
          {doctor.qualification && doctor.qualification !== '—' && (
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm">
              <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/30">
                <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                  Qualification
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 break-words">
                  {doctor.qualification}
                </div>
              </div>
            </div>
          )}

          {/* Speciality Card - Only if not shown in header */}
          {doctor.speciality && doctor.speciality !== '—' && (
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3.5 bg-white dark:bg-slate-800 shadow-sm">
              <div className="h-11 w-11 rounded-xl bg-teal-50 dark:bg-teal-500/15 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-500/30">
                <Stethoscope className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                  Speciality
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 break-words">
                  {doctor.speciality}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-6 text-center px-2">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            This information is provided for reference only. Please contact the doctor directly to confirm availability.
          </p>
        </div>
      </div>

      {/* Sticky Bottom Actions - True Mobile First */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3 shadow-2xl z-20">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {/* Call Button - Primary Action */}
            {doctor.mobile && doctor.mobile !== '—' ? (
              <a
                href={`tel:${doctor.mobile}`}
                className="col-span-2 flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold text-base rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl active:scale-98"
              >
                <Phone className="h-5 w-5" />
                Call Doctor Now
              </a>
            ) : null}
            
            {/* Get Directions - Secondary Action */}
            <button
              onClick={handleGetDirections}
              className={`flex items-center justify-center gap-2 px-4 py-4 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-98 ${
                doctor.mobile && doctor.mobile !== '—' ? '' : 'col-span-2'
              }`}
            >
              <Navigation className="h-5 w-5" />
              Get Directions
            </button>
            
            {/* Back to Directory - If call button exists */}
            {doctor.mobile && doctor.mobile !== '—' ? (
              <Link
                href="/directory"
                className="flex items-center justify-center gap-2 px-4 py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-98 border border-slate-300 dark:border-slate-600"
              >
                <ArrowLeft className="h-5 w-5" />
                Directory
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
