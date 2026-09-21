"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import type { User } from "@/features/auth/types";
import {
  getNavigationItems,
  resolveWorkspaceRole,
  ROLE_DASHBOARD_PATHS,
} from "./sidebar-nav";

export function Sidebar({ initialUser }: { initialUser?: User | null }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user } = useAuth();

  const activeUser = user ?? initialUser ?? null;
  const currentRole = resolveWorkspaceRole(pathname, activeUser?.role);
  const navigation = getNavigationItems(currentRole, pathname);
  const currentRolePath = ROLE_DASHBOARD_PATHS[currentRole];

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
      <div className="asidebottom">
        <div className="demo">ДЕМО ПРОТОТИП</div>
        <label htmlFor="role">Разгледай като</label>
        <select
          id="role"
          aria-label="Разгледай като"
          value={currentRolePath}
          onChange={(event) => router.push(event.target.value)}
        >
          <option value="/client">Клиент</option>
          <option value="/specialist">Специалист</option>
          <option value="/admin">Администратор</option>
        </select>
        <p>Примерни данни. Без реални плащания или изпращане на заявки.</p>
      </div>
    </aside>
  );
}
