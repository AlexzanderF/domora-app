import { requireActor } from "@/features/auth/server/actor";
import { UserRole } from "@/domain/identity/types";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireActor([UserRole.Admin]);
  return children;
}
