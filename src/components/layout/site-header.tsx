"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import type { PageContainerSize } from "@/components/layout/page-container";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { NavDrawer, NavDrawerTrigger } from "./nav-drawer";
import { getSiteNav, type SiteHeaderVariant } from "./site-nav";

const desktopLink =
  "inline-flex min-h-11 items-center rounded-[9px] px-3 text-[15px] font-[650] whitespace-nowrap text-[#425750] no-underline hover:text-primary";

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
          {hasMenu && <NavDrawerTrigger className="lg:hidden" />}
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
            <Button
              asChild
              className="min-h-11 px-3.5 text-sm lg:px-4 lg:text-base"
            >
              <Link href={nav.primary.href}>{nav.primary.label}</Link>
            </Button>
          </div>
        </PageContainer>
      </header>
      {hasMenu && (
        <NavDrawer
          navLabel="Меню"
          items={drawerLinks}
          onNavigate={() => setOpen(false)}
        />
      )}
    </DialogPrimitive.Root>
  );
}
