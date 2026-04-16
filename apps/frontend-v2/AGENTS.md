# VSTEP Frontend — Coding Rules

Ưu tiên code đúng, rõ, dễ bảo trì. Rules này là default mạnh; lệch default phải có lý do kỹ thuật rõ ràng.

Stack: React 19 + TypeScript strict + TanStack Router + TanStack Query + Tailwind v4 + shadcn/ui + Biome + Bun. SPA thuần, không SSR, không Server Components.

Ký hiệu: rule có **[tool]** được enforce tự động. Còn lại review tay.

## I. Kiến trúc

1. **SPA thuần.** Không SSR, không server functions, không `use server`. Build ra `dist/` là static files.
2. **Data chảy một chiều.** API → `lib/api` (transform + dịch error) → `queryOptions` factory → component. Không fetch ngược từ component lên. (`lib/api` là structure target, tạo khi có consumer đầu tiên.)
3. **Feature module độc lập.** `routes/vocabulary/`, `routes/grammar/`,... không cross-import lẫn nhau. Code dùng chung đặt ở `lib/`, `components/common/`, hoặc `types/`.
4. **Dependency chảy xuống, không vòng.** `routes → hooks → lib`. `components/feature → components/ui`. Không đi ngược chiều, không circular import.
5. **Tách ranh giới rõ.** Data fetching, UI rendering, business logic, và routing không trộn trong cùng một file nếu có thể tách hợp lý.

## II. React

6. **Rules of React là bất biến.** Component và hook phải pure, idempotent, không side effect trong render. Hooks gọi ở top level, chỉ trong React function hoặc custom hook. Không gọi component bằng function call — luôn dùng JSX. Vi phạm = bug, không phải style. **[biome]**
7. **Effect là escape hatch.** Không dùng `useEffect` để: fetch data, transform data cho render, reset state khi prop đổi, hay chain state updates. Effect chỉ để sync với thứ ngoài React (DOM API thuần, subscription, external library).
8. **State đặt đúng chỗ.**
   - Derived từ props/state → compute trong render.
   - UI-local → `useState`.
   - Server state → TanStack Query.
   - URL state (filter, page, tab, selected) → search params.
   - Cross-tree state → Context chỉ khi có ≥ 3 consumer thật.
9. **Không duplicate state.** Nếu A tính được từ B, không lưu A. Nếu A và B luôn đổi cùng nhau, chúng là một state.
10. **Reset state bằng `key` prop**, không bằng `useEffect`.

## III. Data fetching

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

Giới hạn do dự án tự đặt để review nhanh và chặn file phình. Vượt là bắt buộc refactor, trừ khi có lý do kỹ thuật cụ thể.

32. **Line length ≤ 100 chars.** **[biome formatter]**
33. **Cognitive complexity ≤ 15** per function. Review tay; nested conditional/loop nhiều tầng thì trích helper.
34. **File ≤ 300 dòng.** Vượt thì tách module theo ranh giới rõ.
35. **Function ≤ 50 dòng.** Vượt thì trích helper hoặc split component.
36. **Function parameters ≤ 3.** Nhiều hơn thì gom thành object có tên (`{ userId, role, options }`).
37. **Route page file ≤ 80 dòng.** Page chỉ compose layout + component + hook; logic thật ở hook và component con.

## VII. Hacky patterns — tự động reject

38. **Không `setTimeout(() => setState(...), 0)`** để "fix" render order. Tìm nguyên nhân thật.
39. **Không polling `setInterval` để chờ state.** Dùng event hoặc promise.
40. **Không global mutable state** ngoài query cache và router. Không `window.xxx`, không module-level `let`.
41. **Không inline business logic trong JSX event handler.** Trích thành function có tên.
42. **Không optional prop để handle "trường hợp đặc biệt".** Split component hoặc dùng discriminated union prop.
43. **Không `console.log` / `console.debug`** trong code commit. `console.warn` / `console.error` chỉ khi có lý do.

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
52. **Không inline `style={{}}`** trừ giá trị động không biểu diễn được bằng class (computed transform, measured dimension).
53. **Dark mode first-class.** Mọi token có dark variant. Test cả hai theme.

## X. Accessibility

Biome recommended đã bật rule set `a11y` làm sàn tối thiểu. Dưới đây là guideline review tay.

54. **Semantic HTML trước.** `<button>` cho action, `<a>` cho navigation, `<label>` cho form field. Không `<div onClick>`. **[biome]**
55. **Keyboard reachable.** Mọi interactive element tab được. Tab order khớp visual order.
56. **Focus visible.** Không `outline: none` nếu không có focus ring thay thế.
57. **Accessible name.** Visible label ưu tiên; `aria-label` chỉ khi không có text hiển thị (icon button).
58. **Dialog trap focus, đóng bằng Escape, restore focus khi đóng.** Dùng Radix/shadcn primitive, không tự build modal.
59. **Guideline:** nội dung tiếng Anh trong UI tiếng Việt nên wrap `<span lang="en">` khi hợp lý (heading, thuật ngữ dài). Không bắt buộc từng từ.

