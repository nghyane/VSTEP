const BASE = '/api/v1';

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.json().catch(() => ({ message: res.statusText }));

  if (!res.ok) {
    throw new Error(body.message ?? 'Đăng nhập thất bại');
  }

  return body.data as {
    access_token: string;
    user: AuthUser;
  };
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
