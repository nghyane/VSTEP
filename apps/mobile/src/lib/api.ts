import type { AuthUser, LoginResponse } from "@/types/api";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "./auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new ApiError(0, "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error?.message ?? body.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

let refreshPromise: Promise<void> | null = null;

async function authRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new ApiError(401, "Not authenticated");

  const authedOptions = {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
  };

  try {
    return await request<T>(path, authedOptions);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err;

    const refresh = await getRefreshToken();
    if (!refresh) {
      await clearTokens();
      throw err;
    }

    if (!refreshPromise) {
      refreshPromise = request<LoginResponse>("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: refresh }),
      })
        .then(async (res) => {
          await saveTokens(res.accessToken, res.refreshToken, res.user);
        })
        .catch(async () => {
          await clearTokens();
          throw new ApiError(401, "Session expired");
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    await refreshPromise;

    const newToken = await getAccessToken();
    return request<T>(path, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
    });
  }
}

export const api = {
  get: <T>(path: string) => authRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    authRequest<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    authRequest<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    authRequest<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => authRequest<T>(path, { method: "DELETE" }),
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const token = await getAccessToken();
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message ?? `Upload failed: ${res.status}`);
    }
    return res.json();
  },
};

export function loginApi(email: string, password: string) {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerApi(email: string, password: string, fullName?: string) {
  return request<{ user: AuthUser; message: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, fullName }),
  });
}

export function logoutApi(refreshToken: string, accessToken: string) {
  return request<{ message: string }>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getMeApi(accessToken: string) {
  return request<{ user: AuthUser }>("/api/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export { ApiError };