## XI. Error handling

60. **Throw error, không return.** Typed error hierarchy, không `{ ok: false, error }` tuple rải rác.
61. **Catch ở boundary.** ErrorBoundary ở route cho render error; `try/catch` chỉ ở user action handler (mutation `onError`, event handler). Không `try/catch` rải rác trong render path.
62. **Không swallow error.** Không `catch {}` rỗng. Không `.catch(() => null)` trừ khi có comment giải thích vì sao error an toàn để bỏ qua.
63. **User thấy message đã dịch, không exception string.** Không show `ECONNREFUSED` cho user. Dịch ở `lib/api` trước khi throw lên component.

## XII. Testing

Hiện chưa có test trong `src/`. Khi bắt đầu viết test:

64. **Test behavior, không test implementation.** Query by role/label/text; không query theo class name hay component internal.
65. **Mock ở network boundary** (MSW), không mock module. Mock module = test bám implementation.
66. **Integration > unit cho feature.** Unit test cho pure utility, integration test cho user flow.
67. **Không snapshot UI** cho component người viết. Snapshot chỉ cho output ổn định đã review.

## XIII. Security

68. **Không `dangerouslySetInnerHTML` với user data.** Nếu bắt buộc, sanitize bằng library nổi tiếng. **[biome — trừ override `components/ui/**`]**
69. **Không secret trong client code.** Bất cứ gì trong `import.meta.env.VITE_*` là public. Secret chỉ ở backend.
70. **Frontend không phải security layer.** Validate ở FE để cải thiện UX. Backend validate thật.
71. **Sanitize URL** trước khi render làm `href`. Reject `javascript:` scheme.

## XIV. RFC-first workflow for non-trivial changes

72. **RFC first for non-trivial frontend changes.** Trước khi propose implementation hoặc sửa code cho thay đổi lớn, agent phải tự kiểm tra xem bài có thuộc loại non-trivial không. Một thay đổi được xem là non-trivial nếu rơi vào ít nhất một trường hợp:
    - ảnh hưởng architecture, shared pattern, hoặc rule nền tảng của app;
    - thay đổi routing, auth flow, data fetching pattern, query key strategy, search params contract, hoặc state model;
    - thay đổi design system/shared UI primitives;
    - đụng từ 3 module/file responsibility trở lên;
    - có từ 2 phương án hợp lý trở lên và cần chọn trade-off.
73. **Nếu chưa có RFC cho bài non-trivial, không nhảy vào code ngay.** Agent phải dừng ở bước planning, tạo hoặc đề xuất một RFC ngắn trước. Chỉ được implement sau khi RFC đã được user/team chấp thuận rõ ràng.
74. **RFC là nguồn sự thật cho implementation.** Khi đã có RFC, agent phải dùng RFC để:
    - chốt problem, goals, non-goals;
    - breakdown task/checklist implementation;
    - giữ scope, từ chối scope creep ngoài RFC;
    - review implementation/PR theo decision đã chốt.
75. **RFC format tối thiểu.** Nếu agent cần draft RFC, dùng đúng khung sau:
    - Problem
    - Goals
    - Non-goals
    - Proposed solution
    - Alternatives considered
    - Risks / trade-offs
    - Rollout plan
    - Implementation plan
    Với frontend work, phải nghĩ tới thêm: user flow, loading/error/empty states, accessibility, analytics nếu có.
76. **Làm việc theo RFC.** Sau khi RFC được approve, agent phải chuyển RFC thành execution plan theo thứ tự:
    - breakdown phase/task;
    - xác định file/module bị ảnh hưởng;
    - implement từng phần đúng goals và non-goals;
    - verify theo Definition of Done;
    - nếu implementation lệch materially khỏi RFC, phải cập nhật RFC hoặc xin chốt lại trước khi tiếp tục.
77. **Không biến RFC thành thủ tục hình thức.** Không yêu cầu RFC cho bug nhỏ, UI tweak nhỏ, text change, styling nhỏ, hoặc refactor hẹp không đổi behavior. Với bài trivial, agent có thể làm trực tiếp nhưng vẫn phải nêu scope ngắn gọn trước khi sửa.

## XV. Definition of done

Feature chưa done nếu chưa đủ:

1. `bunx --bun tsc --noEmit` pass, 0 error.
2. `bunx biome check .` pass, 0 error và 0 warning mới.
3. `bun run build` pass.
4. Đủ bốn trạng thái: loading, error, empty, success.
5. Keyboard navigate end-to-end được.
6. Dark mode render đúng.
7. Không có dep mới thừa (mỗi dep có consumer trong diff).
