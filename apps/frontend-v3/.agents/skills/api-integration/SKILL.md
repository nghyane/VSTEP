---
name: api-integration
description: "API client setup, TanStack Query patterns, request/response types, error handling, auth state, useSession. Load when creating queries, adding API calls, or debugging data fetching."
---

# API Integration

## API Client

- `src/lib/api.ts` — ky instance with JWT token interceptor
- Token persistence: `src/lib/tokens.ts`
- Only responsibility: attach token to requests
- No error handling, no toast, no redirect in api.ts

## Response Types

- Backend always returns `{ data: T }` — use `ApiResponse<T>` from `lib/api.ts`
- Feature types in `features/{name}/types.ts` — never inline in `.json<>()`
- Queries: `api.get("url").json<ApiResponse<T>>()`
- Mutations: `api.post("url", { json: body }).json<ApiResponse<T>>()`

## Error Handling

- Global handler: `src/lib/on-error.ts`
- Registered on QueryClient caches in `main.tsx` — covers all queries + mutations
- 401 → `useAuth.getState().logout()` (triggers redirect via useEffect)
- Other errors → toast with `response.message` from backend
- Components NEVER try/catch API calls for toast
- Auth store NEVER handles errors — just throws

## Auth

- Store: `src/lib/auth.ts` — Zustand discriminated union state
- `isAuthenticated: true` guarantees `user: User` + `profile: Profile` (non-null)
- `useSession()` for components inside `_app` — returns typed `{ user, profile }`
- `useAuth` for auth guards and login/register/logout actions

## Auth Redirects

- `useEffect` watching `isAuthenticated` — never navigate() in render body
- Landing (`/`): redirect to `/dashboard` when authenticated
- App layout (`/_app`): redirect to `/?auth=login` when not authenticated
