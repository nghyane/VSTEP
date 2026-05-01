import { createContext, useContext } from "react";
import type { AuthUser, Profile } from "@/types/api";

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

interface AuthCtx {
  status: AuthStatus;
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (
    accessToken: string,
    refreshToken: string,
    user: AuthUser,
    profile: Profile | null,
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthCtx>({
  status: "initializing",
  user: null,
  profile: null,
  isLoading: true,
  signIn: async () => undefined,
  signOut: async () => undefined,
});

export function useAuth() {
  return useContext(AuthContext);
}
