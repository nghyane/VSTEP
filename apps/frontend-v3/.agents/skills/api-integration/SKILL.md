---
name: api-integration
description: >
  How this project fetches data from the backend. Load before writing any code
  that calls an API, creates a query hook, handles loading/error states, or
  touches authentication tokens.
---

# API Integration

- Client: `src/lib/api.ts` — ky v2 with JWT interceptor
- Auth: `src/features/auth/AuthProvider.tsx`
- Query example: `src/features/dashboard/queries.ts`
- Response type: `ApiResponse<T>` in `lib/api.ts`
