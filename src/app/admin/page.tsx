'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DoctorsService, RoutesService, VisitsService } from '@/lib/supabase/services';
import { getRequestStatistics } from '@/lib/supabase/services/doctor-requests.service';
import type { RequestStatistics } from '@/lib/types/doctor-requests.types';
import { Users, MapPin, Route as RouteIcon, Activity, TrendingUp, ClipboardCheck, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalDoctors: number;
  totalLocations: number;
  totalRoutes: number;
  totalVisits: number;
  recentDoctors: Array<{
    id: number;
    doctor_name: string;
    location: string;
    created_at: string;
  }>;
  doctorsByLocation: Record<string, number>;
  requestStats: RequestStatistics | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const [doctors, routes, visits, locations, requestStats] = await Promise.all([
        DoctorsService.getAllDoctors(),
        RoutesService.getAllRoutes(),
        VisitsService.getAllVisits(),
        DoctorsService.getLocations(),
        getRequestStatistics().catch(() => null), // Don't fail if request stats fail
      ]);

      // Count doctors by location
      const doctorsByLocation: Record<string, number> = {};
      doctors.forEach(doc => {
        doctorsByLocation[doc.location] = (doctorsByLocation[doc.location] || 0) + 1;
      });

      // Get recent doctors (last 10)
      const recentDoctors = [...doctors]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(d => ({
          id: d.id,
          doctor_name: d.doctor_name,
          location: d.location,
          created_at: d.created_at,
        }));

      setStats({
        totalDoctors: doctors.length,
        totalLocations: locations.length,
        totalRoutes: routes.length,
        totalVisits: visits.length,
        recentDoctors,
        doctorsByLocation,
        requestStats,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center text-slate-400">
        Failed to load dashboard data
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Master data overview and statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Doctors"
          value={stats.totalDoctors}
          color="blue"
        />
        <StatCard
          icon={MapPin}
          label="Total Locations"
          value={stats.totalLocations}
          color="green"
        />
        <StatCard
          icon={RouteIcon}
          label="Total Routes"
          value={stats.totalRoutes}
          color="purple"
        />
        <StatCard
          icon={Activity}
          label="Total Visits"
          value={stats.totalVisits}
          color="orange"
        />
      </div>

      {/* Pending Reviews Alert */}
      {stats.requestStats && stats.requestStats.total_pending > 0 && (
        <Link href="/admin/reviews">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 hover:bg-yellow-500/20 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">
                    {stats.requestStats.total_pending} Pending {stats.requestStats.total_pending === 1 ? 'Request' : 'Requests'}
                  </h3>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    NEEDS REVIEW
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  {stats.requestStats.creation_requests.pending} new doctor{stats.requestStats.creation_requests.pending !== 1 ? 's' : ''}, {' '}
                  {stats.requestStats.change_requests.pending} update{stats.requestStats.change_requests.pending !== 1 ? 's' : ''}, {' '}
                  {stats.requestStats.status_requests.pending} status change{stats.requestStats.status_requests.pending !== 1 ? 's' : ''}
                </p>
              </div>
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
        </Link>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added Doctors */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Recently Added Doctors
              </h2>
            </div>
          </div>
          <div className="p-4">
            {stats.recentDoctors.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">
                No doctors added yet
              </p>
            ) : (
              <div className="space-y-2">
                {stats.recentDoctors.map(doctor => (
                  <div
                    key={doctor.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {doctor.doctor_name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {doctor.location}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                      {new Date(doctor.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Doctors by Location */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Doctors by Location
              </h2>
            </div>
          </div>
          <div className="p-4">
            {Object.keys(stats.doctorsByLocation).length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">
                No location data available
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(stats.doctorsByLocation)
                  .sort(([, a], [, b]) => b - a)
                  .map(([location, count]) => (
                    <div
                      key={location}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                    >
                      <span className="font-medium text-slate-900 dark:text-white">
                        {location}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {count} {count === 1 ? 'doctor' : 'doctors'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
