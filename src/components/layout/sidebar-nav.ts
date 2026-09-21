export type WorkspaceRole = "client" | "specialist" | "admin";

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
  client: [
    { href: "/client", label: "Табло", icon: "⌂" },
    { href: "/client/requests", label: "Моите заявки", icon: "▤" },
    { href: "/client/plan", label: "Абонамент", icon: "◈" },
    { href: "/client/profile", label: "Профил", icon: "👤" },
  ],
  specialist: [
    { href: "/specialist", label: "Табло & График", icon: "⌂" },
    { href: "/specialist/opportunities", label: "Възможности", icon: "⚡" },
    { href: "/specialist/history", label: "История & Приходи", icon: "📈" },
    { href: "/specialist/profile", label: "Профил", icon: "👤" },
  ],
  admin: [
    { href: "/admin", label: "Команден център", icon: "⌂" },
    { href: "/admin/requests", label: "Заявки", icon: "▤" },
    { href: "/admin/specialists", label: "Специалисти", icon: "👥" },
    { href: "/admin/tariffs", label: "Тарифи", icon: "◈" },
  ],
} as const;

export const ROLE_DASHBOARD_PATHS: Record<WorkspaceRole, string> = {
  client: "/client",
  specialist: "/specialist",
  admin: "/admin",
};

export function resolveWorkspaceRole(
  pathname: string,
  userRole?: string | null,
): WorkspaceRole {
  if (pathname.startsWith("/admin")) {
    return "admin";
  }
  if (pathname.startsWith("/specialist")) {
    return "specialist";
  }
  if (pathname.startsWith("/client")) {
    return "client";
  }

  if (userRole === "ADMIN") {
    return "admin";
  }
  if (userRole === "SPECIALIST") {
    return "specialist";
  }

  return "client";
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

  if (
    normalizedItem === "/client" ||
    normalizedItem === "/specialist" ||
    normalizedItem === "/admin"
  ) {
    return false;
  }

  return normalizedPath.startsWith(`${normalizedItem}/`);
}

export function getNavigationItems(
  role: WorkspaceRole,
  currentPath: string = "",
): ActiveNavItem[] {
  const items = ROLE_NAVIGATION_MAP[role] ?? ROLE_NAVIGATION_MAP.client;
  return items.map((item) => ({
    ...item,
    active: isNavItemActive(item.href, currentPath),
  }));
}
