import { requireActor } from "@/features/auth/server/actor";
import { UserRole } from "@/domain/identity/types";

export default async function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireActor([UserRole.Client, UserRole.Admin]);
  return children;
}
