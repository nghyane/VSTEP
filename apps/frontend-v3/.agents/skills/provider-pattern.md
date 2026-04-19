# Skill: Provider Pattern

## Factory: `createStrictContext<T>(name)`

File: `src/lib/create-strict-context.ts`

```ts
const [Provider, useValue] = createStrictContext<MyValue>("MyName")
```

Returns `[Provider, useHook]` tuple. Hook throws nếu dùng ngoài Provider.

## Khi nào dùng

- Auth, Theme, hoặc bất kỳ cross-cutting state
- State cần reactive (re-render khi thay đổi)
- Không dùng cho server state (dùng TanStack Query)

## Pattern chuẩn

```tsx
// 1. Define value interface
interface AuthValue {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

// 2. Create context
const [Provider, useAuth] = createStrictContext<AuthValue>("Auth")
export { useAuth }

// 3. Provider component — chứa logic, expose value
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(...)
  const login = useCallback(...)
  const value = useMemo(() => ({ user, ... }), [user, ...])
  return <Provider value={value}>{children}</Provider>
}
```

## Rules

- `useMemo` cho value object — tránh re-render con khi parent render
- `useCallback` cho functions trong value
- State init từ localStorage dùng lazy initializer: `useState(() => ...)`
- Không đặt API call trong Provider — chỉ expose function, component gọi
- 1 Provider per concern (Auth, Theme...) — không gộp
