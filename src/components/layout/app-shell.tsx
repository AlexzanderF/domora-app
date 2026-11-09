import { SkipLink } from "@/components/skip-link";
import { getServerSession } from "@/features/auth/server/session";
import { WorkspaceShell } from "./workspace-shell";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const serverUser = await getServerSession();

  return (
    <>
      <SkipLink />
      <WorkspaceShell initialUser={serverUser}>{children}</WorkspaceShell>
    </>
  );
}
