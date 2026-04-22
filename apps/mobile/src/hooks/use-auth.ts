import { createContext, useContext } from "react";
import type { AuthUser, Profile } from "@/types/api";

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (accessToken: string, refreshToken: string, user: AuthUser, profile: Profile | null) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
