"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type {
  ClientRegistrationInput,
  SpecialistRegistrationInput,
  User,
  UserStatus,
} from "./types";
import {
  loginAction,
  logoutAction,
  refreshUserAction,
  registerClientAction,
  registerSpecialistAction,
} from "@/features/auth/server/actions";
import { updateSpecialistStatusAction } from "@/features/admin/server/actions";

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

export interface AuthContextValue {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isAuthenticated: boolean;
  registerClient: (input: ClientRegistrationInput) => Promise<User>;
  registerSpecialist: (input: SpecialistRegistrationInput) => Promise<User>;
  login: (
    identifier: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  updateUserStatus: (
    userId: number,
    status: UserStatus,
  ) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >(initialUser ? "authenticated" : "unauthenticated");

  const [prevInitialUser, setPrevInitialUser] = useState(initialUser);
  if (prevInitialUser !== initialUser) {
    setPrevInitialUser(initialUser);
    setUser(initialUser ?? null);
    setStatus(initialUser ? "authenticated" : "unauthenticated");
  }

  const registerClient = useCallback(
    async (input: ClientRegistrationInput): Promise<User> => {
      const actionResult = await registerClientAction(input);
      if (actionResult.success) {
        setUser(actionResult.user);
        setStatus("authenticated");
        return actionResult.user;
      }
      throw new Error(actionResult.error);
    },
    [],
  );

  const registerSpecialist = useCallback(
    async (input: SpecialistRegistrationInput): Promise<User> => {
      const actionResult = await registerSpecialistAction(input);
      if (actionResult.success) {
        setUser(actionResult.user);
        setStatus("authenticated");
        return actionResult.user;
      }
      throw new Error(actionResult.error);
    },
    [],
  );

  const login = useCallback(
    async (
      identifier: string,
      password: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _rememberMe = true,
    ): Promise<LoginResult> => {
      try {
        const actionResult = await loginAction(identifier, password);
        if (actionResult.success) {
          setUser(actionResult.user);
          setStatus("authenticated");
          return {
            success: true,
            user: actionResult.user,
          };
        }
        return {
          success: false,
          error: actionResult.error,
        };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "Възникна неочаквана грешка при вход.",
        };
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutAction();
    } catch {
      // Ignore errors on logout
    }
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const res = await refreshUserAction();
      if (res.success && res.user) {
        setUser(res.user);
        setStatus("authenticated");
        return res.user;
      }
      setUser(null);
      setStatus("unauthenticated");
      return null;
    } catch {
      return null;
    }
  }, []);

  const updateUserStatus = useCallback(
    async (userId: number, newStatus: UserStatus): Promise<User | null> => {
      if (newStatus === "ACTIVE" || newStatus === "REJECTED") {
        const res = await updateSpecialistStatusAction(userId, newStatus);
        if (!res.success) {
          throw new Error(res.error || "Грешка при актуализиране на статуса.");
        }
      }
      let updatedUser: User | null = null;
      setUser((current) => {
        if (current && current.id === userId) {
          updatedUser = { ...current, status: newStatus };
          return updatedUser;
        }
        return current;
      });
      return updatedUser;
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAuthenticated: status === "authenticated" && user !== null,
        registerClient,
        registerSpecialist,
        login,
        logout,
        refreshUser,
        updateUserStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useSpecialists(): User[] {
  return [];
}
