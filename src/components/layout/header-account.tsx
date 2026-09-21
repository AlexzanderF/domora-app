"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import type { User } from "@/features/auth/types";

export function HeaderAccount({ initialUser }: { initialUser?: User | null }) {
  const { user, status, logout } = useAuth();
  const router = useRouter();

  const activeUser = user ?? initialUser ?? null;

  const isPendingOrRejectedSpecialist =
    activeUser?.role === "SPECIALIST" &&
    (activeUser?.status === "PENDING" || activeUser?.status === "REJECTED");

  useEffect(() => {
    if (isPendingOrRejectedSpecialist && status === "authenticated") {
      router.replace("/pending-approval");
    }
  }, [isPendingOrRejectedSpecialist, status, router]);

  if (isPendingOrRejectedSpecialist) {
    return null;
  }

  const roleLabel =
    activeUser?.role === "SPECIALIST"
      ? "Специалист"
      : activeUser?.role === "ADMIN"
        ? "Администратор"
        : "Клиент";

  const initial = activeUser?.name
    ? activeUser.name.trim().charAt(0).toUpperCase()
    : "Д";

  if (activeUser) {
    return (
      <div className="account">
        <span className="avatar" aria-hidden="true">
          {initial}
        </span>
        <span>{activeUser.name}</span>
        <span className="badge">{roleLabel}</span>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
          className="textbutton"
          style={{ marginLeft: "8px", cursor: "pointer" }}
          aria-label="Изход от профила"
        >
          Изход
        </button>
      </div>
    );
  }

  return (
    <div className="account" style={{ gap: "10px" }}>
      <Link
        href="/login"
        className="secondary"
        style={{ textDecoration: "none", padding: "8px 16px" }}
      >
        Вход
      </Link>
      <Link
        href="/signup"
        className="primary"
        style={{ textDecoration: "none", padding: "8px 16px" }}
      >
        Регистрация
      </Link>
    </div>
  );
}
