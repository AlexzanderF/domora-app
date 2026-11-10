"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { AccountAvatar } from "./account-avatar";
import { getAccountDisplay } from "./account";
import { useLogout } from "./use-logout";
import { UserRole, UserStatus } from "@/domain/identity/types";
import type { User } from "@/domain/identity/types";

export function HeaderAccount({ initialUser }: { initialUser?: User | null }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const logout = useLogout();

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

  if (activeUser) {
    const { name, roleLabel, initial } = getAccountDisplay(activeUser);
    return (
      <div className="flex items-center gap-2.5 text-foreground">
        <AccountAvatar initial={initial} />
        <span>{name}</span>
        <StatusBadge>{roleLabel}</StatusBadge>
        <Button
          type="button"
          variant="link"
          onClick={() => void logout()}
          className="ml-2 rounded-none px-1.5 py-px text-[14px]"
          aria-label="Изход от профила"
        >
          Изход
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 text-foreground">
      <Button asChild variant="secondary" className="px-4 py-2">
        <Link href="/login">Вход</Link>
      </Button>
      <Button asChild className="px-4 py-2">
        <Link href="/signup">Регистрация</Link>
      </Button>
    </div>
  );
}
