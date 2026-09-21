export function getRoleDashboardPath(
  role?: string | null,
  status?: string | null,
): string {
  if (role === "ADMIN") {
    return "/admin";
  }
  if (role === "SPECIALIST") {
    return status === "PENDING" ? "/pending-approval" : "/specialist";
  }
  return "/client";
}
