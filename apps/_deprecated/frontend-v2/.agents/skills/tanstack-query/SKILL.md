---
name: tanstack-query
description: "TanStack Query patterns, data fetching, cache invalidation, route loaders. Load when working with server state, queries, mutations."
---

# TanStack Query Patterns — frontend-v2

## Core rules

1. **Không fetch trong `useEffect`.** Dùng TanStack Query hoặc route loader. Effect-based fetch tạo race condition, waterfall, double-fetch dưới StrictMode.

2. **Không `useState` để mirror server data.** Server state là quyền của TanStack Query.

3. **Query viết dưới dạng `queryOptions` factory.** Định nghĩa một lần, dùng ở cả loader (`ensureQueryData`) và component (`useSuspenseQuery`). Không gọi `queryClient` trực tiếp trong component.

4. **Query key theo factory pattern.** Mỗi resource có một object key: `{ all, list(params), detail(id) }`. Đây là nguồn duy nhất của key. Invalidate luôn qua factory.

5. **`staleTime` khai báo một lần** trong `queryOptions` factory. Không override per-call.

6. **URL là nguồn của query state.** Filter, pagination, sort, selected tab đặt trong search params. Search params phải có `validateSearch` schema. Query key derive từ URL.

7. **4 trạng thái phải design đủ.** Loading, error, empty, success. Loading/error do Suspense + ErrorBoundary ở route. Empty/success do component tự xử.

8. **Mutation invalidate bằng key, không `setState` tay.** `onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.list() })`.

## Pattern: route loader + suspense query

```tsx
// lib/queries/example.ts
export const exampleQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["example", id],
    queryFn: () => mockFetchExample(id),
    staleTime: 5 * 60 * 1000,
  })

// route file
export const Route = createFileRoute("/_app/example/$id")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(exampleQueryOptions(params.id)),
  component: ExamplePage,
})

// component
function ExamplePage() {
  const { id } = Route.useParams()
  const { data } = useSuspenseQuery(exampleQueryOptions(id))
  // ...
}
```

## Mock files

Every mock function that will be replaced by API must have:
```ts
// TODO(backend): GET /api/examples/:id
// Response: { id, title, items: ExampleItem[] }
```
