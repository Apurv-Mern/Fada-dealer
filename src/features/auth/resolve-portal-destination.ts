import { routes } from "@/config/navigation";
import { getDealerProfile } from "@/features/dealership/api";
import { isDealerPortalLocked } from "@/features/dealership/status";

const AUTH_PATH_PREFIXES = [
  routes.login,
  routes.register,
  routes.forgotPassword,
] as const;

function isSafePortalNext(next: string): boolean {
  if (!next.startsWith("/") || next.startsWith("//")) return false;
  return !AUTH_PATH_PREFIXES.some(
    (path) => next === path || next.startsWith(`${path}/`),
  );
}

/**
 * After login (or when already authenticated on `/` / auth pages), fetch
 * dealer profile status and choose the landing route.
 * Throws on profile API failure — callers must not soft-unlock.
 */
export async function resolvePortalDestination(
  next?: string | null,
): Promise<string> {
  const profile = await getDealerProfile();
  if (isDealerPortalLocked(profile.status)) {
    return routes.dealership;
  }
  const candidate = typeof next === "string" ? next.trim() : "";
  if (candidate && isSafePortalNext(candidate)) {
    return candidate;
  }
  return routes.employees;
}
