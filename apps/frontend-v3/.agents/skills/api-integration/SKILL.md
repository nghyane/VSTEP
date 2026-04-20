---
name: api-integration
description: >
  How this project fetches data from the backend. Load before writing any code
  that calls an API, creates a query hook, handles loading/error states, or
  touches authentication tokens.
---

# API Integration

- Client: `src/lib/api.ts` — ky v2 with JWT interceptor
- Auth store: `src/lib/auth-store.ts` — Zustand, not Context/Provider
- Query example: `src/features/dashboard/queries.ts`
- Response type: `ApiResponse<T>` in `lib/api.ts`

## Error handling

- Global toast via ky `beforeError` hook in `api.ts` — all API errors auto-show toast
- Components NEVER try/catch API calls for toast — just `await` and let it throw
- Error parser: `src/lib/api-error.ts` reads `error.data` (ky pre-parsed body)
- Backend returns Vietnamese error messages (Laravel `lang/vi/`)

## Auth redirects

- Use `useEffect` watching `isAuthenticated` — never `navigate()` in render body
- Landing (`/`): redirect to `/dashboard` when authenticated
- App layout (`/_app`): redirect to `/?auth=login` when not authenticated
- 401 responses: `afterResponse` hook clears tokens + `window.location.replace("/")`
