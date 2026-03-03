import { createContext, useContext } from "react";
import type { AuthUser } from "@/types/api";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (accessToken: string, refreshToken: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
