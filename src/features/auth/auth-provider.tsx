"use client";

import {
  createContext,
  useCallback,
  useContext,
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
  refreshActiveUser,
  registerClientInStore,
  registerSpecialistInStore,
  serverAuthSnapshot,
  setActiveUserId,
  subscribeToAuth,
  updateUserStatusInStore,
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
  registerSpecialist: (input: SpecialistRegistrationInput) => Promise<User>;
  login: (
    identifier: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<LoginResult>;
  logout: () => Promise<void>;
  switchUser: (user: User | null) => void;
  refreshUser: () => Promise<User | null>;
  updateStatus: (status: UserStatus) => Promise<User | null>;
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

  const refreshUser = useCallback(async (): Promise<User | null> => {
    return refreshActiveUser();
  }, []);

  const updateStatus = useCallback(
    async (status: UserStatus): Promise<User | null> => {
      if (!snapshot.user) return null;
      return updateUserStatusInStore(snapshot.user.id, status);
    },
    [snapshot.user],
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
        switchUser,
        refreshUser,
        updateStatus,
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
