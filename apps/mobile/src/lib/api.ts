import type { AuthUser, LoginResponse } from "@/types/api";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "./auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// snake_case ↔ camelCase transforms (for Laravel ↔ React Native convention bridge)
// ---------------------------------------------------------------------------

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function transformKeys(obj: unknown, fn: (key: string) => string): unknown {
  if (Array.isArray(obj)) return obj.map((item) => transformKeys(item, fn));
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [fn(k), transformKeys(v, fn)]),
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

// ---------------------------------------------------------------------------
// Unwrap Laravel's { data: ... } wrapper
// ---------------------------------------------------------------------------

function unwrapData(obj: unknown): unknown {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const rec = obj as Record<string, unknown>;
    const keys = Object.keys(rec);

    // Single-resource: { data: ... } → unwrap
    if (keys.length === 1 && keys[0] === "data") {
      return rec.data;
    }

    // Paginated: { data: [...], meta: { current_page, per_page, ... }, links }
    // Normalize Laravel meta → PaginationMeta { page, limit, total, totalPages }
    if (Array.isArray(rec.data) && rec.meta && typeof rec.meta === "object") {
      const m = rec.meta as Record<string, unknown>;
      rec.meta = {
        page: m.current_page ?? m.page,
        limit: m.per_page ?? m.limit,
        total: m.total,
        totalPages: m.last_page ?? m.totalPages,
      };
      delete rec.links;
    }
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Auto-prefix /api/ → /api/v1/ for Laravel backend-v2
// ---------------------------------------------------------------------------

function buildUrl(path: string): string {
  return `${API_URL}${path.replace(/^\/api\//, "/api/v1/")}`;
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

const STATUS_MESSAGES: Record<number, string> = {
  400: "Dữ liệu không hợp lệ",
  401: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại",
  403: "Bạn không có quyền thực hiện thao tác này",
  404: "Không tìm thấy dữ liệu yêu cầu",
  409: "Dữ liệu bị trùng lặp",
  422: "Không thể xử lý yêu cầu",
  500: "Lỗi hệ thống, vui lòng thử lại sau",
};

const ERROR_TRANSLATIONS: Record<string, string> = {
  "Invalid credentials": "Email hoặc mật khẩu không đúng",
  "Invalid credentials.": "Email hoặc mật khẩu không đúng",
  "Invalid refresh token": "Phiên đăng nhập không hợp lệ",
  "Current password is incorrect": "Mật khẩu hiện tại không đúng",
  "Email already registered": "Email này đã được đăng ký",
  "Email already in use": "Email này đã được sử dụng",
  "You can only view your own profile": "Bạn chỉ có thể xem hồ sơ của mình",
  "You can only update your own profile": "Bạn chỉ có thể cập nhật hồ sơ của mình",
  "You can only change your own password": "Bạn chỉ có thể đổi mật khẩu của mình",
  "Not found": "Không tìm thấy",
  Unauthorized: "Chưa xác thực",
  Conflict: "Dữ liệu bị trùng lặp",
};

function parseLaravelErrors(body: Record<string, unknown>): string | null {
  if (body?.errors && typeof body.errors === "object" && !Array.isArray(body.errors)) {
    const errors = body.errors as Record<string, string[]>;
    const firstField = Object.keys(errors)[0];
    if (firstField && errors[firstField]?.[0]) {
      return errors[firstField][0];
    }
  }
  return null;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Transform JSON request body: camelCase → snake_case
  let body = options.body;
  if (body && typeof body === "string") {
    try {
      body = JSON.stringify(toSnakeCase(JSON.parse(body)));
    } catch {
      // not JSON, keep as-is
    }
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path), {
      ...options,
      body,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...options.headers },
    });
  } catch {
    throw new ApiError(0, "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.");
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const serverMessage: string | undefined = errorBody?.error?.message ?? errorBody?.message;

    // Backend returns 500 "Route [login] not defined" when unauthenticated
    if (res.status === 500 && serverMessage && /route \[login\] not defined/i.test(serverMessage)) {
      throw new ApiError(401, STATUS_MESSAGES[401]);
    }

    const validation = parseLaravelErrors(errorBody);
    if (validation) throw new ApiError(res.status, validation);
    const fallback = STATUS_MESSAGES[res.status] ?? "Đã có lỗi xảy ra";
    const translated = serverMessage ? (ERROR_TRANSLATIONS[serverMessage] ?? fallback) : fallback;
    throw new ApiError(res.status, translated);
  }

  // Transform response: unwrap { data } wrapper + snake_case → camelCase
  const json = await res.json();
  return toCamelCase<T>(unwrapData(json));
}

// ---------------------------------------------------------------------------
// Authenticated request — injects Bearer token, handles 401 refresh
// ---------------------------------------------------------------------------

let refreshPromise: Promise<void> | null = null;

async function authRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    await clearTokens();
    throw new ApiError(401, "Not authenticated");
  }

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
      refreshPromise = request<{ accessToken: string; refreshToken: string; user: AuthUser }>("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: refresh }),
      })
        .then(async (res) => {
          await saveTokens(res.accessToken, res.refreshToken, res.user);
        })
        .catch(async () => {
          await clearTokens();
          throw new ApiError(401, "Phiên đăng nhập hết hạn");
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

// ---------------------------------------------------------------------------
// File upload (multipart — no JSON transform, but still unwrap + camelCase response)
// ---------------------------------------------------------------------------

async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const token = await getAccessToken();

  let res: Response;
  try {
    res = await fetch(buildUrl(path), {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch {
    throw new ApiError(0, "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.");
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    if (res.status === 401) {
      await clearTokens();
      throw new ApiError(401, STATUS_MESSAGES[401]);
    }
    const validation = parseLaravelErrors(errorBody);
    if (validation) throw new ApiError(res.status, validation);
    const fallback = STATUS_MESSAGES[res.status] ?? "Đã có lỗi xảy ra";
    const serverMessage: string | undefined = errorBody?.error?.message ?? errorBody?.message;
    const translated = serverMessage ? (ERROR_TRANSLATIONS[serverMessage] ?? fallback) : fallback;
    throw new ApiError(res.status, translated);
  }

  const json = await res.json();
  return toCamelCase<T>(unwrapData(json));
}

// ---------------------------------------------------------------------------
// Public API object (used by hooks)
// ---------------------------------------------------------------------------

export const api = {
  get: <T>(path: string) => authRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    authRequest<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    authRequest<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    authRequest<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => authRequest<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) => uploadFile<T>(path, formData),
};

// ---------------------------------------------------------------------------
// Auth endpoints (public — no Bearer token needed)
// ---------------------------------------------------------------------------

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
  return request<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getMeApi(accessToken: string) {
  return request<AuthUser>("/api/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export { ApiError };
