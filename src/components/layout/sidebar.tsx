"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import type { User } from "@/features/auth/types";
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
    <aside aria-label="Странично меню">
      {onToggleCollapse && (
        <button
          type="button"
          className="collapse-edge-toggle"
          style={{ top: "100px" }}
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
      <div className="sidebar-brand-block">
        <Link className="brand" href="/" title="DOMORA Начало">
          <span className="mark" aria-hidden="true">
            ⌂
          </span>
          <span className="brand-text">DOMORA</span>
        </Link>
        <p className="tagline">WE TAKE CARE OF YOUR HOME</p>
      </div>
      <nav aria-label="Основна навигация">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={item.active ? "selected" : ""}
            aria-current={item.active ? "page" : undefined}
            title={item.label}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
