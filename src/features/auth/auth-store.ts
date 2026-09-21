import bcrypt from "bcryptjs";
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
  passwordHash: string;
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
    passwordHash: bcrypt.hashSync("password", 10),
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
    passwordHash: bcrypt.hashSync("password", 10),
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
    passwordHash: bcrypt.hashSync("password", 10),
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
    id: "spec-rejected-1",
    name: "Стоян Василев",
    email: "stoyan@remonti-stoyan.bg",
    phone: "0887112233",
    passwordHash: bcrypt.hashSync("password", 10),
    role: "SPECIALIST",
    status: "REJECTED",
    specialistProfile: {
      category: "Боядисване",
      area: "Пловдив",
      experienceYears: 2,
      bio: "Бояджийски услуги за жилища и търговски обекти.",
      companyName: "Василев Строй ЕООД",
      eik: "102938475",
    },
    createdAt: "2026-01-20T14:00:00.000Z",
    updatedAt: "2026-01-22T16:00:00.000Z",
  },
  {
    id: "admin-1",
    name: "Администратор",
    email: "admin@domora.bg",
    phone: "0899000111",
    passwordHash: bcrypt.hashSync("password", 10),
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

function safeSessionStorageGet(key: string): string | null {
  if (
    typeof window === "undefined" ||
    typeof window.sessionStorage === "undefined"
  )
    return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionStorageSet(key: string, value: string): void {
  if (
    typeof window === "undefined" ||
    typeof window.sessionStorage === "undefined"
  )
    return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore quota or security errors
  }
}

function safeSessionStorageRemove(key: string): void {
  if (
    typeof window === "undefined" ||
    typeof window.sessionStorage === "undefined"
  )
    return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

export function toPublicUser(stored: StoredUser): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...user } = stored;
  return user;
}

export function getStoredUsers(): StoredUser[] {
  const json = safeLocalStorageGet(STORAGE_KEY_USERS);
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure legacy records with plaintext password get migrated to passwordHash
        const normalized: StoredUser[] = parsed.map(
          (u: Partial<StoredUser> & { password?: string }) => {
            if (!u.passwordHash && u.password) {
              const { password: legacyPassword, ...rest } = u;
              return {
                ...rest,
                passwordHash: bcrypt.hashSync(legacyPassword, 10),
              } as StoredUser;
            }
            return u as StoredUser;
          },
        );
        // Ensure initial seed users exist even if stored users list is modified
        const existingIds = new Set(normalized.map((u: StoredUser) => u.id));
        const missingSeeds = initialSeedUsers.filter(
          (seed) => !existingIds.has(seed.id),
        );
        if (missingSeeds.length > 0) {
          const merged = [...normalized, ...missingSeeds];
          memoryUsers = merged;
          safeLocalStorageSet(STORAGE_KEY_USERS, JSON.stringify(merged));
          return merged;
        }
        memoryUsers = normalized;
        return normalized;
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
  const sessionId = safeSessionStorageGet(STORAGE_KEY_ACTIVE_USER);
  if (sessionId) {
    memoryActiveUserId = sessionId;
    return sessionId;
  }

  const storedId = safeLocalStorageGet(STORAGE_KEY_ACTIVE_USER);
  if (storedId) {
    memoryActiveUserId = storedId;
    return storedId;
  }

  return memoryActiveUserId;
}

export function setActiveUserId(id: string | null, rememberMe = true): void {
  memoryActiveUserId = id;
  if (id === null) {
    safeLocalStorageRemove(STORAGE_KEY_ACTIVE_USER);
    safeSessionStorageRemove(STORAGE_KEY_ACTIVE_USER);
  } else {
    if (rememberMe) {
      safeSessionStorageRemove(STORAGE_KEY_ACTIVE_USER);
      safeLocalStorageSet(STORAGE_KEY_ACTIVE_USER, id);
    } else {
      safeLocalStorageRemove(STORAGE_KEY_ACTIVE_USER);
      safeSessionStorageSet(STORAGE_KEY_ACTIVE_USER, id);
    }
  }
  notifyListeners();
}

export function syncExternalUser(user: User | null): void {
  if (user) {
    const users = getStoredUsers();
    const existingIndex = users.findIndex((u) => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = {
        ...users[existingIndex],
        ...user,
      };
      saveStoredUsers(users);
    } else {
      users.push({
        ...user,
        passwordHash: "",
      });
      saveStoredUsers(users);
    }
    setActiveUserId(user.id);
  }
}

export function getActiveUser(): User | null {
  const id = getActiveUserId();
  if (!id) return null;
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
    cachedSnapshot.user?.name !== current?.name ||
    cachedSnapshot.user?.role !== current?.role ||
    cachedSnapshot.user?.status !== current?.status
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
    passwordHash: bcrypt.hashSync(input.password, 10),
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
    passwordHash: bcrypt.hashSync(input.password, 10),
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
  rememberMe = true,
): User | null {
  const users = getStoredUsers();
  const match = users.find(
    (u) =>
      matchesIdentifier(u, identifier) &&
      Boolean(u.passwordHash) &&
      bcrypt.compareSync(password, u.passwordHash),
  );

  if (!match) {
    return null;
  }

  setActiveUserId(match.id, rememberMe);
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

let cachedSpecialists: User[] = [];
let cachedSpecialistsHash = "";

/**
 * Returns a stable cached snapshot of all registered specialists.
 */
export function getSpecialistsSnapshot(): User[] {
  const users = getStoredUsers();
  const specs = users.filter((u) => u.role === "SPECIALIST").map(toPublicUser);
  const hash = specs.map((s) => `${s.id}:${s.status}:${s.updatedAt}`).join("|");
  if (hash !== cachedSpecialistsHash) {
    cachedSpecialistsHash = hash;
    cachedSpecialists = specs;
  }
  return cachedSpecialists;
}

/**
 * Server snapshot for SSR hydration.
 */
export function getServerSpecialistsSnapshot(): User[] {
  return initialSeedUsers
    .filter((u) => u.role === "SPECIALIST")
    .map(toPublicUser);
}
