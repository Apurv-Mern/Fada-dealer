import type { SessionPayload } from "@/features/auth/auth-utils";

const ACCESS_KEY = "fada_dealer_access_token";
const REFRESH_KEY = "fada_dealer_refresh_token";
const PROFILE_KEY = "fada_dealer_profile";

export type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
};

const listeners = new Set<() => void>();

/** Cached so useSyncExternalStore getSnapshot stays referentially stable. */
let cachedProfile: SessionPayload | null | undefined;
let cachedLoggedIn: boolean | undefined;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function emitChange(): void {
  cachedProfile = undefined;
  cachedLoggedIn = undefined;
  listeners.forEach((listener) => listener());
}

/** Subscribe to token/profile changes (for useSyncExternalStore). */
export function subscribeAuthStore(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function setTokens(tokens: StoredTokens): void {
  if (!canUseStorage()) return;
  sessionStorage.setItem(ACCESS_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  } else {
    sessionStorage.removeItem(REFRESH_KEY);
  }
  emitChange();
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null;
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  return sessionStorage.getItem(REFRESH_KEY);
}

export function setProfile(profile: SessionPayload): void {
  if (!canUseStorage()) return;
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  emitChange();
}

/** Write tokens + profile once and notify listeners once (avoids double re-render flash). */
export function setSession(input: {
  accessToken: string;
  refreshToken?: string;
  profile: SessionPayload;
}): void {
  if (!canUseStorage()) return;
  sessionStorage.setItem(ACCESS_KEY, input.accessToken);
  if (input.refreshToken) {
    sessionStorage.setItem(REFRESH_KEY, input.refreshToken);
  } else {
    sessionStorage.removeItem(REFRESH_KEY);
  }
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(input.profile));
  cachedProfile = input.profile;
  cachedLoggedIn = true;
  listeners.forEach((listener) => listener());
}

export function getProfile(): SessionPayload | null {
  if (!canUseStorage()) return null;
  if (cachedProfile !== undefined) return cachedProfile;

  const raw = sessionStorage.getItem(PROFILE_KEY);
  if (!raw) {
    cachedProfile = null;
    return null;
  }
  try {
    const data = JSON.parse(raw) as SessionPayload;
    if (!data.email || !data.name) {
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
  if (!canUseStorage()) return;
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(PROFILE_KEY);
  emitChange();
}
