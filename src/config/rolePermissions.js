// src/config/rolePermissions.js
// Role-Based Access Control Configuration

import {
  LayoutDashboard,
  Stethoscope,
  CalendarDays,
  UserRound,
  Syringe,
  Receipt,
  FlaskConical,
  BarChart3,
  ClipboardList,
  DollarSign,
  Activity
} from 'lucide-react';

/**
 * Navigation items with role-based access control
 *
 * - superAdmin: Has access to ALL pages
 * - doctor: Has access to doctor-specific pages only
 * - nurse/worker: Has access to counter and basic operations
 */
export const navigationConfig = [
  {
    id: '#/nurse/dashboard',
    text: 'Doctor Dashboard',
    icon: LayoutDashboard,
    roles: ['superAdmin', 'doctor'] // Only doctors and super admins
  },
  {
    id: '#/nurse/clinic-dashboard',
    text: 'Clinic Dashboard',
    icon: Stethoscope,
    roles: ['superAdmin', 'nurse'] // Super admins and nurses
  },
  {
    id: '#/nurse/appointments',
    text: 'Appointments',
    icon: CalendarDays,
    roles: ['superAdmin', 'nurse'] // Super admins and nurses
  },
  {
    id: '#/nurse/treatment-plan',
    text: 'Treatment Plan',
    icon: ClipboardList,
    roles: ['superAdmin', 'doctor', 'nurse'] // All roles
  },
  {
    id: '#/nurse/operations',
    text: 'Operations',
    icon: Activity,
    roles: ['superAdmin', 'nurse'] // Super admins and nurses
  },
  {
    id: '#/nurse/counter',
    text: 'Counter',
    icon: DollarSign,
    roles: ['superAdmin', 'nurse'] // Super admins and nurses (workers)
  },
  {
    id: '#/nurse/doctors',
    text: 'Doctors',
    icon: UserRound,
    roles: ['superAdmin', 'nurse'] // Super admins and nurses
  },
  {
    id: '#/nurse/treatments',
    text: 'Treatments',
    icon: Syringe,
    roles: ['superAdmin', 'nurse'] // Super admins and nurses
  },
  {
    id: '#/nurse/billing',
    text: 'Billing',
    icon: Receipt,
    roles: ['superAdmin', 'nurse'] // Super admins and nurses
  },
  {
    id: '#/nurse/lab-costs',
    text: 'Lab Costs',
    icon: FlaskConical,
    roles: ['superAdmin', 'nurse'] // Super admins and nurses
  },
  {
    id: '#/nurse/summary',
    text: 'Summary',
    icon: BarChart3,
    roles: ['superAdmin', 'nurse'] // Super admins and nurses
  }
];

/**
 * Determine user's effective role for navigation
 * Super admins get 'superAdmin' role, everyone else gets their actual role
 */
export function getUserNavigationRole(user) {
  if (!user) return null;

  // Super admins have access to everything
  if (user.isSuperAdmin) {
    return 'superAdmin';
  }

  // Otherwise return their actual role
  return user.role; // 'doctor' or 'nurse'
}

/**
 * Filter navigation items based on user's role
 */
export function getNavigationForUser(user) {
  if (!user) return [];

  const userRole = getUserNavigationRole(user);

  // Super admin sees ALL items
  if (userRole === 'superAdmin') {
    return navigationConfig;
  }

  // Filter items based on role permissions
  return navigationConfig.filter(item => item.roles.includes(userRole));
}

/**
 * Check if user has access to a specific route
 */
export function hasRouteAccess(user, routePath) {
  if (!user) return false;

  const userRole = getUserNavigationRole(user);

  // Super admin has access to everything
  if (userRole === 'superAdmin') {
    return true;
  }

  // Find the navigation item for this route
  const navItem = navigationConfig.find(item => item.id === routePath);

  if (!navItem) {
    // Route not in config - allow by default for backwards compatibility
    return true;
  }

  // Check if user's role is in the allowed roles for this route
  return navItem.roles.includes(userRole);
}

/**
 * Role display names
 */
export const roleNames = {
  superAdmin: 'Super Administrator',
  doctor: 'Doctor',
  nurse: 'Nurse/Staff'
};

/**
 * Get user's role display name
 */
export function getRoleDisplayName(user) {
  const role = getUserNavigationRole(user);
  return roleNames[role] || 'User';
}
