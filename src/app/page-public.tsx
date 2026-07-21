// ============================================================================
// Phase 8: Public Home Page - Mobile-First Doctor Directory
// Landing page for non-authenticated users
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Phone, Users, Building2, Stethoscope, Loader2 } from 'lucide-react';
import { DirectoryService } from '@/lib/supabase/services/directory.service';

export function PublicHomePage() {
  const [stats, setStats] = useState<{
    totalDoctors: number;
    totalLocations: number;
    totalSpecialities: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const statistics = await DirectoryService.getPublicStatistics();
        setStats(statistics);
        setError(false);
      } catch (err) {
        console.error('Failed to fetch statistics:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Compact Hero Section */}
      <div className="bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 px-4 py-8">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Doctor Directory
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
            Find and connect with healthcare professionals
          </p>
          
          {/* Primary CTA - Browse Doctors */}
          <Link
            href="/directory"
            className="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-semibold transition-colors shadow-lg mb-3"
          >
            Browse Doctors
          </Link>
          
          {/* Secondary CTA - Sign In */}
          <Link
            href="/login"
            className="block w-full py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors border border-slate-300 dark:border-slate-700"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Network Stats - Compact 3-Column with Live Data */}
      <div className="px-4 py-6 bg-slate-100 dark:bg-slate-800/50">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-3 gap-3">
            {isLoading ? (
              <>
                <StatChipSkeleton />
                <StatChipSkeleton />
                <StatChipSkeleton />
              </>
            ) : error || !stats ? (
              <>
                <StatChip icon={Users} value="—" label="Doctors" />
                <StatChip icon={MapPin} value="—" label="Cities" />
                <StatChip icon={Stethoscope} value="—" label="Specialities" />
              </>
            ) : (
              <>
                <StatChip
                  icon={Users}
                  value={stats.totalDoctors > 0 ? `${stats.totalDoctors}+` : '0'}
                  label="Doctors"
                />
                <StatChip
                  icon={MapPin}
                  value={stats.totalLocations > 0 ? `${stats.totalLocations}+` : '0'}
                  label="Cities"
                />
                <StatChip
                  icon={Stethoscope}
                  value={stats.totalSpecialities > 0 ? `${stats.totalSpecialities}+` : '0'}
                  label="Specialities"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feature Chips - Compact Icons */}
      <div className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            <FeatureChip icon={Search} label="Search Doctors" />
            <FeatureChip icon={MapPin} label="Filter by Location" />
            <FeatureChip icon={Phone} label="Direct Contact" />
            <FeatureChip icon={Building2} label="Hospital Info" />
          </div>
        </div>
      </div>

      {/* MR CTA - Compact */}
      <div className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-center">
            <h2 className="text-lg font-bold text-white mb-2">
              Medical Representative?
            </h2>
            <p className="text-sm text-blue-100 mb-4">
              Access route planning and visit tracking
            </p>
            <Link
              href="/signup"
              className="inline-block px-6 py-2.5 bg-white text-blue-600 rounded-lg font-semibold text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              Create MR Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact Stat Chip Component
function StatChip({ 
  icon: Icon, 
  value, 
  label 
}: { 
  icon: any; 
  value: string; 
  label: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
      <Icon className="w-5 h-5 mx-auto mb-1.5 text-blue-500 dark:text-blue-400" />
      <div className="text-xl font-bold text-slate-900 dark:text-white mb-0.5">
        {value}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </div>
    </div>
  );
}

// Skeleton Loader for Stats
function StatChipSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse">
      <div className="w-5 h-5 mx-auto mb-1.5 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-1 mx-auto w-12" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded mx-auto w-16" />
    </div>
  );
}

// Compact Feature Chip Component
function FeatureChip({ 
  icon: Icon, 
  label 
}: { 
  icon: any; 
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <Icon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    </div>
  );
}
