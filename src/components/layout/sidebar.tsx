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
        "fixed inset-y-0 left-0 z-30 hidden w-(--sidebar-width) flex-col items-stretch border-r border-border bg-white transition-[width,padding] duration-200 ease-[ease] lg:flex",
        collapsed ? "items-center px-2.5 py-[30px]" : "px-[18px] py-6",
      )}
      aria-label="Странично меню"
    >
      {onToggleCollapse && (
        <button
          type="button"
          className="absolute top-[92px] -right-3 z-40 hidden size-6 lg:flex cursor-pointer items-center justify-center rounded-md border border-border bg-white p-0 text-muted-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-[ease] hover:scale-[1.08] hover:border-tone-b7cbbf hover:text-primary hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
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
          className="flex w-full items-center justify-center gap-2.5 text-[26px] font-extrabold tracking-[2px] text-primary no-underline"
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
              collapsed && "hidden",
            )}
          >
            DOMORA
          </span>
        </Link>
        <p
          className={cn(
            "mt-1 mb-0 w-full overflow-hidden text-center text-[12px] tracking-[0.8px] text-ellipsis whitespace-nowrap",
            collapsed && "hidden",
          )}
        >
          WE TAKE CARE OF YOUR HOME
        </p>
      </div>
      <nav aria-label="Основна навигация" className="mt-0 grid w-full gap-2">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-[9px] py-3 text-left text-[15px] leading-[1.3] whitespace-nowrap no-underline",
              collapsed
                ? "justify-center gap-0 px-2"
                : "justify-start gap-3 px-3.5",
              item.active
                ? "bg-tone-eaf2ec font-[650] text-primary"
                : "text-muted-foreground",
            )}
            aria-current={item.active ? "page" : undefined}
            title={item.label}
          >
            <span
              className={cn(
                "inline-flex shrink-0 items-center justify-center",
                collapsed ? "text-[20px]" : "w-[22px] text-[18px]",
              )}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <span
              className={cn(
                "overflow-hidden text-ellipsis whitespace-nowrap",
                collapsed && "hidden",
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
