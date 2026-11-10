import { UserRole } from "@/domain/identity/types";
import type { User } from "@/domain/identity/types";

export interface AccountDisplay {
  readonly name: string;
  readonly roleLabel: string;
  readonly initial: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Admin]: "Администратор",
  [UserRole.Specialist]: "Специалист",
  [UserRole.Client]: "Клиент",
};

/** Name, role label and avatar initial shown for a signed-in user. */
export function getAccountDisplay(
  user: Pick<User, "name" | "role">,
): AccountDisplay {
  return {
    name: user.name,
    roleLabel: ROLE_LABELS[user.role] ?? ROLE_LABELS[UserRole.Client],
    initial: user.name.trim().charAt(0).toUpperCase() || "Д",
  };
}
