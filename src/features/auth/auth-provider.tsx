"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import type {
  ClientRegistrationInput,
  SpecialistRegistrationInput,
  User,
  UserStatus,
} from "./types";
import {
  authenticateUser,
  clearActiveSession,
  getAuthSnapshot,
  getSpecialistsSnapshot,
  getServerSpecialistsSnapshot,
  refreshActiveUser,
  registerClientInStore,
  registerSpecialistInStore,
  serverAuthSnapshot,
  subscribeToAuth,
  syncExternalUser,
  updateUserStatusInStore,
} from "./auth-store";
import {
  loginAction,
  logoutAction,
  registerClientAction,
} from "@/features/auth/server/actions";

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
    userId: string,
    status: UserStatus,
  ) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function subscribe(callback: () => void): () => void {
  const unsub = subscribeToAuth(callback);
  const storageHandler = () => callback();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", storageHandler);
  }
  return () => {
    unsub();
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", storageHandler);
    }
  };
}

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getAuthSnapshot,
    () => serverAuthSnapshot,
  );

  useEffect(() => {
    if (initialUser) {
      syncExternalUser(initialUser);
    }
  }, [initialUser]);

  const registerClient = useCallback(
    async (input: ClientRegistrationInput): Promise<User> => {
      try {
        const actionResult = await registerClientAction(input);
        if ("mode" in actionResult && actionResult.mode === "demo") {
          return registerClientInStore(input);
        }
        if (actionResult.success) {
          syncExternalUser(actionResult.user);
          return actionResult.user;
        }
        throw new Error(actionResult.error);
      } catch (error) {
        if (
          error instanceof Error &&
          !error.message.includes("fetch") &&
          !error.message.includes("network")
        ) {
          throw error;
        }
        return registerClientInStore(input);
      }
    },
    [],
  );

  const registerSpecialist = useCallback(
    async (input: SpecialistRegistrationInput): Promise<User> => {
      const newUser = registerSpecialistInStore(input);
      return newUser;
    },
    [],
  );

  const login = useCallback(
    async (
      identifier: string,
      password: string,
      rememberMe = true,
    ): Promise<LoginResult> => {
      try {
        const actionResult = await loginAction(identifier, password);
        if ("mode" in actionResult && actionResult.mode === "demo") {
          const authed = authenticateUser(identifier, password, rememberMe);
          if (!authed) {
            return {
              success: false,
              error: "Невалиден имейл/телефон или парола.",
            };
          }
          return {
            success: true,
            user: authed,
          };
        }

        if (actionResult.success) {
          syncExternalUser(actionResult.user);
          return {
            success: true,
            user: actionResult.user,
          };
        }

        return {
          success: false,
          error: actionResult.error,
        };
      } catch {
        const authed = authenticateUser(identifier, password, rememberMe);
        if (!authed) {
          return {
            success: false,
            error: "Невалиден имейл/телефон или парола.",
          };
        }
        return {
          success: true,
          user: authed,
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
    clearActiveSession();
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    return refreshActiveUser();
  }, []);

  const updateUserStatus = useCallback(
    async (userId: string, status: UserStatus): Promise<User | null> => {
      return updateUserStatusInStore(userId, status);
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user: snapshot.user,
        status: snapshot.status,
        isAuthenticated:
          snapshot.status === "authenticated" && snapshot.user !== null,
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
  const specialists = useSyncExternalStore(
    subscribe,
    getSpecialistsSnapshot,
    getServerSpecialistsSnapshot,
  );
  return specialists;
}
