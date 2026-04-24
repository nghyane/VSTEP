# State Management Patterns

## useReducer vs useState

Dùng `useReducer` khi:
- 3+ related states thay đổi cùng lúc (index + revealed + reviewed)
- State transitions có tên rõ ràng (init, reveal, advance, next)
- Cần access current state trong mutation callback

Dùng `useState` khi:
- 1-2 independent states
- Toggle đơn giản (open/close)

## useMutation cho mọi API write

Mọi API POST/PATCH/DELETE phải qua `useMutation` — không gọi trực tiếp từ callback.
Lý do: QueryClient `onError` chỉ bắt errors từ queries + mutations, không bắt plain async calls.

**Sai:**
```ts
const rate = async (rating) => {
  await reviewWord(wordId, rating) // 401 không bị catch
  setState(...)
}
```

**Đúng:**
```ts
const mutation = useMutation({
  mutationFn: (args) => reviewWord(args.wordId, args.rating),
  onSuccess: () => dispatch({ type: "advance" }) // side effects ở đây
})
const rate = (rating) => mutation.mutate({ wordId, rating })
```

## Mutation side effects

- `onSuccess` dispatch reducer action — không inline setState
- `mutation.isPending` thay `useState` submitting
- `mutate()` (fire-and-forget) thay `mutateAsync` + await khi không cần result ở call site

---
See also: [[anti-patterns]] · [[tanstack-query]]
