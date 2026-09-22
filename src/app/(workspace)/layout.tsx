import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (isDbConfigured) {
    const user = await getServerSession();
    if (!user) {
      redirect("/api/auth/logout?next=/login");
    }
  }

  return <AppShell>{children}</AppShell>;
}
