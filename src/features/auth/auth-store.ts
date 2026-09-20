import type {
  ClientRegistrationInput,
  SpecialistRegistrationInput,
  User,
  UserStatus,
} from "./types";
import {
  validateClientRegistration,
  validateSpecialistRegistration,
} from "./validation";

export interface StoredUser extends User {
  password: string;
}

export interface AuthSnapshot {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

export const initialSeedUsers: StoredUser[] = [
  {
    id: "client-demo-1",
    name: "Иван Иванов",
    email: "client@domora.bg",
    phone: "0888123456",
    password: "password123",
    role: "CLIENT",
    status: "ACTIVE",
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "spec-pending-1",
    name: "Димитър Петров",
    email: "dimitar@vik-master.bg",
    phone: "0888765432",
    password: "password123",
    role: "SPECIALIST",
    status: "PENDING",
    specialistProfile: {
      category: "ВиК",
      area: "София",
      experienceYears: 7,
      bio: "ВиК майстор с дългогодишен опит в аварийни и планови ремонти.",
      companyName: "ВиК Мастер ЕООД",
      eik: "204567891",
    },
    createdAt: "2026-02-01T11:00:00.000Z",
    updatedAt: "2026-02-01T11:00:00.000Z",
  },
  {
    id: "spec-active-1",
    name: "Георги Тодоров",
    email: "georgi@el-service.bg",
    phone: "0878123456",
    password: "password123",
    role: "SPECIALIST",
    status: "ACTIVE",
    specialistProfile: {
      category: "Електро",
      area: "София и област",
      experienceYears: 10,
      bio: "Лицензиран електротехник за битови инсталации и табла.",
    },
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "admin-1",
    name: "Администратор",
    email: "admin@domora.bg",
    phone: "0899000111",
    password: "adminpassword",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2026-01-01T08:00:00.000Z",
    updatedAt: "2026-01-01T08:00:00.000Z",
  },
];

const STORAGE_KEY_USERS = "domora_auth_users";
const STORAGE_KEY_ACTIVE_USER = "domora_auth_active_user_id";

// In-memory fallback state
let memoryUsers: StoredUser[] = [...initialSeedUsers];
let memoryActiveUserId: string | null = null;

// Subscriptions
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeToAuth(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function safeLocalStorageGet(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore quota or security errors
  }
}

function safeLocalStorageRemove(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

export function toPublicUser(stored: StoredUser): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...user } = stored;
  return user;
}

export function getStoredUsers(): StoredUser[] {
  const json = safeLocalStorageGet(STORAGE_KEY_USERS);
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryUsers = parsed;
        return parsed;
      }
    } catch {
      // Fallback to memory
    }
  }
  return memoryUsers;
}

export function saveStoredUsers(users: StoredUser[]): void {
  memoryUsers = users;
  safeLocalStorageSet(STORAGE_KEY_USERS, JSON.stringify(users));
  notifyListeners();
}

export function getActiveUserId(): string | null {
  const storedId = safeLocalStorageGet(STORAGE_KEY_ACTIVE_USER);
  if (storedId !== null) {
    memoryActiveUserId = storedId;
    return storedId;
  }
  return memoryActiveUserId;
}

export function setActiveUserId(id: string | null): void {
  memoryActiveUserId = id;
  if (id === null) {
    safeLocalStorageRemove(STORAGE_KEY_ACTIVE_USER);
  } else {
    safeLocalStorageSet(STORAGE_KEY_ACTIVE_USER, id);
  }
  notifyListeners();
}

export function getActiveUser(): User | null {
  const id = getActiveUserId();
  if (!id) return null;
  const users = getStoredUsers();
  const found = users.find((u) => u.id === id);
  return found ? toPublicUser(found) : null;
}

export function findUserById(id: string): User | null {
  const users = getStoredUsers();
  const found = users.find((u) => u.id === id);
  return found ? toPublicUser(found) : null;
}

let cachedSnapshot: AuthSnapshot = {
  user: null,
  status: "unauthenticated",
};

export function getAuthSnapshot(): AuthSnapshot {
  const current = getActiveUser();
  if (
    cachedSnapshot.user?.id !== current?.id ||
    cachedSnapshot.user?.name !== current?.name
  ) {
    cachedSnapshot = current
      ? { user: current, status: "authenticated" }
      : { user: null, status: "unauthenticated" };
  }
  return cachedSnapshot;
}

export const serverAuthSnapshot: AuthSnapshot = {
  user: null,
  status: "unauthenticated",
};

