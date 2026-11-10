"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";

/** Signs out, runs the optional callback, then returns to the login page. */
export function useLogout() {
  const { logout } = useAuth();
  const router = useRouter();
  return async (afterLogout?: () => void) => {
    await logout();
    afterLogout?.();
    router.push("/login");
  };
}
