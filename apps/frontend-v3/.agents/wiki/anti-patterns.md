# Anti-patterns

Lỗi đã gặp và cách fix. Tra cứu trước khi viết code mới.

## Type casts (`as`)

**Sai:** `payload.prompt as string`, `s.kind as ExerciseKind`
**Đúng:** Discriminated union + `switch` hoặc `===` check. TS tự narrow.

**Sai:** `tokens.getRefresh()!`
**Đúng:** `tokens.getRefresh() ?? ""` hoặc early return.

**Sai:** `.json<{ data: { id: string; name: string } }>()`
**Đúng:** Define type trong `types.ts`, dùng `.json<ApiResponse<MyType>>()`.

## Auth redirect trong render body

**Sai:** `if (cond) { navigate("/"); return null }` — side effect trong render.
**Đúng:** `useEffect(() => { if (cond) navigate("/") }, [cond])` + `if (cond) return null`.

## Error handling rải rác

**Sai:** Mỗi component tự `try/catch` + `toast()`.
**Đúng:** Global `on-error.ts` trên QueryClient. Components chỉ `await`.

## API call ngoài useMutation

**Sai:** `await api.post(...)` trong callback — 401 không bị catch.
**Đúng:** Mọi write qua `useMutation` → QueryClient `onError` bắt.

## Token manipulation ngoài auth store

**Sai:** `tokens.setAccess()` trong hook/component. `applySwitch()` helper function.
**Đúng:** Auth store (`lib/auth.ts`) là nơi duy nhất gọi `tokens.*`. Bên ngoài gọi store actions.

## API interceptor làm quá nhiều việc

**Sai:** `api.ts` có `afterResponse` clear token + `beforeError` toast + redirect.
**Đúng:** `api.ts` chỉ gắn token. Error handling ở QueryClient. Auth redirect ở route guards.

## Optional chaining trên guaranteed data

**Sai:** `profile?.nickname` trong `_app` context (đã guard `isAuthenticated`).
**Đúng:** `useSession()` trả typed non-null. Dùng `profile.nickname`.

## Inline map cho fixed UI sets

**Sai:** `BUTTONS.map(btn => <button style={{color: btn.color}}>...)`.
**Đúng:** Viết tường minh từng button. Dễ đọc, dễ style riêng.

## Props quá nhiều

**Sai:** Component nhận 6+ props rời rạc (`backTo, backParams, title, message, mascot, total`).
**Đúng:** Group related props vào shared type (`BackLink`). Props ≤ 3.

## Route page chứa logic

**Sai:** Route page 140+ lines với hooks, handlers, sub-components inline.
**Đúng:** Route page ≤ 80 lines, chỉ compose. Logic trong `use-*.ts`, UI trong `components/`.

---
See also: [[auth-architecture]] · [[api-conventions]]
