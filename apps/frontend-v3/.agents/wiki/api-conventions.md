# API & Data Conventions

## Response formats

Backend dùng Laravel Resource cho mọi endpoint:

```
Single:    { "data": T }
Collection: { "data": T[] }
Paginated:  { "data": T[], "meta": PaginationMeta, "links": PaginationLinks }
Error:      { "message": string, "errors"?: Record<string, string[]> }
```

Frontend types:
```ts
interface ApiResponse<T> { data: T }
interface PaginatedResponse<T> { data: T[]; meta: PaginationMeta; links: PaginationLinks }
```

## Null handling

- API trả `null` → type `T | null`. JSON không có `undefined`.
- Render: `{value && <Comp />}` hoặc `value ?? fallback`
- Không `?.` trên guaranteed non-null (dùng `useSession()`)
- Không `?? "fallback"` để giấu null — nếu null không expected thì type phải non-null

## Data flow

```
Laravel Resource → JSON → ky → .json<ApiResponse<T>>() → TanStack Query → component
                                                          ↑
                                                    types.ts defines T
```

## Feature folder (bắt buộc)

```
features/{name}/
  types.ts      — bắt buộc, kể cả 1 type
  queries.ts    — reads (queryOptions + ApiResponse<T>)
  actions.ts    — writes (pure async, return response)
  use-*.ts      — complex state (useReducer + useMutation)
  components/   — UI
```

## Mutations

- actions.ts: pure API calls, return response, no side effects
- use-*.ts: useMutation, side effects in onSuccess (dispatch reducer action)
- Component không import `api`, không try/catch

## Store

- Discriminated union cho state machines (auth)
- Store actions = single source of truth cho side effects (tokens, state)
- Bên ngoài chỉ gọi actions

---
See also: [[auth-architecture]] · [[state-patterns]] · [[anti-patterns]] · [[tanstack-query]]
