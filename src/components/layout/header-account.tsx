"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";

export function HeaderAccount() {
  const { user, status, logout } = useAuth();
  const router = useRouter();

  const isPendingOrRejectedSpecialist =
    status === "authenticated" &&
    user?.role === "SPECIALIST" &&
    (user?.status === "PENDING" || user?.status === "REJECTED");

  useEffect(() => {
    if (isPendingOrRejectedSpecialist) {
      router.replace("/pending-approval");
    }
  }, [isPendingOrRejectedSpecialist, router]);

  if (isPendingOrRejectedSpecialist) {
    return null;
  }

  const roleLabel =
    user?.role === "SPECIALIST"
      ? "Специалист"
      : user?.role === "ADMIN"
        ? "Администратор"
        : "Клиент";

  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "Д";

  if (user) {
    return (
      <div className="account">
        <span className="avatar" aria-hidden="true">
          {initial}
        </span>
        <span>{user.name}</span>
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
