# TanStack Query

## QueryClient setup

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: false },
    mutations: { onError },
  },
})
queryClient.getQueryCache().config.onError = onError
queryClient.getMutationCache().config.onError = onError
```

Global `onError` (`lib/on-error.ts`) handles 401 → logout, else → toast.

## Query patterns

- Queries in `features/{name}/queries.ts`
- Response type: `.json<ApiResponse<T>>()` — T from `types.ts`
- Selectors via `select` option for derived data
- `enabled` flag khi data dependency chưa sẵn sàng

## Mutation patterns

- Actions in `features/{name}/actions.ts` — plain async functions
- Hooks `use-*.ts` wrap `useMutation` khi cần invalidate/state
- Components không try/catch — global onError handles

## Invalidation — match by **prefix**, not equality

`invalidateQueries({ queryKey })` match những query có queryKey **bắt đầu bằng** prefix đó. Cha invalidate con, **không** ngược lại.

| QueryKey trong cache | Invalidate `["x"]` | Invalidate `["x", "y"]` |
|---|---|---|
| `["x"]` | ✅ match | ❌ KHÔNG match |
| `["x", "y"]` | ✅ match | ✅ match |
| `["x", "z"]` | ✅ match | ❌ KHÔNG match |

### Quy tắc bắt buộc

1. **Khi nhiều query share một resource** (vd `exam-sessions`), TẤT CẢ phải dùng **cùng prefix mảng**:
   - `["exam-sessions"]` — list dashboard
   - `["exam-sessions", "active"]` — session đang chạy
   - `["exam-sessions", sessionId]` — chi tiết
   - `["exam-sessions", "mine"]` — list cá nhân (tránh, dùng `["exam-sessions"]` luôn)

2. **Sau mutation, invalidate prefix gốc cao nhất** để hit tất cả biến thể:
   ```ts
   // ❌ SAI — chỉ match 1 trong 4 query, dashboard list ["exam-sessions"] miss
   qc.invalidateQueries({ queryKey: ["exam-sessions", "mine"] })
   qc.invalidateQueries({ queryKey: ["exam-sessions", "active"] })
   qc.invalidateQueries({ queryKey: ["exam-sessions", session.id] })

   // ✅ ĐÚNG — match tất cả query bắt đầu bằng "exam-sessions"
   qc.invalidateQueries({ queryKey: ["exam-sessions"] })
   ```

3. **Symptom debug khi sai:** "Phải F5 mới thấy data mới" — chứng tỏ mutation `onSuccess` đang invalidate key con, query cha không bị match → cache stale.

4. **Audit checklist trước khi viết mutation mới:**
   - Grep tất cả query keys liên quan: `grep -r 'queryKey:.*"resource-name"' src/`
   - Tìm prefix chung ngắn nhất → invalidate prefix đó (hoặc kèm thêm `["overview"]`, `["streak"]`, ... nếu data ảnh hưởng).

---
See also: [[api-conventions]] · [[anti-patterns]]
