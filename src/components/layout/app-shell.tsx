import { getServerSession } from "@/features/auth/server/session";
import { Sidebar } from "./sidebar";
import { HeaderAccount } from "./header-account";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const serverUser = await getServerSession();

  return (
    <>
      <a href="#main" className="skip-link">
        Към съдържанието
      </a>
      <Sidebar />
      <div className="workspace">
        <header>
          <span>Вашият дом. Нашата грижа.</span>
          <HeaderAccount initialUser={serverUser} />
        </header>
        <main id="main">{children}</main>
        <footer>
          DOMORA © 2026{" "}
          <span>Прототип · данните са само за текущото разглеждане</span>
        </footer>
      </div>
    </>
  );
}
