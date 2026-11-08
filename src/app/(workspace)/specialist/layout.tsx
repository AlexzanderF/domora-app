import { requireActor } from "@/features/auth/server/actor";
import { UserRole } from "@/features/auth/types";

export default async function SpecialistLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireActor([UserRole.Specialist, UserRole.Admin]);
  return children;
}
