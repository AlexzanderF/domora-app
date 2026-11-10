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
        collapsed
          ? "[--sidebar-width:72px]"
          : "[--sidebar-width:250px] lg:[--sidebar-width:270px]",
      )}
      data-sidebar-collapsed={collapsed ? "true" : "false"}
    >
      <Sidebar
        initialUser={initialUser}
        collapsed={collapsed}
        onToggleCollapse={handleToggle}
      />
      <div className="transition-[margin-left] duration-200 ease-[ease] md:ml-(--sidebar-width)">
        <header className="sticky top-0 z-20 hidden h-[72px] items-center justify-end border-b border-border bg-white px-7 text-[14px] text-muted-foreground md:flex lg:px-11">
          <HeaderAccount initialUser={initialUser} />
        </header>
        <main
          id="main"
          className="mx-auto min-h-[65svh] max-w-330 scroll-mt-[72px] px-[18px] py-6 md:min-h-[calc(100dvh-130px)] md:p-7 lg:px-11 lg:py-[38px] 2xl:pt-[50px]"
        >
          {children}
        </main>
        <footer className="block px-5 py-4 text-[12px] text-muted-foreground md:flex md:justify-between md:px-11 md:pt-2.5 md:pb-[22px]">
          DOMORA © 2026{" "}
          <span className="mt-1.5 block md:mt-0 md:inline">
            Прототип · данните са само за текущото разглеждане
          </span>
        </footer>
      </div>
    </div>
  );
}
