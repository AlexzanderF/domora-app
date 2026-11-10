"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "radix-ui";
import { MenuIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import type { PageContainerSize } from "@/components/layout/page-container";
import { cn } from "@/lib/utils";
import { getSiteNav, type SiteHeaderVariant } from "./site-nav";

const desktopLink =
  "inline-flex min-h-11 items-center rounded-[9px] px-3 text-[15px] font-[650] whitespace-nowrap text-[#425750] no-underline hover:text-primary";

function Brand() {
  return (
    <Link
      href="/"
      aria-label="DOMORA начало"
      className="inline-flex min-h-11 items-center gap-2.5 text-[20px] font-extrabold tracking-[0.12em] whitespace-nowrap text-primary no-underline"
    >
      <span
        className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-primary text-[20px] tracking-normal text-white"
        aria-hidden="true"
      >
        ⌂
      </span>
      DOMORA
    </Link>
  );
}

/**
 * Shared site header: 56px sticky bar below lg (hamburger, brand, primary CTA,
 * drawer for the rest); horizontal header from lg. "auth" is the slim variant.
 */
export function SiteHeader({
  variant = "public",
  size = "workspace",
}: {
  variant?: SiteHeaderVariant;
  size?: PageContainerSize;
}) {
  const [open, setOpen] = useState(false);
  const nav = getSiteNav(variant);
  const hasMenu = nav.links.length > 0;
  const drawerLinks = nav.secondary ? [...nav.links, nav.secondary] : nav.links;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur-[12px]">
        <PageContainer
          as="nav"
          size={size}
          aria-label="Основна навигация"
          className={cn(
            "flex h-14 items-center justify-between gap-2 lg:h-[78px] lg:gap-8",
            hasMenu && "px-2 sm:px-3 lg:px-11",
          )}
        >
          {hasMenu && (
            <DialogPrimitive.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Отвори менюто"
              >
                <MenuIcon className="size-6" aria-hidden="true" />
              </Button>
            </DialogPrimitive.Trigger>
          )}
          <Brand />
          {hasMenu && (
            <div className="hidden flex-1 items-center justify-center gap-4 lg:flex">
              {nav.links.map((link) => (
                <Link key={link.href} href={link.href} className={desktopLink}>
                  {link.label}
                </Link>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            {nav.secondary && (
              <Button
                asChild
                variant="secondary"
                className="hidden min-h-11 lg:inline-flex"
              >
                <Link href={nav.secondary.href}>{nav.secondary.label}</Link>
              </Button>
            )}
            <Button asChild className="min-h-11">
              <Link href={nav.primary.href}>{nav.primary.label}</Link>
            </Button>
          </div>
        </PageContainer>
      </header>
      {hasMenu && (
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
              aria-label="Меню"
              className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
            >
              {drawerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-[9px] px-3.5 py-2 text-[15px] text-muted-foreground no-underline"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </DialogPrimitive.Root>
  );
}
