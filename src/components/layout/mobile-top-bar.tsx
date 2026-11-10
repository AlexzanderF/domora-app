"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { MenuIcon, XIcon } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import type { User } from "@/domain/identity/types";
import { cn } from "@/lib/utils";
import { getDrawerModel } from "./drawer-nav";
import { resolveWorkspaceRole } from "./sidebar-nav";

export function MobileTopBar({ initialUser }: { initialUser?: User | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, logout } = useAuth();

  const activeUser = user ?? initialUser ?? null;
  const role = resolveWorkspaceRole(pathname, activeUser?.role);
  const { items, account } = getDrawerModel(role, pathname, activeUser);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-white px-2 lg:hidden">
        <DialogPrimitive.Trigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Отвори менюто"
          >
            <MenuIcon className="size-6" aria-hidden="true" />
          </Button>
        </DialogPrimitive.Trigger>
        <Link
          href="/"
          className="flex items-center gap-2 text-[20px] font-extrabold tracking-[2px] text-primary no-underline"
          title="DOMORA Начало"
        >
          <span
            className="grid size-8 place-items-center rounded-[10px] bg-primary text-[24px] text-white"
            aria-hidden="true"
          >
            ⌂
          </span>
          DOMORA
        </Link>
        <span
          className="mr-2 inline-grid size-9 place-items-center rounded-full bg-tone-e9efdc font-semibold text-foreground"
          aria-hidden="true"
        >
          {account?.initial ?? "Д"}
        </span>
      </header>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 lg:hidden" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-80 flex-col bg-white pb-[env(safe-area-inset-bottom)] shadow-xl outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left lg:hidden"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <DialogPrimitive.Title className="text-[20px] font-extrabold tracking-[2px] text-primary">
              DOMORA
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Затвори менюто"
              >
                <XIcon className="size-6" aria-hidden="true" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <nav
            aria-label="Основна навигация"
            className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-[9px] px-3.5 py-2 text-[15px] no-underline",
                  item.active
                    ? "bg-tone-eaf2ec font-[650] text-primary"
                    : "text-muted-foreground",
                )}
                aria-current={item.active ? "page" : undefined}
              >
                <span
                  className="inline-flex w-[22px] shrink-0 justify-center text-[18px]"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
          {account && (
            <div className="shrink-0 border-t border-border p-4">
              <div className="mb-3 flex items-center gap-2.5 text-foreground">
                <span
                  className="inline-grid size-[34px] shrink-0 place-items-center rounded-full bg-tone-e9efdc font-semibold"
                  aria-hidden="true"
                >
                  {account.initial}
                </span>
                <span className="min-w-0 flex-1 truncate">{account.name}</span>
                <StatusBadge>{account.roleLabel}</StatusBadge>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={async () => {
                  await logout();
                  setOpen(false);
                  router.push("/login");
                }}
                aria-label="Изход от профила"
              >
                Изход
              </Button>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
