"use client";

import { useSyncExternalStore } from "react";
import { Sidebar } from "./sidebar";
import { HeaderAccount } from "./header-account";
import type { User } from "@/features/auth/types";

const SIDEBAR_STORAGE_KEY = "domora_sidebar_collapsed";

function subscribe(callback: () => void) {
  window.addEventListener("domora_sidebar_toggle", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("domora_sidebar_toggle", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function WorkspaceShell({
  initialUser,
  children,
}: {
  initialUser?: User | null;
  children: React.ReactNode;
}) {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const handleToggle = () => {
    try {
      const next = !getSnapshot();
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      window.dispatchEvent(new Event("domora_sidebar_toggle"));
    } catch {
      // Ignore localStorage errors
    }
  };

  return (
    <div
      className={`workspace-container ${collapsed ? "sidebar-collapsed" : ""}`}
      data-sidebar-collapsed={collapsed ? "true" : "false"}
    >
      <Sidebar
        initialUser={initialUser}
        collapsed={collapsed}
        onToggleCollapse={handleToggle}
      />
      <div className="workspace">
        <header>
          <HeaderAccount initialUser={initialUser} />
        </header>
        <main id="main">{children}</main>
        <footer>
          DOMORA © 2026{" "}
          <span>Прототип · данните са само за текущото разглеждане</span>
        </footer>
      </div>
    </div>
  );
}
