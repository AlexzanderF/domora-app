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
      <div className="aside-header">
        <Link className="brand" href="/" title="DOMORA Начало">
          <span className="mark" aria-hidden="true">
            ⌂
          </span>
          <span className="brand-text">DOMORA</span>
        </Link>
        {onToggleCollapse && (
          <button
            type="button"
            className="collapse-toggle"
            onClick={onToggleCollapse}
            aria-label={
              collapsed ? "Разгъни страничното меню" : "Свий страничното меню"
            }
            title={
              collapsed ? "Разгъни страничното меню" : "Свий страничното меню"
            }
          >
            {collapsed ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="m14 9 3 3-3 3" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="m16 15-3-3 3-3" />
              </svg>
            )}
          </button>
        )}
      </div>
      <p className="tagline">WE TAKE CARE OF YOUR HOME</p>
      <div className="navlabel">МОЕТО ПРОСТРАНСТВО</div>
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
