"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import type { ClientRegistrationInput, User } from "./types";
import {
  authenticateUser,
  clearActiveSession,
  getAuthSnapshot,
  registerClientInStore,
  serverAuthSnapshot,
  setActiveUserId,
  subscribeToAuth,
} from "./auth-store";

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
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  switchUser: (user: User | null) => void;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getAuthSnapshot,
    () => serverAuthSnapshot,
  );

  const registerClient = useCallback(
    async (input: ClientRegistrationInput): Promise<User> => {
      const newUser = registerClientInStore(input);
      return newUser;
    },
    [],
  );

  const login = useCallback(
    async (identifier: string, password: string): Promise<LoginResult> => {
      const authed = authenticateUser(identifier, password);
      if (!authed) {
        return {
          success: false,
          error: "Невалиден имейл/телефон или грешна парола.",
        };
      }
      return {
        success: true,
        user: authed,
      };
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    clearActiveSession();
  }, []);

  const switchUser = useCallback((nextUser: User | null) => {
    if (nextUser) {
      setActiveUserId(nextUser.id);
    } else {
      clearActiveSession();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: snapshot.user,
        status: snapshot.status,
        isAuthenticated:
          snapshot.status === "authenticated" && snapshot.user !== null,
        registerClient,
        login,
        logout,
        switchUser,
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
