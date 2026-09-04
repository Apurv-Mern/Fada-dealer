import {
  normalizeStoredProfile,
  type SessionPayload,
} from "@/features/auth/auth-utils";

const ACCESS_KEY = "fada_dealer_access_token";
const REFRESH_KEY = "fada_dealer_refresh_token";
const PROFILE_KEY = "fada_dealer_profile";
const ACTING_KEY = "fada_dealer_acting_id";

const AUTH_KEYS = [ACCESS_KEY, REFRESH_KEY, PROFILE_KEY, ACTING_KEY] as const;
const AUTH_KEY_SET = new Set<string>(AUTH_KEYS);

export type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
};

const listeners = new Set<() => void>();

/** Cached so useSyncExternalStore getSnapshot stays referentially stable. */
let cachedProfile: SessionPayload | null | undefined;
let cachedLoggedIn: boolean | undefined;
let cachedActingId: string | null | undefined;

let migratedFromSession = false;
let storageBound = false;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** One-time copy of pre-localStorage session keys so an open tab stays logged in. */
function migrateSessionToLocal(): void {
  if (migratedFromSession || !canUseStorage()) return;
  migratedFromSession = true;
  if (typeof sessionStorage === "undefined") return;
  try {
    for (const key of AUTH_KEYS) {
      if (localStorage.getItem(key)) continue;
      const fromSession = sessionStorage.getItem(key);
      if (fromSession) localStorage.setItem(key, fromSession);
    }
    for (const key of AUTH_KEYS) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // private mode / quota
  }
}

function ensureStorage(): boolean {
  if (!canUseStorage()) return false;
  migrateSessionToLocal();
  return true;
}

function emitChange(): void {
  cachedProfile = undefined;
  cachedLoggedIn = undefined;
  cachedActingId = undefined;
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.storageArea && event.storageArea !== localStorage) return;
  if (event.key !== null && !AUTH_KEY_SET.has(event.key)) return;
  emitChange();
}

function bindStorageListener(): void {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", onStorage);
}

/** Subscribe to token/profile changes (for useSyncExternalStore). */
export function subscribeAuthStore(onStoreChange: () => void): () => void {
  bindStorageListener();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function setTokens(tokens: StoredTokens): void {
  if (!ensureStorage()) return;
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  } else {
    localStorage.removeItem(REFRESH_KEY);
  }
  emitChange();
}

export function getAccessToken(): string | null {
  if (!ensureStorage()) return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!ensureStorage()) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setProfile(profile: SessionPayload): void {
  if (!ensureStorage()) return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  emitChange();
}

function writeActingId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTING_KEY, id);
    cachedActingId = id;
  } else {
    localStorage.removeItem(ACTING_KEY);
    cachedActingId = null;
  }
}

/** Active dealer for `x-dealer-id` (navbar selection). Falls back to logged-in profile id. */
export function getActingDealerId(): string | null {
  if (!ensureStorage()) return null;
  if (cachedActingId !== undefined) return cachedActingId;

  const stored = localStorage.getItem(ACTING_KEY)?.trim() || "";
  if (stored) {
    cachedActingId = stored;
    return cachedActingId;
  }

  const profile = getProfile();
  cachedActingId = profile?.id?.trim() || null;
  return cachedActingId;
}

export function setActingDealerId(id: string | null): void {
  if (!ensureStorage()) return;
  const next = id?.trim() || null;
  const current = getActingDealerId();
  if (next === current) return;
  writeActingId(next);
  listeners.forEach((listener) => listener());
}

/** Write tokens + profile once and notify listeners once (avoids double re-render flash). */
export function setSession(input: {
  accessToken: string;
  refreshToken?: string;
  profile: SessionPayload;
}): void {
  if (!ensureStorage()) return;
  localStorage.setItem(ACCESS_KEY, input.accessToken);
  if (input.refreshToken) {
    localStorage.setItem(REFRESH_KEY, input.refreshToken);
  } else {
    localStorage.removeItem(REFRESH_KEY);
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(input.profile));
  cachedProfile = input.profile;
  cachedLoggedIn = true;
  writeActingId(input.profile.id?.trim() || null);
  listeners.forEach((listener) => listener());
}

export function getProfile(): SessionPayload | null {
  if (!ensureStorage()) return null;
  if (cachedProfile !== undefined) return cachedProfile;

  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) {
    cachedProfile = null;
    return null;
  }
  try {
    const data = normalizeStoredProfile(JSON.parse(raw));
    if (!data) {
      cachedProfile = null;
      return null;
    }
    cachedProfile = data;
    return cachedProfile;
  } catch {
    cachedProfile = null;
    return null;
  }
}

export function isLoggedIn(): boolean {
  if (cachedLoggedIn !== undefined) return cachedLoggedIn;
  cachedLoggedIn = Boolean(getAccessToken() && getProfile());
  return cachedLoggedIn;
}

export function clearTokens(): void {
  if (!ensureStorage()) return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(ACTING_KEY);
  if (typeof sessionStorage !== "undefined") {
    for (const key of AUTH_KEYS) {
      sessionStorage.removeItem(key);
    }
  }
  emitChange();
}
