"use client";

import { useEffect, useState } from "react";

import {
  Users,
  Route as RouteIcon,
  Activity,
  TrendingUp,
  BarChart3,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  AnalyticsService,
  type MRStatistics,
  type SystemStatistics,
  type RouteAnalytics,
} from "@/lib/supabase/services";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function AdminAnalyticsPage() {
  const [systemStats, setSystemStats] = useState<SystemStatistics | null>(null);
  const [mrStats, setMRStats] = useState<MRStatistics[]>([]);
  const [routes, setRoutes] = useState<RouteAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "routes">(
    "overview",
  );

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);

      const [system, mrs, allRoutes] = await Promise.all([
        AnalyticsService.getSystemStatistics(),
        AnalyticsService.getMRStatistics(),
        AnalyticsService.getAllRoutesWithDetails(),
      ]);

      setSystemStats(system);
      setMRStats(mrs);
      setRoutes(allRoutes);
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-8">
        <div className="px-4 sm:px-5 lg:px-6 max-w-7xl mx-auto py-20">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-slate-400">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 pt-8">
        <div className="px-4 sm:px-5 lg:px-6 max-w-7xl mx-auto py-20">
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center">
            <p className="text-rose-300 font-semibold">Error: {error}</p>
            <button
              onClick={loadAnalytics}
              className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-8">
      <div className="px-4 sm:px-5 lg:px-6 max-w-7xl mx-auto space-y-6">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={loadAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold shadow-lg shadow-indigo-900/20"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <BarChart3 className="inline h-4 w-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === "users"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Users className="inline h-4 w-4 mr-2" />
              MR Users ({mrStats.length})
            </button>
            <button
              onClick={() => setActiveTab("routes")}
              className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === "routes"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <RouteIcon className="inline h-4 w-4 mr-2" />
              All Routes ({routes.length})
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && systemStats && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label="Total MRs"
                value={systemStats.total_mrs}
                subtext={`${systemStats.active_mrs} active (30 days)`}
                color="blue"
              />
              <StatCard
                icon={<RouteIcon className="h-5 w-5" />}
                label="Total Routes"
                value={systemStats.total_routes}
                subtext={`${systemStats.average_routes_per_mr} avg per MR`}
                color="emerald"
              />
              <StatCard
                icon={<Activity className="h-5 w-5" />}
                label="Total Visits"
                value={systemStats.total_visits}
                subtext={`${systemStats.average_visits_per_mr} avg per MR`}
                color="purple"
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Active Doctors"
                value={systemStats.total_active_doctors}
                subtext={`of ${systemStats.total_doctors} total`}
                color="amber"
              />
            </div>

            {/* Top MRs by Activity */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
                Top MRs by Activity
              </h2>
              <div className="space-y-3">
                {mrStats
                  .sort(
                    (a, b) =>
                      b.visited_doctor_count +
                      b.route_count -
                      (a.visited_doctor_count + a.route_count),
                  )
                  .slice(0, 5)
                  .map((mr) => (
                    <div
                      key={mr.user_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-50">
                          {mr.full_name || "Unnamed User"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {mr.email}
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-indigo-600 dark:text-indigo-400">
                            {mr.route_count}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Routes
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            {mr.visited_doctor_count}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Visits
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-purple-600 dark:text-purple-400">
                            {mr.assigned_doctor_count}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Assigned
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Routes
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Visits
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Assigned
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Last Activity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {mrStats.map((mr) => (
                    <tr
                      key={mr.user_id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-50">
                          {mr.full_name || "Unnamed"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {mr.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-bold text-slate-900 dark:text-slate-50">
                          {mr.route_count}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {mr.active_route_count} active
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-bold text-slate-900 dark:text-slate-50">
                          {mr.visited_doctor_count}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          of {mr.total_visit_count}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-bold text-slate-900 dark:text-slate-50">
                          {mr.assigned_doctor_count}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          doctors
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {mr.last_activity
                            ? new Date(mr.last_activity).toLocaleDateString()
                            : "Never"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(mr.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Routes Tab */}
        {activeTab === "routes" && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Route Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Owner
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Doctors
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Cycle Days
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {routes.map((route) => (
                    <tr
                      key={route.route_id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-50">
                          {route.route_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {route.location}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                          {route.full_name || "Unknown"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {route.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-bold text-slate-900 dark:text-slate-50">
                          {route.doctor_count}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {route.cycle_days}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {route.completed_at ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(route.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtext: string;
  color: "blue" | "emerald" | "purple" | "amber";
}) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
    emerald:
      "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    purple:
      "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
    amber:
      "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {label}
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
        {value}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {subtext}
      </div>
    </div>
  );
}
