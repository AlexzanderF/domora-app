"use client";

import Link from "next/link";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/features/auth/auth-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  const roleLabel =
    user?.role === "SPECIALIST"
      ? "Специалист"
      : user?.role === "ADMIN"
        ? "Администратор"
        : "Клиент";

  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "Д";

  return (
    <>
      <a href="#main" className="skip-link">
        Към съдържанието
      </a>
      <Sidebar />
      <div className="workspace">
        <header>
          <span>Вашият дом. Нашата грижа.</span>
          {user ? (
            <div className="account">
              <span className="avatar" aria-hidden="true">
                {initial}
              </span>
              <span>{user.name}</span>
              <span className="badge">{roleLabel}</span>
              <button
                type="button"
                onClick={() => logout()}
                className="textbutton"
                style={{ marginLeft: "8px" }}
              >
                Изход
              </button>
            </div>
          ) : (
            <div className="account" style={{ gap: "10px" }}>
              <Link
                href="/login"
                className="secondary"
                style={{ textDecoration: "none", padding: "8px 16px" }}
              >
                Вход
              </Link>
              <Link
                href="/signup"
                className="primary"
                style={{ textDecoration: "none", padding: "8px 16px" }}
              >
                Регистрация
              </Link>
            </div>
          )}
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
