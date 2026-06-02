import { createContext, useContext } from "react";
import type { AuthUser, Profile } from "@/types/api";

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

interface AuthCtx {
  status: AuthStatus;
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  suggestedNickname: string | null;
  signIn: (
    accessToken: string,
    refreshToken: string,
    user: AuthUser,
    profile: Profile | null,
  ) => Promise<void>;
  switchSession: (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  setSuggestedNickname: (value: string | null) => void;
}

export const AuthContext = createContext<AuthCtx>({
  status: "initializing",
  user: null,
  profile: null,
  isLoading: true,
  suggestedNickname: null,
  signIn: async () => undefined,
  switchSession: async () => undefined,
  signOut: async () => undefined,
  updateUser: async () => undefined,
  updateProfile: async () => undefined,
  setSuggestedNickname: () => undefined,
});

export function useAuth() {
  return useContext(AuthContext);
}
