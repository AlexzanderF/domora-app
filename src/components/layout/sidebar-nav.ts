import { UserRole } from "@/features/auth/types";
import { Role } from "@/features/requests/types";

export type WorkspaceRole = Role;

export interface NavItemConfig {
  readonly href: string;
  readonly label: string;
  readonly icon: string;
}

export interface ActiveNavItem extends NavItemConfig {
  readonly active: boolean;
}

export const ROLE_NAVIGATION_MAP: Record<
  WorkspaceRole,
  readonly NavItemConfig[]
> = {
  [Role.Client]: [
    { href: "/client", label: "Табло", icon: "⌂" },
    { href: "/client/requests", label: "Моите заявки", icon: "▤" },
    { href: "/client/plan", label: "Абонамент", icon: "◈" },
    { href: "/client/profile", label: "Профил", icon: "👤" },
  ],
  [Role.Specialist]: [
    { href: "/specialist", label: "Табло & График", icon: "⌂" },
    { href: "/specialist/opportunities", label: "Възможности", icon: "⚡" },
    { href: "/specialist/history", label: "История & Приходи", icon: "📈" },
    { href: "/specialist/profile", label: "Профил", icon: "👤" },
  ],
  [Role.Admin]: [
    { href: "/admin", label: "Команден център", icon: "⌂" },
    { href: "/admin/requests", label: "Заявки", icon: "▤" },
    { href: "/admin/specialists", label: "Специалисти", icon: "👥" },
    { href: "/admin/tariffs", label: "Тарифи", icon: "◈" },
  ],
} as const;

export const ROLE_DASHBOARD_PATHS: Record<WorkspaceRole, string> = {
  [Role.Client]: "/client",
  [Role.Specialist]: "/specialist",
  [Role.Admin]: "/admin",
};

const ROOT_DASHBOARD_PATHS = Object.values(
  ROLE_DASHBOARD_PATHS,
) as readonly string[];

export function resolveWorkspaceRole(
  pathname: string,
  userRole?: UserRole | string | null,
): WorkspaceRole {
  if (pathname.startsWith("/admin")) {
    return Role.Admin;
  }
  if (pathname.startsWith("/specialist")) {
    return Role.Specialist;
  }
  if (pathname.startsWith("/client")) {
    return Role.Client;
  }

  if (userRole === UserRole.Admin) {
    return Role.Admin;
  }
  if (userRole === UserRole.Specialist) {
    return Role.Specialist;
  }

  return Role.Client;
}

export function isNavItemActive(
  itemHref: string,
  currentPath: string,
): boolean {
  const normalizedPath = currentPath.replace(/\/+$/, "") || "/";
  const normalizedItem = itemHref.replace(/\/+$/, "") || "/";

  if (normalizedPath === normalizedItem) {
    return true;
  }

  if (ROOT_DASHBOARD_PATHS.includes(normalizedItem)) {
    return false;
  }

  return normalizedPath.startsWith(`${normalizedItem}/`);
}

export function getNavigationItems(
  role: WorkspaceRole,
  currentPath: string = "",
): ActiveNavItem[] {
  const items = ROLE_NAVIGATION_MAP[role] ?? ROLE_NAVIGATION_MAP[Role.Client];
  return items.map((item) => ({
    ...item,
    active: isNavItemActive(item.href, currentPath),
  }));
}
