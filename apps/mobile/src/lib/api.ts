// API client — aligned with frontend-v3 lib/api.ts
// Uses fetch + JWT interceptor. SecureStore for tokens.
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8010/api/v1";

const KEYS = {
  access: "vstep_access_token",
  refresh: "vstep_refresh_token",
  user: "vstep_user",
  profile: "vstep_profile",
} as const;

// ─── Token storage ───────────────────────────────────────────────
export const tokenStorage = {
  getAccess: () => SecureStore.getItem(KEYS.access),
  setAccess: (t: string) => SecureStore.setItemAsync(KEYS.access, t),

  getRefresh: () => SecureStore.getItem(KEYS.refresh),
  setRefresh: (t: string) => SecureStore.setItemAsync(KEYS.refresh, t),

  getUser: () => {
    const raw = SecureStore.getItem(KEYS.user);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (u: unknown) => SecureStore.setItemAsync(KEYS.user, JSON.stringify(u)),

  getProfile: () => {
    const raw = SecureStore.getItem(KEYS.profile);
    return raw ? JSON.parse(raw) : null;
  },
  setProfile: (p: unknown) => SecureStore.setItemAsync(KEYS.profile, JSON.stringify(p ?? "null")),

  clear: async () => {
    for (const key of Object.values(KEYS)) await SecureStore.deleteItemAsync(key);
  },
};

// ─── API response wrapper ────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
}

// ─── Fetch wrapper ───────────────────────────────────────────────
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  const token = tokenStorage.getAccess();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    await tokenStorage.clear();
    throw new ApiError(401, "Unauthorized");
  }

  const json = await res.json();
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Request failed");
  return json as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
