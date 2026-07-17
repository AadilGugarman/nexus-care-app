// ============================================================================
// Phase 8: Role-Based Navigation & Access Control
// Defines navigation items and access rules for each user role
// ============================================================================

import { 
  Home, 
  MapPin, 
  Calendar, 
  Route, 
  CalendarDays, 
  Bell, 
  FileText,
  LayoutDashboard,
  LucideIcon
} from 'lucide-react';

export type UserRole = 'public' | 'mr' | 'admin';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[]; // Which roles can see this item
  description?: string;
}

// ============================================================================
// Navigation Items by Role
// ============================================================================

export const NAV_ITEMS: NavItem[] = [
  // Home - All users
  {
    key: 'home',
    label: 'Home',
    href: '/',
    icon: Home,
    roles: ['public', 'mr', 'admin'],
    description: 'Dashboard and overview',
  },

  // Directory - All users (but different experience)
  {
    key: 'directory',
    label: 'Directory',
    href: '/directory',
    icon: MapPin,
    roles: ['public', 'mr', 'admin'],
    description: 'Public doctor directory',
  },

  // Doctors - MR and Admin only
  {
    key: 'doctors',
    label: 'Doctors',
    href: '#doctors', // Internal tab for MR, direct route for admin
    icon: MapPin,
    roles: ['mr', 'admin'],
    description: 'Manage doctors and contributions',
  },

  // Days - MR and Admin only
  {
    key: 'days',
    label: 'Days',
    href: '#days',
    icon: Calendar,
    roles: ['mr', 'admin'],
    description: 'Day planning and assignments',
  },

  // Routes - MR and Admin only
  {
    key: 'routes',
    label: 'Routes',
    href: '#routes',
    icon: Route,
    roles: ['mr', 'admin'],
    description: 'Route planning and management',
  },

  // Today - MR and Admin only
  {
    key: 'today',
    label: 'Today',
    href: '#today',
    icon: CalendarDays,
    roles: ['mr', 'admin'],
    description: 'Today\'s visits and tracking',
  },

  // Notifications - MR and Admin only
  {
    key: 'notifications',
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['mr', 'admin'],
    description: 'View notifications and alerts',
  },

  // My Requests - MR and Admin only
  {
    key: 'my-requests',
    label: 'My Requests',
    href: '/my-requests',
    icon: FileText,
    roles: ['mr', 'admin'],
    description: 'Track submitted requests',
  },

  // Admin - Admin only
  {
    key: 'admin',
    label: 'Admin',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['admin'],
    description: 'Admin dashboard and controls',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get navigation items for a specific role
 */
export function getNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter(item => item.roles.includes(role));
}

/**
 * Check if a user role can access a specific route
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  // Public routes accessible to all
  const publicRoutes = ['/', '/directory', '/login', '/signup', '/forgot-password'];
  if (publicRoutes.includes(route) || route.startsWith('/directory/')) {
    return true;
  }

  // MR routes
  const mrRoutes = ['/notifications', '/my-requests'];
  if (mrRoutes.includes(route) && (role === 'mr' || role === 'admin')) {
    return true;
  }

  // Admin routes
  const adminRoutes = ['/admin', '/admin/doctors', '/admin/reviews', '/admin/analytics', '/admin/import', '/admin/quality'];
  if (adminRoutes.some(r => route.startsWith(r)) && role === 'admin') {
    return true;
  }

  return false;
}

/**
 * Get the default route for a user role
 */
export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'mr':
      return '/'; // MR dashboard
    case 'public':
    default:
      return '/'; // Public home
  }
}

/**
 * Check if route requires authentication
 */
export function requiresAuth(route: string): boolean {
  const publicRoutes = ['/', '/directory', '/login', '/signup', '/forgot-password'];
  if (publicRoutes.includes(route) || route.startsWith('/directory/')) {
    return false;
  }
  return true;
}

// ============================================================================
// Role Descriptions
// ============================================================================

export const ROLE_DESCRIPTIONS = {
  public: {
    title: 'Public User',
    description: 'Browse and search doctor directory',
    capabilities: [
      'Search doctors by name, location, speciality',
      'Filter by speciality and location',
      'View doctor profiles',
      'Call doctors directly',
      'Get directions via Google Maps',
    ],
    limitations: [
      'Cannot create or edit doctors',
      'Cannot plan routes or track visits',
      'Cannot submit contribution requests',
      'Cannot access admin features',
    ],
  },
  mr: {
    title: 'Medical Representative',
    description: 'Field force with operational access',
    capabilities: [
      'Plan and manage routes',
      'Track daily visits',
      'Assign doctors to days',
      'Submit doctor creation requests',
      'Submit doctor update requests',
      'Submit status change requests',
      'Track request approvals/rejections',
      'Receive notifications',
      'View public directory',
    ],
    limitations: [
      'Cannot directly create/edit doctors (must submit requests)',
      'Cannot approve/reject requests',
      'Cannot access admin dashboard',
      'Cannot manage other users',
      'Cannot change doctor visibility',
    ],
  },
  admin: {
    title: 'Administrator',
    description: 'Full system access and control',
    capabilities: [
      'All MR capabilities',
      'Direct doctor CRUD operations',
      'Review and approve/reject requests',
      'Bulk import doctors',
      'Access analytics dashboard',
      'Quality control tools',
      'Manage doctor visibility',
      'View all MR data',
      'System oversight',
    ],
    limitations: [
      'None - full access',
    ],
  },
};

