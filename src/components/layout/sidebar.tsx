"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import type { User } from "@/domain/identity/types";
import { cn } from "@/lib/utils";
import { getNavigationItems, resolveWorkspaceRole } from "./sidebar-nav";

export function Sidebar({
  initialUser,
  collapsed = false,
  onToggleCollapse,
}: {
  initialUser?: User | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname() ?? "";
  const { user } = useAuth();

  const activeUser = user ?? initialUser ?? null;
  const currentRole = resolveWorkspaceRole(pathname, activeUser?.role);
  const navigation = getNavigationItems(currentRole, pathname);

  return (
    <aside
      className={cn(
        "z-30 flex w-full flex-col items-stretch border-border bg-white px-5 py-[18px] transition-[width,padding] duration-200 ease-[ease] md:fixed md:inset-y-0 md:left-0 md:w-(--sidebar-width) md:border-r",
        collapsed
          ? "md:items-center md:px-2 md:py-6 lg:px-2.5 lg:py-[30px]"
          : "md:px-3.5 md:py-[26px] lg:px-[18px] lg:py-6",
      )}
      aria-label="Странично меню"
    >
      {onToggleCollapse && (
        <button
          type="button"
          className="absolute top-[92px] -right-3 z-40 hidden size-6 cursor-pointer items-center justify-center rounded-md border border-border bg-white p-0 text-muted-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-[ease] hover:scale-[1.08] hover:border-tone-b7cbbf hover:text-primary hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
          onClick={onToggleCollapse}
          aria-label={
            collapsed ? "Разгъни страничното меню" : "Свий страничното меню"
          }
          title={
            collapsed ? "Разгъни страничното меню" : "Свий страничното меню"
          }
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="7 16 3 12 7 8" />
            <polyline points="17 8 21 12 17 16" />
          </svg>
        </button>
      )}
      <div className="mb-1.5 flex w-full flex-col items-center justify-center text-center">
        <Link
          className="flex w-full items-center justify-center gap-2.5 text-[23px] font-extrabold tracking-[2px] text-primary no-underline md:text-[22px] lg:text-[26px]"
          href="/"
          title="DOMORA Начало"
        >
          <span
            className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-primary text-[30px] text-white"
            aria-hidden="true"
          >
            ⌂
          </span>
          <span
            className={cn(
              "overflow-hidden text-ellipsis whitespace-nowrap",
              collapsed && "md:hidden",
            )}
          >
            DOMORA
          </span>
        </Link>
        <p
          className={cn(
            "mt-1 mb-0 hidden w-full overflow-hidden text-center text-[12px] tracking-[0.8px] text-ellipsis whitespace-nowrap md:block",
            collapsed && "md:hidden",
          )}
        >
          WE TAKE CARE OF YOUR HOME
        </p>
      </div>
      <nav
        aria-label="Основна навигация"
        className="mt-0 flex w-full gap-1.5 overflow-x-auto [scrollbar-width:none] md:grid md:gap-2 md:overflow-visible"
      >
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-[1_0_auto] items-center justify-center gap-1.5 rounded-[9px] px-2.5 py-2 text-[13px] leading-[1.3] whitespace-nowrap no-underline md:flex-none md:py-3 md:text-left md:text-[15px]",
              collapsed
                ? "md:justify-center md:gap-0 md:px-2"
                : "md:justify-start md:gap-3 md:px-3.5",
              item.active
                ? "bg-tone-eaf2ec font-[650] text-primary"
                : "text-muted-foreground",
            )}
            aria-current={item.active ? "page" : undefined}
            title={item.label}
          >
            <span
              className={cn(
                "inline-flex w-auto shrink-0 items-center justify-center text-[16px]",
                collapsed ? "md:text-[20px]" : "md:w-[22px] md:text-[18px]",
              )}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <span
              className={cn(
                "overflow-hidden text-ellipsis whitespace-nowrap",
                collapsed && "md:hidden",
              )}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
