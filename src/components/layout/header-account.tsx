"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { UserRole, UserStatus } from "@/domain/identity/types";
import type { User } from "@/domain/identity/types";

export function HeaderAccount({ initialUser }: { initialUser?: User | null }) {
  const { user, status, logout } = useAuth();
  const router = useRouter();

  const activeUser = user ?? initialUser ?? null;

  const isPendingOrRejectedSpecialist =
    activeUser?.role === UserRole.Specialist &&
    (activeUser?.status === UserStatus.Pending ||
      activeUser?.status === UserStatus.Rejected);

  useEffect(() => {
    if (isPendingOrRejectedSpecialist && status === "authenticated") {
      router.replace("/pending-approval");
    }
  }, [isPendingOrRejectedSpecialist, status, router]);

  if (isPendingOrRejectedSpecialist) {
    return null;
  }

  const roleLabel =
    activeUser?.role === UserRole.Specialist
      ? "Специалист"
      : activeUser?.role === UserRole.Admin
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
        <StatusBadge>{roleLabel}</StatusBadge>
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
      <Button asChild variant="secondary" className="px-4 py-2">
        <Link href="/login">Вход</Link>
      </Button>
      <Button asChild className="px-4 py-2">
        <Link href="/signup">Регистрация</Link>
      </Button>
    </div>
  );
}
