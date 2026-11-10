import { UserRole } from "@/domain/identity/types";
import type { User } from "@/domain/identity/types";
import {
  getNavigationItems,
  type ActiveNavItem,
  type WorkspaceRole,
} from "./sidebar-nav";

export interface DrawerAccount {
  readonly name: string;
  readonly roleLabel: string;
  readonly initial: string;
}

export interface DrawerModel {
  readonly items: ActiveNavItem[];
  readonly account: DrawerAccount | null;
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Admin]: "Администратор",
  [UserRole.Specialist]: "Специалист",
  [UserRole.Client]: "Клиент",
};

export function getDrawerModel(
  role: WorkspaceRole,
  pathname: string,
  user: Pick<User, "name" | "role"> | null,
): DrawerModel {
  return {
    items: getNavigationItems(role, pathname),
    account: user
      ? {
          name: user.name,
          roleLabel: ROLE_LABELS[user.role] ?? ROLE_LABELS[UserRole.Client],
          initial: user.name.trim().charAt(0).toUpperCase() || "Д",
        }
      : null,
  };
}
