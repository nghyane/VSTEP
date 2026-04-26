import { getAccessToken, getRefreshToken, saveTokens, clearTokens, getSavedUser } from "./auth";
import type { AuthUser, Profile } from "@/types/api";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.vstepgo.com";

// ── Key transforms (Laravel snake_case <-> React Native camelCase) ──

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function transformKeys(obj: unknown, fn: (k: string) => string): unknown {
  if (Array.isArray(obj)) return obj.map((item) => transformKeys(item, fn));
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        fn(k),
        transformKeys(v, fn),
      ]),
    );
  }
  return obj;
}

function toCamelCase<T>(obj: unknown): T {
  return transformKeys(obj, snakeToCamel) as T;
}

function toSnakeCase(obj: unknown): unknown {
  return transformKeys(obj, camelToSnake);
}

// ── Unwrap Laravel { data: T } wrapper ──

function unwrapData(obj: unknown): unknown {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const rec = obj as Record<string, unknown>;
    const keys = Object.keys(rec);
    if (keys.length === 1 && keys[0] === "data") return rec.data;
  }
  return obj;
}

// ── HTTP client ──

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isRetry = false,
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(toSnakeCase(body)) : undefined,
  });

  if (res.status === 401 && !isRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(method, path, body, true);
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const json: unknown = await res.json().catch(() => ({}));
  return toCamelCase<T>(unwrapData(json));
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken().catch(() => null);
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const json: unknown = await res.json();
    const data = toCamelCase<{
      accessToken: string;
      refreshToken: string;
      profile: Profile | null;
    }>(unwrapData(json));
    const user = await getSavedUser();
    if (!user) return false;
    await saveTokens(data.accessToken, data.refreshToken, user, data.profile);
    return true;
  } catch {
    await clearTokens().catch(() => undefined);
    return false;
  }
}

export async function refreshSession() {
  const refreshToken = await getRefreshToken().catch(() => null);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      await clearTokens().catch(() => undefined);
      return null;
    }
    const json: unknown = await res.json();
    const data = toCamelCase<{
      accessToken: string;
      refreshToken: string;
      profile: Profile | null;
    }>(unwrapData(json));
    const user = await getSavedUser();
    if (!user) {
      await clearTokens().catch(() => undefined);
      return null;
    }
    await saveTokens(data.accessToken, data.refreshToken, user, data.profile);
    return { user, profile: data.profile };
  } catch {
    await clearTokens().catch(() => undefined);
    return null;
  }
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

// ── Auth API calls ──

export async function loginApi(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((err.message as string) ?? "Login failed");
  }
  const json: unknown = await res.json();
  return toCamelCase<{
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    profile: Profile | null;
  }>(unwrapData(json));
}

export async function checkEmailApi(email: string) {
  return api.post<{ available: boolean }>("/api/v1/auth/email/check", { email });
}

export async function registerApi(
  email: string,
  password: string,
  nickname: string,
  targetLevel: string,
  targetDeadline: string,
) {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password, nickname, target_level: targetLevel, target_deadline: targetDeadline }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((err.message as string) ?? "Register failed");
  }
  const json: unknown = await res.json();
  return toCamelCase<{
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    profile: Profile | null;
  }>(unwrapData(json));
}

export async function completeOnboardingApi(nickname: string, targetLevel: string, targetDeadline: string) {
  return api.post<{
    accessToken: string;
    expiresIn: number;
    profile: Profile;
    onboardingBonus?: { amount: number; granted: boolean };
  }>("/api/v1/auth/complete-onboarding", { nickname, targetLevel, targetDeadline });
}