// ============================================================================
// Feature Access Matrix
// ============================================================================

export interface FeatureAccess {
  feature: string;
  public: boolean;
  mr: boolean;
  admin: boolean;
  notes?: string;
}

export const FEATURE_ACCESS_MATRIX: FeatureAccess[] = [
  // Public Directory
  { feature: 'View Doctor Directory', public: true, mr: true, admin: true },
  { feature: 'Search Doctors', public: true, mr: true, admin: true },
  { feature: 'Filter Doctors', public: true, mr: true, admin: true },
  { feature: 'View Doctor Profiles', public: true, mr: true, admin: true },
  { feature: 'Call Doctor', public: true, mr: true, admin: true },
  { feature: 'Get Directions', public: true, mr: true, admin: true },

  // Doctor Management
  { feature: 'Create Doctor (Direct)', public: false, mr: false, admin: true, notes: 'MR submits request' },
  { feature: 'Edit Doctor (Direct)', public: false, mr: false, admin: true, notes: 'MR submits request' },
  { feature: 'Delete Doctor', public: false, mr: false, admin: true },
  { feature: 'Change Doctor Status', public: false, mr: false, admin: true, notes: 'MR submits request' },
  { feature: 'Bulk Import Doctors', public: false, mr: false, admin: true },

  // Contribution System
  { feature: 'Submit Creation Request', public: false, mr: true, admin: true },
  { feature: 'Submit Update Request', public: false, mr: true, admin: true },
  { feature: 'Submit Status Request', public: false, mr: true, admin: true },
  { feature: 'View My Requests', public: false, mr: true, admin: true },
  { feature: 'Track Request Status', public: false, mr: true, admin: true },

  // Approval Workflow
  { feature: 'Review Requests', public: false, mr: false, admin: true },
  { feature: 'Approve Requests', public: false, mr: false, admin: true },
  { feature: 'Reject Requests', public: false, mr: false, admin: true },

  // Route Planning
  { feature: 'Create Routes', public: false, mr: true, admin: true },
  { feature: 'Edit Routes', public: false, mr: true, admin: true },
  { feature: 'Delete Routes', public: false, mr: true, admin: true },
  { feature: 'Assign Doctors to Routes', public: false, mr: true, admin: true },

  // Visit Tracking
  { feature: 'Mark Visit Complete', public: false, mr: true, admin: true },
  { feature: 'View Visit History', public: false, mr: true, admin: true },
  { feature: 'Track Today\'s Visits', public: false, mr: true, admin: true },

  // Day Planning
  { feature: 'Assign Days to Doctors', public: false, mr: true, admin: true },
  { feature: 'View Day Assignments', public: false, mr: true, admin: true },
  { feature: 'Edit Day Assignments', public: false, mr: true, admin: true },

  // Notifications
  { feature: 'Receive Notifications', public: false, mr: true, admin: true },
  { feature: 'View Notifications', public: false, mr: true, admin: true },
  { feature: 'Mark as Read', public: false, mr: true, admin: true },

  // Analytics
  { feature: 'View Personal Analytics', public: false, mr: true, admin: true },
  { feature: 'View System Analytics', public: false, mr: false, admin: true },
  { feature: 'View Multi-MR Analytics', public: false, mr: false, admin: true },

  // Admin Features
  { feature: 'Access Admin Dashboard', public: false, mr: false, admin: true },
  { feature: 'Manage Doctor Visibility', public: false, mr: false, admin: true },
  { feature: 'Quality Control Tools', public: false, mr: false, admin: true },
  { feature: 'User Management', public: false, mr: false, admin: true },
];

// ============================================================================
// Route Guards
// ============================================================================

export interface RouteGuard {
  path: string;
  allowedRoles: UserRole[];
  requiresAuth: boolean;
  redirectTo?: string; // Where to redirect if access denied
}

export const ROUTE_GUARDS: RouteGuard[] = [
  // Public routes
  { path: '/', allowedRoles: ['public', 'mr', 'admin'], requiresAuth: false },
  { path: '/directory', allowedRoles: ['public', 'mr', 'admin'], requiresAuth: false },
  { path: '/directory/:id', allowedRoles: ['public', 'mr', 'admin'], requiresAuth: false },
  { path: '/login', allowedRoles: ['public', 'mr', 'admin'], requiresAuth: false },
  { path: '/signup', allowedRoles: ['public', 'mr', 'admin'], requiresAuth: false },
  { path: '/forgot-password', allowedRoles: ['public', 'mr', 'admin'], requiresAuth: false },

  // MR routes
  { path: '/notifications', allowedRoles: ['mr', 'admin'], requiresAuth: true, redirectTo: '/login' },
  { path: '/my-requests', allowedRoles: ['mr', 'admin'], requiresAuth: true, redirectTo: '/login' },

  // Admin routes
  { path: '/admin', allowedRoles: ['admin'], requiresAuth: true, redirectTo: '/access-denied' },
  { path: '/admin/:any', allowedRoles: ['admin'], requiresAuth: true, redirectTo: '/access-denied' },
];

