# TanStack Router

## File-based routing

- Layout: `name.tsx` renders `<Outlet />`, content in `name/index.tsx`
- Dynamic: `$paramName.tsx`
- Pathless layout: `_name.tsx` (e.g. `_app.tsx`, `_focused.tsx`)
- Khi route có children (directory cùng tên) → file `.tsx` phải render `<Outlet />`

## validateSearch

Validate URL search params bằng `===` check, không `includes()` + cast:

```ts
// Đúng
validateSearch: (s) => {
  if (s.auth === "login" || s.auth === "register") return { auth: s.auth }
  return {}
}

// Sai
validateSearch: (s) => ({
  auth: ["login", "register"].includes(s.auth as string) ? (s.auth as AuthParam) : undefined
})
```

## Auth guards

- `useEffect` watching state → navigate. Không navigate trong render body.
- `if (!state) return null` sau useEffect — prevent flash.

---
See also: [[anti-patterns]] · [[auth-architecture]]
