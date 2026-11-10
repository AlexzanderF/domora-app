import type { User } from "@/domain/identity/types";
import { getAccountDisplay, type AccountDisplay } from "./account";
import {
  getNavigationItems,
  type ActiveNavItem,
  type WorkspaceRole,
} from "./sidebar-nav";

export interface DrawerModel {
  readonly items: ActiveNavItem[];
  readonly account: AccountDisplay | null;
}

export function getDrawerModel(
  role: WorkspaceRole,
  pathname: string,
  user: Pick<User, "name" | "role"> | null,
): DrawerModel {
  return {
    items: getNavigationItems(role, pathname),
    account: user ? getAccountDisplay(user) : null,
  };
}
