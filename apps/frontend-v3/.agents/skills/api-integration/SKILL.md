---
name: api-integration
description: >
  How this project fetches data from the backend. Load before writing any code
  that calls an API, creates a query hook, handles loading/error states, or
  touches authentication tokens.
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

## Auth Redirects

- `useEffect` watching `isAuthenticated` — never navigate() in render body
- Landing (`/`): redirect to `/dashboard` when authenticated
- App layout (`/_app`): redirect to `/?auth=login` when not authenticated
- `_app.tsx` guard order: `!isAuthenticated` → null, `!profile` → OnboardingModal, else → Outlet
