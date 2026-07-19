"use client";

import { useEffect, useState } from "react";

import {
  UserManagementService,
  type UserProfile,
  type UserActivityStats,
} from "@/lib/supabase/services/user-management.service";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  MapPin,
  Activity,
  Clock,
  Calendar,
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";

type FilterType = "all" | "active" | "pending" | "disabled" | "suspended";
type RoleFilter = "all" | "mr" | "admin" | "public";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activityStats, setActivityStats] = useState<
    Map<string, UserActivityStats>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const [usersData, statsData] = await Promise.all([
        UserManagementService.getAllUsers(),
        UserManagementService.getUserActivityStats(),
      ]);

      setUsers(usersData);

      // Convert stats array to map for quick lookup
      const statsMap = new Map<string, UserActivityStats>();
      statsData.forEach((stat) => {
        statsMap.set(stat.user_id, stat);
      });
      setActivityStats(statsMap);
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(
    userId: string,
    newStatus: "active" | "disabled" | "suspended",
  ) {
    try {
      await UserManagementService.updateUserStatus(userId, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      await loadUsers();
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update user status");
    }
  }

  async function handleRoleChange(userId: string, newRole: "mr" | "admin") {
    try {
      await UserManagementService.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole.toUpperCase()}`);
      await loadUsers();
    } catch (err) {
      console.error("Failed to update role:", err);
      toast.error("Failed to update user role");
    }
  }

  async function handleDeleteUser(userId: string) {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action can be reversed later.",
      )
    ) {
      return;
    }

    try {
      await UserManagementService.softDeleteUser(userId);
      toast.success("User deleted successfully");
      await loadUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast.error("Failed to delete user");
    }
  }

  function viewUserDetails(user: UserProfile) {
    setSelectedUser(user);
    setShowUserDetails(true);
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    // Status filter
    if (statusFilter !== "all" && user.status !== statusFilter) {
      return false;
    }

    // Role filter
    if (roleFilter !== "all" && user.role !== roleFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.email.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query) ||
        false
      );
    }

    return true;
  });

  // Calculate summary stats
  const summary = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    pending: users.filter((u) => u.status === "pending").length,
    disabled: users.filter((u) => u.status === "disabled").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    mrs: users.filter((u) => u.role === "mr").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-8">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-slate-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8">
      <div className="px-4 sm:px-5 lg:px-6 max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryCard
            label="Total Users"
            value={summary.total}
            icon={Users}
            color="blue"
          />
          <SummaryCard
            label="Active"
            value={summary.active}
            icon={UserCheck}
            color="green"
          />
          <SummaryCard
            label="Pending"
            value={summary.pending}
            icon={Clock}
            color="yellow"
          />
          <SummaryCard
            label="Disabled"
            value={summary.disabled}
            icon={UserX}
            color="red"
          />
          <SummaryCard
            label="MRs"
            value={summary.mrs}
            icon={Activity}
            color="purple"
          />
          <SummaryCard
            label="Admins"
            value={summary.admins}
            icon={Shield}
            color="indigo"
          />
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterType)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="disabled">Disabled</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="mr">MR</option>
                <option value="admin">Admin</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              Showing {filteredUsers.length} of {users.length} users
            </span>
            <button
              onClick={loadUsers}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Territory
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const stats = activityStats.get(user.id);
                    return (
                      <UserRow
                        key={user.id}
                        user={user}
                        stats={stats}
                        onViewDetails={viewUserDetails}
                        onStatusChange={handleStatusChange}
                        onRoleChange={handleRoleChange}
                        onDelete={handleDeleteUser}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <UserDetailsModal
            user={selectedUser}
            stats={activityStats.get(selectedUser.id)}
            onClose={() => {
              setShowUserDetails(false);
              setSelectedUser(null);
            }}
            onStatusChange={async (status) => {
              await handleStatusChange(selectedUser.id, status);
              const updatedUser = await UserManagementService.getUserById(
                selectedUser.id,
              );
              if (updatedUser) setSelectedUser(updatedUser);
            }}
            onRoleChange={async (role) => {
              await handleRoleChange(selectedUser.id, role);
              const updatedUser = await UserManagementService.getUserById(
                selectedUser.id,
              );
              if (updatedUser) setSelectedUser(updatedUser);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    yellow:
      "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
    red: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400",
    purple:
      "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    indigo:
      "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

// User Row Component
function UserRow({
  user,
  stats,
  onViewDetails,
  onStatusChange,
  onRoleChange,
  onDelete,
}: {
  user: UserProfile;
  stats?: UserActivityStats;
  onViewDetails: (user: UserProfile) => void;
  onStatusChange: (
    userId: string,
    status: "active" | "disabled" | "suspended",
  ) => Promise<void>;
  onRoleChange: (userId: string, role: "mr" | "admin") => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const statusColors = {
    active:
      "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    pending:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    disabled: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    suspended:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  };

  const roleColors = {
    admin:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
    mr: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    public: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400",
  };

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-slate-900 dark:text-white">
            {user.full_name || "Unnamed User"}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {user.email}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role as keyof typeof roleColors]}`}
        >
          {user.role.toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status as keyof typeof statusColors]}`}
        >
          {user.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
          <MapPin className="w-4 h-4" />
          <span>{user.territory?.length || 0} locations</span>
        </div>
      </td>
      <td className="px-4 py-3">
        {stats && (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <TrendingUp className="w-3 h-3" />
              <span>{stats.doctors_added} doctors</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <FileText className="w-3 h-3" />
              <span>{stats.total_pending_requests} pending</span>
            </div>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {user.last_login ? (
            <>
              <div>{new Date(user.last_login).toLocaleDateString("en-IN")}</div>
              <div className="text-xs text-slate-400">
                {new Date(user.last_login).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </>
          ) : (
            <span className="text-slate-400">Never</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onViewDetails(user)}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
                <div className="py-1">
                  {user.status !== "active" && (
                    <button
                      onClick={() => {
                        onStatusChange(user.id, "active");
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4 text-green-600" />
                      Activate
                    </button>
                  )}
                  {user.status !== "disabled" && (
                    <button
                      onClick={() => {
                        onStatusChange(user.id, "disabled");
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <UserX className="w-4 h-4 text-red-600" />
                      Disable
                    </button>
                  )}
                  {user.status !== "suspended" && (
                    <button
                      onClick={() => {
                        onStatusChange(user.id, "suspended");
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      Suspend
                    </button>
                  )}
                  <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                  {user.role === "mr" && (
                    <button
                      onClick={() => {
                        onRoleChange(user.id, "admin");
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4 text-indigo-600" />
                      Make Admin
                    </button>
                  )}
                  {user.role === "admin" && (
                    <button
                      onClick={() => {
                        onRoleChange(user.id, "mr");
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Activity className="w-4 h-4 text-purple-600" />
                      Make MR
                    </button>
                  )}
                  <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                  <button
                    onClick={() => {
                      onDelete(user.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Delete User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// User Details Modal Component
function UserDetailsModal({
  user,
  stats,
  onClose,
  onStatusChange,
  onRoleChange,
}: {
  user: UserProfile;
  stats?: UserActivityStats;
  onClose: () => void;
  onStatusChange: (
    status: "active" | "disabled" | "suspended",
  ) => Promise<void>;
  onRoleChange: (role: "mr" | "admin") => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user.full_name || "Unnamed User"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Role" value={user.role.toUpperCase()} />
            <InfoField label="Status" value={user.status} />
            <InfoField
              label="Phone"
              value={user.phone_number || "Not provided"}
            />
            <InfoField
              label="Last Login"
              value={
                user.last_login
                  ? new Date(user.last_login).toLocaleString("en-IN")
                  : "Never"
              }
            />
            <InfoField
              label="Joined"
              value={new Date(user.created_at).toLocaleDateString("en-IN")}
            />
            <InfoField
              label="Territory"
              value={`${user.territory?.length || 0} locations`}
            />
          </div>

          {/* Territory */}
          {user.territory && user.territory.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Territory Locations
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.territory.map((loc: string) => (
                  <span
                    key={loc}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                  >
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Activity Stats */}
          {stats && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Activity Statistics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatBox
                  label="Doctors Added"
                  value={stats.doctors_added}
                  icon={TrendingUp}
                />
                <StatBox
                  label="Total Requests"
                  value={stats.total_requests}
                  icon={FileText}
                />
                <StatBox
                  label="Pending"
                  value={stats.total_pending_requests}
                  icon={Clock}
                />
                <StatBox
                  label="Approved"
                  value={stats.total_approved_requests}
                  icon={CheckCircle}
                />
                <StatBox
                  label="Rejected"
                  value={stats.total_rejected_requests}
                  icon={XCircle}
                />
                <StatBox
                  label="Visits"
                  value={stats.total_visits}
                  icon={Activity}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          {user.notes && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Admin Notes
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                {user.notes}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-sm text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}
