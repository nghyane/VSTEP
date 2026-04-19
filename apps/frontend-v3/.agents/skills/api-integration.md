# Skill: API Integration

## Client Setup

```ts
// lib/api.ts
import ky from "ky"

export const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  hooks: {
    beforeRequest: [(req) => {
      const token = localStorage.getItem("access_token")
      if (token) req.headers.set("Authorization", `Bearer ${token}`)
    }],
  },
})
```

## Query Pattern

```ts
// features/dashboard/queries.ts
import { queryOptions } from "@tanstack/react-query"
import { api } from "#/lib/api"

export const overviewQuery = queryOptions({
  queryKey: ["overview"],
  queryFn: () => api.get("overview").json<OverviewResponse>(),
})
```

Route loader:
```ts
export const Route = createFileRoute("/_app/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(overviewQuery),
  component: DashboardPage,
})
```

## Auth Flow

- Login → store `access_token` + `refresh_token` in localStorage.
- 401 → try refresh → if fail → redirect `/login`.
- JWT claims: `sub` (account_id), `role`, `active_profile_id`.

## Response Shape

```ts
interface ApiResponse<T> { data: T }
interface ApiError { message: string; errors?: Record<string, string[]> }
```

## Key Endpoints

- `GET /overview` — dashboard data
- `GET /streak` — streak detail
- `GET /exams` — exam list
- `POST /exams/{id}/sessions` — start exam (costs coins)
- `GET /wallet/balance` — coin balance
