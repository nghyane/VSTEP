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

## Biome formatter — JSX inline expression

**Sai:** Multi-line `{condition && (\n  <Comp />\n)}` khi đủ ngắn để inline (line width 110).
```tsx
{skillDef && (
  <Icon name={skillDef.icon} size="xs" style={{ color: skillDef.color }} />
)}
```
**Đúng:** Inline khi toàn bộ expression ≤ 110 ký tự.
```tsx
{skillDef && <Icon name={skillDef.icon} size="xs" style={{ color: skillDef.color }} />}
```
Biome config: `lineWidth: 110`, `indentStyle: "tab"`. Luôn chạy `bunx biome check <files>` sau khi viết code.

## Biome `useMediaCaption` — không cần suppress

**Sai:** Thêm `{/* biome-ignore lint/a11y/useMediaCaption: ... */}` trước `<audio>`.
Biome v3 config đã tắt rule này → suppression comment bị báo "no effect" (warning).

**Đúng:** Chỉ dùng `<audio>` thẳng, không comment suppress.
```tsx
<audio ref={audioRef} src={url} preload="metadata" className="hidden" />
```

## useReducer — generic type parameters bắt buộc cho Map/Set trong initial state

**Sai:** TS suy luận sai thành `Map<unknown, unknown>` / `Set<unknown>`, gây lỗi `TS2322`.
```tsx
useReducer(reducer, {
  mcqAnswers: new Map(),     // ❌ Map<unknown, unknown>
  speakingDone: new Set(),    // ❌ Set<unknown>
})
```

**Đúng:** Chỉ định generic rõ ràng + `satisfies` cho object.
```tsx
useReducer(reducer, {
  mcqAnswers: new Map<string, number>(),
  speakingDone: new Set<string>(),
} satisfies ExamState)
```

## Skill chip — dùng `SkillChip` shared, không inline

**Sai:** mỗi component tự render pill cho kỹ năng + nhét thêm dot `<span className="size-1.5 rounded-full bg-current" />`.
```tsx
<span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full", SKILL_COLORS[skill])}>
  <span className="size-1.5 rounded-full bg-current" />
  Listening
</span>
```
Hệ quả: dot không tải thêm thông tin (label + màu đã đủ phân biệt), gây noise thị giác. Khi một chip được sửa bỏ dot thì các chip còn lại ở trang khác vẫn còn → UI không đồng bộ.

**Đúng:** dùng `SkillChip` trong `components/SkillChip.tsx`.
```tsx
import { SkillChip } from "#/components/SkillChip"
<SkillChip skill="listening" size="sm" />
```
- Size `sm` (`px-2 py-0.5 text-[11px]`) cho card compact, `md` (`px-2.5 py-1 text-xs`) cho header.
- Background tự tính qua `color-mix(... currentColor 12% ...)` đồng nhất khắp app.
- KHÔNG thêm dot/icon vào label. Nếu cần nhấn mạnh trạng thái (vd. đang làm) — dùng badge riêng bên ngoài chip.

Grep `SKILL_COLORS`, `skill-listening` trước khi viết chip mới để tránh duplicate.

## Invalidate sai prefix queryKey → cache stale, phải F5

Lỗi đã lặp **nhiều lần**. TanStack Query invalidate match theo **prefix**, không match equality.

**Sai:** Mutation `onSuccess` invalidate key con `["exam-sessions", "mine"]`, nhưng dashboard query dùng key cha `["exam-sessions"]`. Cha không match con → list không refetch → user phải F5.

```ts
// ❌ SAI — dashboard query ["exam-sessions"] không bị invalidate
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["exam-sessions", "mine"] })
  qc.invalidateQueries({ queryKey: ["exam-sessions", "active"] })
  qc.invalidateQueries({ queryKey: ["exam-sessions", session.id] })
}
```

**Đúng:** Invalidate prefix cao nhất — match cả parent và mọi child key.

```ts
// ✅ ĐÚNG — match TẤT CẢ ["exam-sessions", ...]
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["exam-sessions"] })
}
```

**Symptom**: "data mới chỉ hiện khi F5" → 99% là vấn đề này.

**Audit trước mutation mới:** `grep -r 'queryKey: \["resource-name"' src/features/` — list tất cả key dùng prefix đó. Lấy prefix ngắn nhất, invalidate đúng nó.

Chi tiết tra `tanstack-query.md` — section "Invalidation — match by prefix".

## Exam room — device-check phase bắt buộc trước khi vào phòng thi

- Phase order: `device-check` → `active` → `submitting` → `submitted`.
- Phase mặc định là `device-check`, không phải `active`.
- Trong `device-check`: render `<DeviceCheckScreen />` với 3 card (cấu trúc, kiểm tra âm thanh, lưu ý), KHÔNG render header/timer/panels.
- User bấm "Nhận đề & bắt đầu" → dispatch `START_EXAM` → chuyển sang `active`.
- Listening có modal riêng (`ListeningReadinessModal`) hiện bên trong panel với countdown 3s trước khi cho phép start audio.
- Audio listening KHÔNG dùng native `controls` — dùng hidden `<audio>` + custom progress bar ở bottom để enforce "phát một lần duy nhất" (VSTEP chuẩn).

---
See also: [[auth-architecture]] · [[api-conventions]] · [[state-patterns]]
