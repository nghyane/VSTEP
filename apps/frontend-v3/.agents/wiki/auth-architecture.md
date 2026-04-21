# Auth Architecture

## Discriminated union state

```ts
type AuthState =
  | { isAuthenticated: false; user: null; profile: null }
  | { isAuthenticated: true; user: User; profile: Profile }
```

Khi `isAuthenticated: true`, TS tự biết `user` và `profile` non-null.

## Auth store — single source of truth cho tokens

`lib/auth.ts` quản lý toàn bộ token lifecycle. Bên ngoài không biết về tokens:

- `login()` — API + set tokens + set state
- `register()` — API + set tokens + set state
- `switchProfile()` — API + set tokens + set state
- `logout()` — clear tokens + set state

Không helper function ngoài store (không `authenticate()`, không `applyTokens()`).
Không component/hook nào import `tokens` trực tiếp (chỉ `auth.ts` và `api.ts`).

## useSession() vs useAuth

- `useAuth` — cho auth guards, login/register/logout actions. Returns nullable state.
- `useSession()` — cho components trong `_app`. Returns typed `{ user, profile }`. Throw nếu ngoài auth context.

## Register flow

1 bước: email + password + nickname + target_level + target_deadline.
Backend tạo account + profile + JWT (có `active_profile_id`).

## Profile model

- 1 User → nhiều Profile. 1 Profile = 1 Target.
- Đổi target = tạo profile mới, không update.
- Switch profile = `auth.switchProfile()` → reissue JWT.

## 401 handling

- `on-error.ts` trên QueryClient: 401 → `useAuth.getState().logout()`.
- `_app.tsx` useEffect: `!isAuthenticated` → redirect landing.
- `api.ts` KHÔNG handle 401.

---
See also: [[api-conventions]] · [[anti-patterns]] · [[state-patterns]]
