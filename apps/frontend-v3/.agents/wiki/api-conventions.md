# API Conventions

## Response format

Backend luôn trả `{ data: T }`. Frontend dùng `ApiResponse<T>` từ `lib/api.ts`.

Paginated: `{ data: T[], total: number }` — không raw Laravel paginator.

## api.ts

Chỉ 1 responsibility: gắn JWT token vào request.
Không error handling, không toast, không redirect.

## Queries

```ts
// Đúng
api.get("overview").json<ApiResponse<OverviewData>>()

// Sai — inline type
api.get("overview").json<{ data: { profile: {...} } }>()
```

Types luôn define trong `features/{name}/types.ts`.

## Error handling

Global `on-error.ts` registered trên QueryClient caches trong `main.tsx`.
- 401 → logout
- Else → toast `response.message`

Components KHÔNG try/catch. Auth store KHÔNG handle errors.

## Backend middleware

- `auth:api` — verify JWT, set `$request->user()`.
- `active-profile` — verify `active_profile_id` claim, set `$request->attributes->get('active_profile')`.
- Missing profile → 403 (không phải 401).

---
See also: [[auth-architecture]] · [[anti-patterns]]
