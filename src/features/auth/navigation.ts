import { UserRole, UserStatus } from "./types";

export function getRoleDashboardPath(
  role?: string | null,
  status?: string | null,
): string {
  if (role === UserRole.Admin) {
    return "/admin";
  }
  if (role === UserRole.Specialist) {
    return status === UserStatus.Pending ? "/pending-approval" : "/specialist";
  }
  return "/client";
}
