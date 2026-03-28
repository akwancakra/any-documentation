import { Session } from "next-auth";

export type UserRole = "admin" | "user";

export interface AuthUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
}

/**
 * Get user role from session
 */
export function getUserRole(session: Session | null): UserRole {
  return ((session?.user as any)?.role as UserRole) || "user";
}

/**
 * Check if user is admin
 */
export function isAdmin(session: Session | null): boolean {
  return getUserRole(session) === "admin";
}

/**
 * Check if user has permission to access admin routes
 */
export function hasAdminAccess(session: Session | null): boolean {
  return isAdmin(session);
}

/**
 * Check if user can access specific route based on role
 */
export function canAccessRoute(session: Session | null, path: string): boolean {
  const role = getUserRole(session);
  
  // Public routes
  const publicRoutes = ["/", "/login", "/api/auth"];
  if (publicRoutes.some(route => path.startsWith(route))) {
    return true;
  }

  // Admin only routes
  const adminRoutes = ["/admin", "/docs/editor"];
  if (adminRoutes.some(route => path.startsWith(route))) {
    return role === "admin";
  }

  // User routes (accessible by both user and admin)
  const userRoutes = ["/docs", "/dashboard"];
  if (userRoutes.some(route => path.startsWith(route))) {
    return ["user", "admin"].includes(role);
  }

  // Default: require authentication
  return !!session;
}

/**
 * Get default redirect path based on user role
 */
export function getDefaultRedirectPath(session: Session | null): string {
  // Semua user (admin dan user) akan diarahkan ke dashboard
  return "/dashboard";
}

/**
 * Role definitions with permissions
 */
export const ROLES = {
  admin: {
    name: "Administrator",
    permissions: [
      "read_docs",
      "write_docs",
      "delete_docs",
      "manage_users",
      "access_admin_panel",
      "view_analytics"
    ],
    routes: ["/docs", "/docs/editor", "/admin", "/dashboard"]
  },
  user: {
    name: "User",
    permissions: [
      "read_docs"
    ],
    routes: ["/docs", "/dashboard"]
  }
} as const;

/**
 * Check if user has specific permission
 */
export function hasPermission(
  session: Session | null, 
  permission: string
): boolean {
  const role = getUserRole(session);
  return ROLES[role]?.permissions.includes(permission as any) || false;
} 