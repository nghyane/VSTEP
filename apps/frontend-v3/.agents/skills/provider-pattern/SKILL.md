---
name: provider-pattern
description: "React context provider factory with createStrictContext. Load when creating new providers or context."
---

# Provider Pattern

- Factory: `src/lib/create-strict-context.ts`
- Usage: `const [Provider, useHook] = createStrictContext<Value>("Name")`
- Reference: `src/features/auth/AuthProvider.tsx`
- Use `useMemo` for value, `useCallback` for functions, lazy `useState` for localStorage init
