# Auth Architecture

## Discriminated union state

```ts
type AuthState =
  | { isAuthenticated: false; user: null; profile: null }
  | { isAuthenticated: true; user: User; profile: Profile }
```

Khi `isAuthenticated: true`, TS tự biết `user` và `profile` non-null. Không cần `as` cast.

## useSession() vs useAuth

- `useAuth` — cho auth guards, login/register/logout actions. Returns `AuthStore` (nullable).
- `useSession()` — cho components trong `_app`. Returns `{ user: User, profile: Profile }`. Throw nếu dùng ngoài auth context.

## Register flow

1 bước: email + password + nickname + target_level + target_deadline.
Backend tạo account + profile + JWT (có `active_profile_id`).
Không onboarding modal, không 2-step.

## Profile model

- 1 User → nhiều Profile. 1 Profile = 1 Target.
- Đổi target = tạo profile mới, không update.
- Switch profile = reissue JWT via `POST /auth/switch-profile`.

## 401 handling

- `on-error.ts` trên QueryClient: 401 → `useAuth.getState().logout()`.
- `_app.tsx` useEffect: `!isAuthenticated` → redirect landing.
- `api.ts` KHÔNG handle 401. Không `window.location.replace`.

---
See also: [[api-conventions]] · [[anti-patterns]]
