"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import type { User } from "@/features/auth/types";
import { getNavigationItems, resolveWorkspaceRole } from "./sidebar-nav";

export function Sidebar({ initialUser }: { initialUser?: User | null }) {
  const pathname = usePathname() ?? "";
  const { user } = useAuth();

  const activeUser = user ?? initialUser ?? null;
  const currentRole = resolveWorkspaceRole(pathname, activeUser?.role);
  const navigation = getNavigationItems(currentRole, pathname);

  return (
    <aside>
      <Link className="brand" href="/">
        <span className="mark">⌂</span> DOMORA
      </Link>
      <p className="tagline">WE TAKE CARE OF YOUR HOME</p>
      <div className="navlabel">МОЕТО ПРОСТРАНСТВО</div>
      <nav aria-label="Основна навигация">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={item.active ? "selected" : ""}
            aria-current={item.active ? "page" : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
