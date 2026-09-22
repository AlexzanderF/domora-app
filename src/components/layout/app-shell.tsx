import { getServerSession } from "@/features/auth/server/session";
import { WorkspaceShell } from "./workspace-shell";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const serverUser = await getServerSession();

  return (
    <>
      <a href="#main" className="skip-link">
        Към съдържанието
      </a>
      <WorkspaceShell initialUser={serverUser}>{children}</WorkspaceShell>
    </>
  );
}
