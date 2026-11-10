"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import type { User } from "@/domain/identity/types";
import { AccountAvatar } from "./account-avatar";
import { Brand } from "./brand";
import { getDrawerModel } from "./drawer-nav";
import { NavDrawer, NavDrawerTrigger } from "./nav-drawer";
import { resolveWorkspaceRole } from "./sidebar-nav";
import { useLogout } from "./use-logout";

export function MobileTopBar({ initialUser }: { initialUser?: User | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const logout = useLogout();
  const { user } = useAuth();

  const activeUser = user ?? initialUser ?? null;
  const role = resolveWorkspaceRole(pathname, activeUser?.role);
  const { items, account } = getDrawerModel(role, pathname, activeUser);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-white px-2 lg:hidden">
        <NavDrawerTrigger />
        <Brand />
        <AccountAvatar
          initial={account?.initial ?? "Д"}
          className="mr-2 size-9"
        />
      </header>
      <NavDrawer
        navLabel="Основна навигация"
        items={items}
        onNavigate={() => setOpen(false)}
        footer={
          account && (
            <div className="shrink-0 border-t border-border p-4">
              <div className="mb-3 flex items-center gap-2.5 text-foreground">
                <AccountAvatar initial={account.initial} />
                <span className="min-w-0 flex-1 truncate">{account.name}</span>
                <StatusBadge>{account.roleLabel}</StatusBadge>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => void logout(() => setOpen(false))}
                aria-label="Изход от профила"
              >
                Изход
              </Button>
            </div>
          )
        }
      />
    </DialogPrimitive.Root>
  );
}
