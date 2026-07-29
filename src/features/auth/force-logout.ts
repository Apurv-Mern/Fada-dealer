import { clearTokens } from "@/features/auth/token-store";
import { routes } from "@/config/navigation";

let loggingOut = false;

/**
 * Clear local session and send the user to login.
 * Used for expired/invalid tokens (401). Avoids circular import with apiFetch.
 */
export function forceLocalLogout(reason: "session" = "session"): void {
  clearTokens();

  if (typeof window === "undefined") return;
  if (loggingOut) return;
  loggingOut = true;

  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === "/login" || path.endsWith("/login")) {
    loggingOut = false;
    return;
  }

  window.location.assign(`${routes.login}?reason=${reason}`);
}
