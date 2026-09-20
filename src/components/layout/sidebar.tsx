"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname.startsWith("/admin");
  const rolePath = isAdmin
    ? "/admin"
    : pathname.startsWith("/specialist")
      ? "/specialist"
      : "/";

  const navigation = [
    { href: isAdmin ? "/admin" : "/", label: "Начало", icon: "⌂" },
    ...(isAdmin
      ? [{ href: "/admin/specialists", label: "Специалисти", icon: "👥" }]
      : []),
    { href: "/requests", label: "Моите заявки", icon: "▤" },
    { href: "/plans", label: "Абонаменти", icon: "◈" },
  ];
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
            className={
              pathname.replace(/\/$/, "") === item.href.replace(/\/$/, "")
                ? "selected"
                : ""
            }
            aria-current={
              pathname.replace(/\/$/, "") === item.href.replace(/\/$/, "")
                ? "page"
                : undefined
            }
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
          value={rolePath}
          onChange={(event) => router.push(event.target.value)}
        >
          <option value="/">Клиент</option>
          <option value="/specialist">Специалист</option>
          <option value="/admin">Администратор</option>
        </select>
        <p>Примерни данни. Без реални плащания или изпращане на заявки.</p>
      </div>
    </aside>
  );
}
