import { redirect } from "next/navigation";
import { isDbConfigured } from "@/db";
import type { Actor } from "@/domain/authorization";
import { getRoleDashboardPath } from "../navigation";
import { UserRole, UserStatus } from "../types";
import { getServerSession } from "./session";

export async function getActor(): Promise<Actor | null> {
  const user = await getServerSession();
  return user ? { id: user.id, role: user.role, status: user.status } : null;
}

// Guard for pages and layouts. Returns null only in demo mode (no database),
// where there is no session to check. Otherwise it either returns the actor or
// redirects: unauthenticated or rejected -> login, pending specialist ->
// pending-approval, wrong role -> the actor's own dashboard.
export async function requireActor(
  roles?: readonly UserRole[],
): Promise<Actor | null> {
  if (!isDbConfigured) return null;

  const actor = await getActor();
  if (!actor) {
    redirect("/api/auth/logout?next=/login");
  }
  if (actor.role === UserRole.Specialist) {
    if (actor.status === UserStatus.Pending) {
      redirect("/pending-approval");
    }
    if (actor.status === UserStatus.Rejected) {
      redirect("/api/auth/logout?next=/login");
    }
  }
  if (roles && !roles.includes(actor.role)) {
    redirect(getRoleDashboardPath(actor.role, actor.status));
  }
  return actor;
}
