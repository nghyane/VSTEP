import { createContext, useContext } from "react";
import type { AuthUser, Profile } from "@/types/api";

interface AuthCtx {
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
  user: null,
  profile: null,
  isLoading: true,
  signIn: async () => undefined,
  signOut: async () => undefined,
});

export function useAuth() {
  return useContext(AuthContext);
}
