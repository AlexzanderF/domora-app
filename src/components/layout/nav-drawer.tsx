"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "radix-ui";
import { MenuIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NavDrawerItem = {
  href: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
};

/** Hamburger button that opens the surrounding NavDrawer. */
export function NavDrawerTrigger({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Trigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={className}
        aria-label="Отвори менюто"
      >
        <MenuIcon className="size-6" aria-hidden="true" />
      </Button>
    </DialogPrimitive.Trigger>
  );
}

/**
 * Left-hand drawer shared by the workspace top bar and the site header (below
 * lg). Render inside a `DialogPrimitive.Root`; `footer` is pinned under the links.
 */
export function NavDrawer({
  navLabel,
  items,
  onNavigate,
  footer,
}: {
  navLabel: string;
  items: readonly NavDrawerItem[];
  onNavigate: () => void;
  footer?: ReactNode;
}) {
  return (
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
          aria-label={navLabel}
          className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-[9px] px-3.5 py-2 text-[15px] no-underline",
                item.active
                  ? "bg-tone-eaf2ec font-[650] text-primary"
                  : "text-muted-foreground",
              )}
              aria-current={item.active ? "page" : undefined}
            >
              {item.icon !== undefined && (
                <span
                  className="inline-flex w-[22px] shrink-0 justify-center text-[18px]"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
              )}
              {item.label}
            </Link>
          ))}
        </nav>
        {footer}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
