---
name: typescript
description: "TypeScript patterns, type conventions, naming, code style. Load when writing complex types, reviewing code style, or refactoring."
---

# TypeScript & Code Style — frontend-v2

## Type rules

1. **Strict mode bắt buộc.** `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters` — không tắt.

2. **Không `any`. Không `@ts-ignore`.** Cần thoát type system → dùng `unknown` rồi narrow. `@ts-expect-error` chỉ khi có comment giải thích.

3. **Không `as` cast** trừ ở boundary I/O (parsed JSON, DOM query, `event.target`) và phải có comment.

4. **Type diễn đạt invariant.** Dùng discriminated union thay vì boolean flag rời rạc:
    ```ts
    type State =
      | { status: "loading" }
      | { status: "error"; error: Error }
      | { status: "success"; data: T }
    ```

5. **`interface` cho props, `type` cho union/intersection/mapped.** Destructure props với type rõ ràng, không spread `...props` tùy tiện xuống DOM node.

6. **Children là `React.ReactNode`.** React 19 bỏ global `JSX` namespace.

## Naming

- Component `PascalCase`, hook `useCamelCase`, biến/hàm `camelCase`, constant `SCREAMING_SNAKE_CASE`.
- File trùng tên export chính: `Button.tsx` → `Button`.
- Boolean: `isLoading`, `hasError`, `canSubmit`, `shouldRetry`.
- Event handler: prop là `onX`, internal là `handleX`.

## Code style

- **Tránh magic number và magic string.** Giá trị domain trích thành `const`.
- **Không commented-out code.** Git nhớ cho bạn.
- **Import order do Biome lo.** `organizeImports` đã enable.
- **Không barrel file** (`index.ts` re-export). Dùng alias `#/`.
- **Không relative import vượt `./`.** Dùng `#/` alias.
