import { Session } from "next-auth";

export type UserRole = "admin" | "user";

type Permission =
  | "read_docs"
  | "write_docs"
  | "delete_docs"
  | "manage_users"
  | "access_admin_panel"
  | "view_analytics";

export interface AuthUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
}

export function getUserRole(session: Session | null): UserRole {
  return session?.user?.role ?? "user";
}

export function isAdmin(session: Session | null): boolean {
  return getUserRole(session) === "admin";
}

export function hasAdminAccess(session: Session | null): boolean {
  return isAdmin(session);
}

export function canAccessRoute(session: Session | null, path: string): boolean {
  const role = getUserRole(session);

  const publicRoutes = ["/", "/login", "/api/auth"];
  if (publicRoutes.some((route) => path.startsWith(route))) {
    return true;
  }

  const adminRoutes = ["/admin", "/docs/editor"];
  if (adminRoutes.some((route) => path.startsWith(route))) {
    return role === "admin";
  }

  const userRoutes = ["/docs", "/dashboard"];
  if (userRoutes.some((route) => path.startsWith(route))) {
    return ["user", "admin"].includes(role);
  }

  return !!session;
}

export function getDefaultRedirectPath(_session: Session | null): string {
  return "/dashboard";
}

export const ROLES = {
  admin: {
    name: "Administrator",
    permissions: [
      "read_docs",
      "write_docs",
      "delete_docs",
      "manage_users",
      "access_admin_panel",
      "view_analytics",
    ] as Permission[],
    routes: ["/docs", "/docs/editor", "/admin", "/dashboard"],
  },
  user: {
    name: "User",
    permissions: ["read_docs"] as Permission[],
    routes: ["/docs", "/dashboard"],
  },
} as const;

export function hasPermission(
  session: Session | null,
  permission: string
): boolean {
  const role = getUserRole(session);
  return (ROLES[role]?.permissions as readonly string[]).includes(permission);
}
