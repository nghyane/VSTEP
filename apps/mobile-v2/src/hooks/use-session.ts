import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";

/**
 * Typed session accessor — returns non-null user + profile when authenticated.
 * Mirrors frontend-v3's useSession() pattern.
 *
 * Usage:
 *   const session = useSession();
 *   // session.user is typed as AuthUser (not AuthUser | null)
 *   // session.profile is typed as Profile (not Profile | null)
 *
 * If called while unauthenticated, throws — guard with useAuth().status first.
 */
export function useSession() {
  const auth = useAuth();

  return useMemo(() => {
    if (auth.status !== "authenticated") {
      throw new Error("useSession() called outside authenticated context");
    }
    if (!auth.user) {
      throw new Error("useSession() called with null user");
    }
    return {
      user: auth.user,
      profile: auth.profile,
      status: auth.status as "authenticated",
    };
  }, [auth]);
}

/**
 * Safe session accessor — returns null when unauthenticated instead of throwing.
 * Use when the component works in both auth states.
 */
export function useOptionalSession() {
  const auth = useAuth();
  return useMemo(() => {
    if (auth.status !== "authenticated" || !auth.user) return null;
    return { user: auth.user, profile: auth.profile };
  }, [auth]);
}
