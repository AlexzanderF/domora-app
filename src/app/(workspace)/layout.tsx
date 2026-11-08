import { AppShell } from "@/components/layout/app-shell";
import { requireActor } from "@/features/auth/server/actor";

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireActor();

  return <AppShell>{children}</AppShell>;
}
