"use client";

import { useSyncExternalStore } from "react";
import { Sidebar } from "./sidebar";
import { HeaderAccount } from "./header-account";
import type { User } from "@/domain/identity/types";
import { cn } from "@/lib/utils";

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
      className={cn(
        "[--sidebar-width:270px]",
        collapsed
          ? "[--sidebar-width:72px]"
          : "shell-tablet:[--sidebar-width:250px]",
      )}
      data-workspace-shell=""
      data-sidebar-collapsed={collapsed ? "true" : "false"}
    >
      <Sidebar
        initialUser={initialUser}
        collapsed={collapsed}
        onToggleCollapse={handleToggle}
      />
      <div className="ml-(--sidebar-width) transition-[margin-left] duration-200 ease-[ease] shell-phone:ml-0">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-end border-b border-border bg-white px-11 text-[14px] text-muted-foreground shell-tablet:px-7 shell-phone:hidden">
          <HeaderAccount initialUser={initialUser} />
        </header>
        <main
          id="main"
          className="mx-auto min-h-[calc(100vh-130px)] max-w-[1320px] scroll-mt-[72px] px-11 py-[38px] min-[1500px]:pt-[50px] shell-tablet:p-7 shell-phone:min-h-[65vh] shell-phone:px-[18px] shell-phone:py-6"
        >
          {children}
        </main>
        <footer className="flex justify-between px-11 pt-2.5 pb-[22px] text-[12px] text-muted-foreground shell-phone:block shell-phone:px-5 shell-phone:py-4">
          DOMORA © 2026{" "}
          <span className="shell-phone:mt-1.5 shell-phone:block">
            Прототип · данните са само за текущото разглеждане
          </span>
        </footer>
      </div>
    </div>
  );
}
