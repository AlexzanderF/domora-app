import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Към съдържанието
      </a>
      <Sidebar />
      <div className="workspace">
        <header>
          <span>Вашият дом. Нашата грижа.</span>
          <div className="account">
            <span className="avatar">Д</span> Демо профил
          </div>
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
