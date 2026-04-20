---
name: provider-pattern
description: >
  React context provider factory used in this project. Load before creating a
  new context, provider, or global state hook.
---

# Provider Pattern

- Factory: `src/lib/create-strict-context.ts`
- Usage: `const [Provider, useHook] = createStrictContext<Value>("Name")`
- Reference: `src/features/auth/AuthProvider.tsx`
- Use `useMemo` for value, `useCallback` for functions, lazy `useState` for localStorage init
