'use client';

import { useEffect, useState } from 'react';
import { supabase, DEFAULT_USER_ID } from '@/lib/supabase/client';
import { CheckCircle2, XCircle, Loader2, Database, Users, Route, Calendar, Clock, User } from 'lucide-react';

interface VerificationData {
  connectionStatus: 'connected' | 'disconnected' | 'checking';
  totalDoctors: number | null;
  totalRoutes: number | null;
  totalVisits: number | null;
  totalAssignments: number | null;
  currentUserId: string;
  lastSyncTimestamp: string;
  error: string | null;
  databaseVersion: string | null;
  sampleDoctor: any | null;
  sampleRoute: any | null;
}

export default function VerifyMigrationPage() {
  const [data, setData] = useState<VerificationData>({
    connectionStatus: 'checking',
    totalDoctors: null,
    totalRoutes: null,
    totalVisits: null,
    totalAssignments: null,
    currentUserId: DEFAULT_USER_ID,
    lastSyncTimestamp: new Date().toISOString(),
    error: null,
    databaseVersion: null,
    sampleDoctor: null,
    sampleRoute: null,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadVerificationData();
  }, []);

  async function loadVerificationData() {
    setIsRefreshing(true);
    const startTime = Date.now();

    try {
      // Test connection with a simple query
      const { error: connectionError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (connectionError) {
        setData(prev => ({
          ...prev,
          connectionStatus: 'disconnected',
          error: connectionError.message,
          lastSyncTimestamp: new Date().toISOString(),
        }));
        setIsRefreshing(false);
        return;
      }

      // Connection successful - fetch all data directly from Supabase
      const [
        doctorsResult,
        routesResult,
        visitsResult,
        assignmentsResult,
        profileResult,
        sampleDoctorResult,
        sampleRouteResult,
      ] = await Promise.all([
        // Count doctors
        supabase
          .from('doctors')
          .select('id', { count: 'exact', head: true }),

        // Count user routes
        supabase
          .from('user_routes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', DEFAULT_USER_ID),

        // Count visits
        supabase
          .from('doctor_visits')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', DEFAULT_USER_ID),

        // Count day assignments
        supabase
          .from('doctor_day_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', DEFAULT_USER_ID),

        // Get current user profile
        supabase
          .from('profiles')
          .select('*')
          .eq('id', DEFAULT_USER_ID)
          .maybeSingle(),

        // Get sample doctor
        supabase
          .from('doctors')
          .select('*')
          .limit(1)
          .maybeSingle(),

        // Get sample route
        supabase
          .from('user_routes')
          .select('*')
          .eq('user_id', DEFAULT_USER_ID)
          .limit(1)
          .maybeSingle(),
      ]);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      setData({
        connectionStatus: 'connected',
        totalDoctors: doctorsResult.count ?? 0,
        totalRoutes: routesResult.count ?? 0,
        totalVisits: visitsResult.count ?? 0,
        totalAssignments: assignmentsResult.count ?? 0,
        currentUserId: DEFAULT_USER_ID,
        lastSyncTimestamp: new Date().toISOString(),
        error: null,
        databaseVersion: `PostgreSQL (Supabase) - Query time: ${queryTime}ms`,
        sampleDoctor: sampleDoctorResult.data,
        sampleRoute: sampleRouteResult.data,
      });
    } catch (err) {
      setData(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        error: err instanceof Error ? err.message : 'Unknown error',
        lastSyncTimestamp: new Date().toISOString(),
      }));
    } finally {
      setIsRefreshing(false);
    }
  }

  const StatusIcon = () => {
    if (data.connectionStatus === 'checking') {
      return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />;
    }
    if (data.connectionStatus === 'connected') {
      return <CheckCircle2 className="h-8 w-8 text-emerald-500" />;
    }
    return <XCircle className="h-8 w-8 text-rose-500" />;
  };

  const StatusText = () => {
    if (data.connectionStatus === 'checking') {
      return 'Checking connection...';
    }
    if (data.connectionStatus === 'connected') {
      return 'Connected to Supabase';
    }
    return 'Connection failed';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                Migration Verification
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Real-time data from Supabase PostgreSQL database
              </p>
            </div>
            <button
              onClick={loadVerificationData}
              disabled={isRefreshing}
              className="h-12 px-6 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className={`rounded-2xl shadow-lg p-6 border ${
          data.connectionStatus === 'connected'
            ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
            : data.connectionStatus === 'disconnected'
            ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800'
            : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-center gap-4">
            <StatusIcon />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                <StatusText />
              </h2>
              {data.error && (
                <p className="text-sm text-rose-600 dark:text-rose-400 mt-1 font-mono">
                  Error: {data.error}
                </p>
              )}
              {data.databaseVersion && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {data.databaseVersion}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Doctors */}
          <StatCard
            icon={<Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
            title="Total Doctors"
            value={data.totalDoctors !== null ? data.totalDoctors.toLocaleString() : '—'}
            subtitle="From doctors table"
            loading={data.connectionStatus === 'checking'}
          />

          {/* Total Routes */}
          <StatCard
            icon={<Route className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
            title="Total Routes"
            value={data.totalRoutes !== null ? data.totalRoutes.toLocaleString() : '—'}
            subtitle="From user_routes table"
            loading={data.connectionStatus === 'checking'}
          />

          {/* Total Visits */}
          <StatCard
            icon={<Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
            title="Visit Records"
            value={data.totalVisits !== null ? data.totalVisits.toLocaleString() : '—'}
            subtitle="From doctor_visits table"
            loading={data.connectionStatus === 'checking'}
          />

          {/* Total Assignments */}
          <StatCard
            icon={<Database className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
            title="Day Assignments"
            value={data.totalAssignments !== null ? data.totalAssignments.toLocaleString() : '—'}
            subtitle="From doctor_day_assignments table"
            loading={data.connectionStatus === 'checking'}
          />
        </div>

        {/* User Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Current User
            </h3>
          </div>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-start gap-2">
              <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0">User ID:</span>
              <span className="text-slate-900 dark:text-slate-50 break-all">{data.currentUserId}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0">Mode:</span>
              <span className="text-slate-900 dark:text-slate-50">Single-User (No Auth)</span>
            </div>
          </div>
        </div>

        {/* Last Sync Timestamp */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Last Sync
            </h3>
          </div>
          <div className="font-mono text-sm">
            <div className="flex items-start gap-2">
              <span className="text-slate-500 dark:text-slate-400 w-32 shrink-0">Timestamp:</span>
              <span className="text-slate-900 dark:text-slate-50">
                {new Date(data.lastSyncTimestamp).toLocaleString('en-US', {
                  dateStyle: 'full',
                  timeStyle: 'long',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Sample Data */}
        {data.sampleDoctor && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
              Sample Doctor Record (from database)
            </h3>
            <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-slate-200 dark:border-slate-700">
              {JSON.stringify(data.sampleDoctor, null, 2)}
            </pre>
          </div>
        )}

        {data.sampleRoute && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
              Sample Route Record (from database)
            </h3>
            <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-slate-200 dark:border-slate-700">
              {JSON.stringify(data.sampleRoute, null, 2)}
            </pre>
          </div>
        )}

        {/* Verification Summary */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-2xl shadow-lg p-6 border border-indigo-200 dark:border-indigo-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
            ✅ Verification Summary
          </h3>
          <div className="space-y-2 text-sm">
            <VerificationItem
              check={data.connectionStatus === 'connected'}
              text="Direct connection to Supabase established"
            />
            <VerificationItem
              check={data.totalDoctors !== null && data.totalDoctors >= 0}
              text={`Reading doctor data from PostgreSQL (${data.totalDoctors ?? 0} records)`}
            />
            <VerificationItem
              check={data.totalRoutes !== null && data.totalRoutes >= 0}
              text={`Reading route data from PostgreSQL (${data.totalRoutes ?? 0} records)`}
            />
            <VerificationItem
              check={data.totalVisits !== null && data.totalVisits >= 0}
              text={`Reading visit data from PostgreSQL (${data.totalVisits ?? 0} records)`}
            />
            <VerificationItem
              check={data.currentUserId === DEFAULT_USER_ID}
              text="Using configured default user ID"
            />
            <VerificationItem
              check={!data.error}
              text="No connection errors detected"
            />
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl shadow-lg p-6 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <strong>📌 Note:</strong> All data shown on this page is read <strong>directly from Supabase</strong> in real-time.
            No LocalStorage or cached data is used for these statistics. Click "Refresh" to query the database again.
          </p>
        </div>

        {/* Back to App */}
        <div className="text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold"
          >
            ← Back to Application
          </a>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  loading: boolean;
}

function StatCard({ icon, title, value, subtitle, loading }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
          <span className="text-2xl font-bold text-slate-400">Loading...</span>
        </div>
      ) : (
        <>
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-1">
            {value}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {subtitle}
          </p>
        </>
      )}
    </div>
  );
}

interface VerificationItemProps {
  check: boolean;
  text: string;
}

function VerificationItem({ check, text }: VerificationItemProps) {
  return (
    <div className="flex items-start gap-2">
      {check ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
      )}
      <span className={check ? 'text-slate-700 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400'}>
        {text}
      </span>
    </div>
  );
}
