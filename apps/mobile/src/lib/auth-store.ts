// Auth store — Zustand (aligned with frontend-v3 lib/auth-store.ts)
// Falls back to mock login when API unavailable.
import { create } from "zustand";
import { type ApiResponse, ApiError, api, tokenStorage } from "@/lib/api";
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

const MOCK_USER: User = { id: "mock-1", email: "demo@vstep.vn", role: "learner" };
const MOCK_PROFILE: Profile = { id: "mock-p1", nickname: "Học viên", target_level: "B2", target_deadline: "2026-08-01", entry_level: null, avatar_color: null, is_initial_profile: true };

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
    try {
      const { data } = await api.post<ApiResponse<LoginResponse>>("auth/login", { email, password });
      await tokenStorage.setAccess(data.access_token);
      await tokenStorage.setRefresh(data.refresh_token);
      await tokenStorage.setUser(data.user);
      await tokenStorage.setProfile(data.profile);
      set({ user: data.user, profile: data.profile, isAuthenticated: true });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      // API unavailable — mock login for development
      const user = { ...MOCK_USER, email };
      await tokenStorage.setUser(user);
      await tokenStorage.setProfile(MOCK_PROFILE);
      set({ user, profile: MOCK_PROFILE, isAuthenticated: true });
    }
  },

  async register(input) {
    try {
      const { data } = await api.post<ApiResponse<RegisterResponse>>("auth/register", input);
      await tokenStorage.setUser(data.user);
      await tokenStorage.setProfile(data.profile);
      set({ user: data.user, profile: data.profile, isAuthenticated: true });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const user = { ...MOCK_USER, email: input.email };
      const profile = { ...MOCK_PROFILE, nickname: input.nickname, target_level: input.target_level };
      await tokenStorage.setUser(user);
      await tokenStorage.setProfile(profile);
      set({ user, profile, isAuthenticated: true });
    }
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
