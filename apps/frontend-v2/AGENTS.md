# Frontend-v2 — Agent Instructions

React 19, TypeScript, TanStack Router, Tailwind v4, shadcn/ui. Mọi PR phải pass `pnpm exec tsc --noEmit` và `pnpm exec biome check`.

## Architecture

- **Mock-first, API-later.** Mock data: `lib/mock/*.ts`. Query layer: `lib/queries/*.ts`. Replace `queryFn: mockFetch*` → `apiFetch*` when backend ready. Components never import mock directly.
- **Data in the model, not in lookup files.** Data that varies per exercise (e.g., `sampleMarkers`) lives in the exercise interface, not in a separate `Record<id, ...>` file.
- **Match-string over character offset.** When storing text positions (highlight markers), store `{ match, occurrence }` and compute offset at render via `matchToRange()`. Never store hand-typed `{ start, end }`.
- **State split.** TanStack Query for server state. `localStorage` for user preferences. `sessionStorage` for ephemeral results (submit → result page).

## Code

- **TypeScript strict.** No `any` unless unavoidable. No `@ts-ignore`.
- **Biome clean.** `pnpm exec biome check` must pass. No disable comments without explanation.
- **Mock files must have TODO(backend) comments.** Every mock function that will be replaced by API must say: what endpoint, what request/response shape, where backend data lives.
- **No console.log.** Use structured logging or remove before commit.
- **Comments explain why, not what.** If a comment restates the code, delete it and rename instead.

## Design

- **Load skill `design-system`** when working on UI, components, styling, Tailwind classes, card patterns.
- **Source of truth:** `docs/skill-design.md` for full design tokens and component specs.

## Operations

- **No tests unless explicitly requested.**
- **No README/docs files unless explicitly requested.**
- **Stage only files related to the current change.**

11. **Không fetch trong `useEffect`.** Dùng TanStack Query hoặc route loader. Effect-based fetch tạo race condition, waterfall, double-fetch dưới StrictMode.
12. **Không `useState` để mirror server data.** Server state là quyền của TanStack Query.
13. **Query viết dưới dạng `queryOptions` factory.** Định nghĩa một lần, dùng ở cả loader (`ensureQueryData`) và component (`useSuspenseQuery`). Không gọi `queryClient` trực tiếp trong component.
14. **Query key theo factory pattern.** Mỗi resource có một object key: `{ all, list(params), detail(id) }`. Đây là nguồn duy nhất của key. Invalidate luôn qua factory.
15. **`staleTime` khai báo một lần** trong `queryOptions` factory. Không override per-call.
16. **URL là nguồn của query state.** Filter, pagination, sort, selected tab đặt trong search params. Search params phải có `validateSearch` schema. Query key derive từ URL.
17. **4 trạng thái phải design đủ.** Loading, error, empty, success. Loading/error do Suspense + ErrorBoundary ở route. Empty/success do component tự xử.
18. **Mutation invalidate bằng key, không `setState` tay.** `onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.list() })`.

## IV. TypeScript

19. **Strict mode bắt buộc.** `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports` — không tắt. **[tsc]**
20. **Không `any`. Không `@ts-ignore`.** Cần thoát type system dùng `unknown` rồi narrow. `@ts-expect-error` chỉ khi có comment giải thích nguyên nhân cụ thể.
21. **Không `as` cast** trừ ở boundary I/O (parsed JSON, DOM query, `event.target`) và phải có comment giải thích vì sao type system không tự suy ra được.
22. **Type diễn đạt invariant.** Dùng discriminated union thay vì boolean flag rời rạc:
    ```ts
    type State =
      | { status: "loading" }
      | { status: "error"; error: Error }
      | { status: "success"; data: T }
    ```
    Compiler đảm bảo handle đủ case.
23. **`interface` cho props, `type` cho union/intersection/mapped.** Destructure props với type rõ ràng, không spread `...props` tùy tiện xuống DOM node.
24. **Children là `React.ReactNode`.** React 19 bỏ global `JSX` namespace; `JSX.Element` phải import từ `react`, hẹp hơn `ReactNode` và không nhận string/number/array.

## V. Code style

25. **Naming rõ nghĩa.**
    - Component `PascalCase`, hook `useCamelCase`, biến/hàm `camelCase`, constant module-level `SCREAMING_SNAKE_CASE`.
    - File trùng tên export chính: `Button.tsx` → `Button`, `useAuth.ts` → `useAuth`.
    - Boolean: `isLoading`, `hasError`, `canSubmit`, `shouldRetry` (camelCase, không snake_case).
    - Event handler: prop là `onX`, internal là `handleX`.
26. **Tránh magic number và magic string.** Giá trị có ý nghĩa domain (URL endpoint, error code, CEFR level, route path) trích thành `const`. Giá trị local ngắn và obvious không cần ép thành constant.
27. **Comment giải thích lý do, không lặp lại code.** Nếu comment chỉ mô tả câu lệnh, xóa comment và đặt lại tên cho rõ hơn. Comment lie tệ hơn không có comment.
28. **Không commented-out code.** Git nhớ cho bạn rồi.
29. **Import order do Biome lo.** `organizeImports` đã enable, không sort tay. **[biome]**
30. **Không barrel file** (`index.ts` re-export). Phá tree-shaking, dễ tạo circular import. Ngoại lệ: `types/index.ts` chỉ chứa `export type`.
31. **Không relative import vượt `./`.** Dùng alias `#/` (khớp `package.json#imports` và `tsconfig paths`). Không `../../../lib/foo`. Không dùng `@/` trong code mới — giữ `#/` thống nhất.

