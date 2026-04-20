// Auth store — Zustand (aligned with frontend-v3 lib/auth-store.ts)
// Account → Profile model. No Context/Provider needed.
import { create } from "zustand";
import { type ApiResponse, api, tokenStorage } from "@/lib/api";
import type { LoginResponse, Profile, RegisterResponse, User } from "@/types/auth";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; nickname: string; target_level: string; target_deadline: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState & AuthActions>()((set) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,

  async init() {
    const user = tokenStorage.getUser();
    const profile = tokenStorage.getProfile();
    set({ user, profile, isAuthenticated: user !== null, isLoading: false });
  },

  async login(email, password) {
    const { data } = await api.post<ApiResponse<LoginResponse>>("auth/login", { email, password });
    await tokenStorage.setAccess(data.access_token);
    await tokenStorage.setRefresh(data.refresh_token);
    await tokenStorage.setUser(data.user);
    await tokenStorage.setProfile(data.profile);
    set({ user: data.user, profile: data.profile, isAuthenticated: true });
  },

  async register(input) {
    const { data } = await api.post<ApiResponse<RegisterResponse>>("auth/register", input);
    // Backend returns user + profile but no tokens on register — need to login after
    await tokenStorage.setUser(data.user);
    await tokenStorage.setProfile(data.profile);
    set({ user: data.user, profile: data.profile, isAuthenticated: true });
  },

  async logout() {
    const refreshToken = tokenStorage.getRefresh();
    if (refreshToken) {
      try { await api.post("auth/logout", { refresh_token: refreshToken }); } catch {}
    }
    await tokenStorage.clear();
    set({ user: null, profile: null, isAuthenticated: false });
  },
}));