function matchesIdentifier(user: StoredUser, rawIdentifier: string): boolean {
  const identifier = rawIdentifier.trim();
  if (!identifier) return false;

  if (user.email.toLowerCase() === identifier.toLowerCase()) {
    return true;
  }

  const cleanInputDigits = identifier.replace(/\D/g, "");
  const cleanUserDigits = user.phone.replace(/\D/g, "");

  if (cleanInputDigits.length >= 8 && cleanUserDigits.length >= 8) {
    if (cleanInputDigits === cleanUserDigits) return true;
    if (
      cleanInputDigits.endsWith(cleanUserDigits) ||
      cleanUserDigits.endsWith(cleanInputDigits)
    ) {
      return true;
    }
  }

  return user.phone.trim() === identifier;
}

/**
 * Registers a new client, persists to storage, and immediately signs them in.
 */
export function registerClientInStore(input: ClientRegistrationInput): User {
  const validation = validateClientRegistration(input);
  if (!validation.isValid) {
    const firstErrorMessage =
      Object.values(validation.errors)[0] ?? "Невалидни данни за регистрация.";
    throw new Error(firstErrorMessage);
  }

  const users = getStoredUsers();
  const trimmedEmail = input.email.trim().toLowerCase();
  const cleanPhone = input.phone.replace(/\D/g, "");

  const existingEmail = users.find(
    (u) => u.email.toLowerCase() === trimmedEmail,
  );
  if (existingEmail) {
    throw new Error("Вече съществува потребител с този имейл адрес.");
  }

  const existingPhone = users.find(
    (u) => u.phone.replace(/\D/g, "") === cleanPhone,
  );
  if (existingPhone) {
    throw new Error("Вече съществува потребител с този телефонен номер.");
  }

  const now = new Date().toISOString();
  const newUser: StoredUser = {
    id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: input.name.trim(),
    email: trimmedEmail,
    phone: input.phone.trim(),
    password: input.password,
    role: "CLIENT",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  const updatedUsers = [...users, newUser];
  saveStoredUsers(updatedUsers);
  setActiveUserId(newUser.id);

  return toPublicUser(newUser);
}

/**
 * Registers a new specialist, persists with PENDING status, and immediately signs them in.
 */
export function registerSpecialistInStore(
  input: SpecialistRegistrationInput,
): User {
  const validation = validateSpecialistRegistration(input);
  if (!validation.isValid) {
    const firstErrorMessage =
      Object.values(validation.errors)[0] ??
      "Невалидни данни за регистрация на специалист.";
    throw new Error(firstErrorMessage);
  }

  const users = getStoredUsers();
  const trimmedEmail = input.email.trim().toLowerCase();
  const cleanPhone = input.phone.replace(/\D/g, "");

  const existingEmail = users.find(
    (u) => u.email.toLowerCase() === trimmedEmail,
  );
  if (existingEmail) {
    throw new Error("Вече съществува потребител с този имейл адрес.");
  }

  const existingPhone = users.find(
    (u) => u.phone.replace(/\D/g, "") === cleanPhone,
  );
  if (existingPhone) {
    throw new Error("Вече съществува потребител с този телефонен номер.");
  }

  const now = new Date().toISOString();
  const newUser: StoredUser = {
    id: `spec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: input.name.trim(),
    email: trimmedEmail,
    phone: input.phone.trim(),
    password: input.password,
    role: "SPECIALIST",
    status: "PENDING",
    specialistProfile: {
      category: input.category,
      area: input.area.trim(),
      experienceYears: Number(input.experienceYears),
      bio: input.bio.trim(),
      companyName: input.companyName?.trim() || undefined,
      eik: input.eik?.trim() || undefined,
    },
    createdAt: now,
    updatedAt: now,
  };

  const updatedUsers = [...users, newUser];
  saveStoredUsers(updatedUsers);
  setActiveUserId(newUser.id);

  return toPublicUser(newUser);
}

/**
 * Authenticates user by email or phone and password.
 * Sets the active session on success.
 */
export function authenticateUser(
  identifier: string,
  password: string,
): User | null {
  const users = getStoredUsers();
  const match = users.find(
    (u) => matchesIdentifier(u, identifier) && u.password === password,
  );

  if (!match) {
    return null;
  }

  setActiveUserId(match.id);
  return toPublicUser(match);
}

/**
 * Clears the active session.
 */
export function clearActiveSession(): void {
  setActiveUserId(null);
}

/**
 * Refreshes the active user record from stored users and notifies listeners.
 */
export function refreshActiveUser(): User | null {
  const id = getActiveUserId();
  if (!id) return null;
  const users = getStoredUsers();
  const found = users.find((u) => u.id === id);
  if (!found) return null;
  notifyListeners();
  return toPublicUser(found);
}

/**
 * Updates a user's status in store (e.g. for demoing approval).
 */
export function updateUserStatusInStore(
  userId: string,
  status: UserStatus,
): User | null {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const updatedUser: StoredUser = {
    ...users[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  const updatedUsers = [...users];
  updatedUsers[index] = updatedUser;
  saveStoredUsers(updatedUsers);
  return toPublicUser(updatedUser);
}