## VI. Hard limits

32. **Line length ≤ 100 chars.** **[biome formatter]**
33. **Cognitive complexity ≤ 15** per function.
34. **File ≤ 300 dòng.** Vượt thì tách module.
35. **Function ≤ 50 dòng.** Vượt thì trích helper.
36. **Function parameters ≤ 3.** Nhiều hơn thì gom thành object.
37. **Route page file ≤ 80 dòng.** Page chỉ compose layout + component + hook.

## VII. Hacky patterns — tự động reject

38. **Không `setTimeout(() => setState(...), 0)`** để "fix" render order.
39. **Không polling `setInterval` để chờ state.** Dùng event hoặc promise.
40. **Không global mutable state** ngoài query cache và router.
41. **Không inline business logic trong JSX event handler.** Trích thành function có tên.
42. **Không optional prop để handle "trường hợp đặc biệt".** Split component hoặc dùng discriminated union prop.
43. **Không `console.log` / `console.debug`** trong code commit.

## VIII. Dead code — xóa ngay

44. **Không consumer = xóa.** Component, hook, util, type, dep không có chỗ nào import → xóa.
45. **Dep phải có lý do.** Thêm dep phải kèm consumer trong cùng commit.
46. **Không unused import, variable, parameter.** **[tsc + biome]**
47. **Không file "có thể cần sau".** YAGNI.
48. **TODO/FIXME phải có issue id.** Format: `TODO(#123): mô tả cụ thể`.

## IX. Styling

49. **Design token, không hardcode.** Dùng Tailwind token (`bg-primary`, `text-muted-foreground`), không `#3b82f6`, không `bg-[#xxx]`.
50. **Một styling strategy.** Tailwind v4 + shadcn tokens. Không mix CSS modules, styled-components, inline style.
51. **`cn()` cho conditional class.** Không build class string bằng template literal ternary.
52. **Không inline `style={{}}`** trừ giá trị động không biểu diễn được bằng class.
53. **Dark mode first-class.** Mọi token có dark variant. Test cả hai theme.

## X. Accessibility

54. **Semantic HTML trước.** `<button>` cho action, `<a>` cho navigation, `<label>` cho form field. Không `<div onClick>`. **[biome]**
55. **Keyboard reachable.** Mọi interactive element tab được. Tab order khớp visual order.
56. **Focus visible.** Không `outline: none` nếu không có focus ring thay thế.
57. **Accessible name.** Visible label ưu tiên; `aria-label` chỉ khi không có text hiển thị.
58. **Dialog trap focus, đóng bằng Escape, restore focus khi đóng.** Dùng Radix/shadcn primitive.

## XI. Error handling

60. **Throw error, không return.** Typed error hierarchy.
61. **Catch ở boundary.** ErrorBoundary ở route cho render error; `try/catch` chỉ ở user action handler.
62. **Không swallow error.** Không `catch {}` rỗng.
63. **User thấy message đã dịch, không exception string.**

## XII. Testing

64. **Test behavior, không test implementation.** Query by role/label/text.
65. **Mock ở network boundary** (MSW), không mock module.
66. **Integration > unit cho feature.**

## XIII. Security

68. **Không `dangerouslySetInnerHTML` với user data.**
69. **Không secret trong client code.**
70. **Frontend không phải security layer.** Validate ở FE để cải thiện UX. Backend validate thật.

## XIV. RFC-first workflow for non-trivial changes

72. **RFC first for non-trivial frontend changes.** Non-trivial = ảnh hưởng architecture, shared pattern, routing, auth flow, data fetching pattern, design system, hoặc đụng từ 3 module trở lên.
73. **Nếu chưa có RFC cho bài non-trivial, không nhảy vào code ngay.** Tạo RFC trước.
74. **RFC là nguồn sự thật cho implementation.**
75. **RFC format tối thiểu:** Problem, Goals, Non-goals, Proposed solution, Alternatives considered, Risks/trade-offs, Rollout plan, Implementation plan.
76. **Làm việc theo RFC.** Breakdown → implement → verify → nếu lệch thì update RFC.
77. **Không biến RFC thành thủ tục hình thức.** Trivial changes làm trực tiếp.

## XV. Post-edit check (bắt buộc)

78. **Luôn chạy biome check & lint sau mỗi lần sửa code.**
79. **Không tự ý commit.** Agent không được chạy `git commit` trừ khi user yêu cầu rõ ràng.

## XVI. Definition of done

1. `tsc --noEmit` pass.
2. `biome check .` pass.
3. `build` pass.
4. Đủ bốn trạng thái: loading, error, empty, success.
5. Keyboard navigate end-to-end được.
6. Dark mode render đúng.
7. Không có dep mới thừa.
