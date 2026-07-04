import { appNavItems } from "@/lib/navigation";
import type { UserRole } from "@/lib/domain-types";

export const publicRoutes = ["/login", "/health"] as const;

export type AuthUserContext = {
  email: string;
  displayName: string | null;
  role: UserRole;
};

export function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isAdminRole(role: UserRole) {
  return role === "system_admin";
}

export function getRoleAwareNavItems(role: UserRole) {
  return appNavItems.filter((item) => {
    if (item.adminOnly) {
      return isAdminRole(role);
    }

    return true;
  });
}

export function getProfileLabel(user: AuthUserContext | null) {
  if (!user) {
    return {
      primary: "Not signed in",
      secondary: "Login required",
    };
  }

  return {
    primary: user.displayName || user.email,
    secondary: user.role === "system_admin" ? "System admin" : "Operational user",
  };
}
