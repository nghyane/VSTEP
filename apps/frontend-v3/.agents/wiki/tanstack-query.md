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

---
See also: [[api-conventions]] · [[anti-patterns]]
