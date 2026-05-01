---
name: mobile-data-patterns
description: "TanStack Query + Zustand + API integration patterns. Server state, mutations, local stores, error handling, token refresh. Load when working with data layer."
---

# Mobile Data Patterns

## QueryClient Setup

```ts
// src/lib/query-client.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: false },
    mutations: { onError: globalErrorHandler },
  },
});
queryClient.getQueryCache().config.onError = globalErrorHandler;
queryClient.getMutationCache().config.onError = globalErrorHandler;
```

- Global error handler: 401 → logout, else → toast/Alert
- `staleTime: 5 minutes` — reasonable for mobile
- `retry: false` — fail fast on mobile, user can retry manually

## API Client

```ts
// src/lib/api.ts
import { getAccessToken } from "./auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.vstepgo.com";

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
```

- Key transforms: Laravel snake_case ↔ React Native camelCase
- Auto-unwrap `{ data: T }` response wrapper
- Auto-refresh 401 tokens via `tryRefresh()`

## Query Patterns

```ts
// src/hooks/use-exams.ts
export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: () => api.get<Exam[]>("api/v1/exams"),
  });
}
```

- `queryKey` format: `["feature", id?]` — flat arrays
- `select` option for derived data
- `enabled` flag when dependency not ready

## Mutation Patterns

```ts
// src/hooks/use-auth.ts
export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }) => loginApi(email, password),
    onSuccess: (data) => {
      // side effects here
    },
    onError: (error) => {
      // toast/Alert
    },
  });
}
```

- All API writes through `useMutation` — global onError catches 401
- Components call `mutation.mutate()` — no try/catch
- `onSuccess` for side effects (navigation, state update)

## Zustand Local Stores

```ts
// src/features/coin/coin-store.ts
import { create } from "zustand";

interface CoinStore {
  amount: number;
  setAmount: (n: number) => void;
  addCoins: (n: number) => void;
}

export const useCoinStore = create<CoinStore>((set) => ({
  amount: 0,
  setAmount: (n) => set({ amount: n }),
  addCoins: (n) => set((s) => ({ amount: s.amount + n })),
}));
```

- Use Zustand for: coin, streak, notification (local state only)
- Sync with backend on app launch via `loadXxx()` functions
- No async in store — async in `loadXxx()` functions in `api.ts`

## Auth Flow

```ts
// Token storage: expo-secure-store (not AsyncStorage)
await SecureStore.setItemAsync("vstep_access_token", token);
await SecureStore.setItemAsync("vstep_user", JSON.stringify(user));
```

- Login → save tokens → update auth state
- App launch → restore from SecureStore → refresh token
- 401 → `tryRefresh()` → if fail → logout → redirect login
- Logout → clear SecureStore → clear QueryClient cache

## Error Handling

- **Never** try/catch in components for toast
- Global QueryClient onError handles 401 → logout
- Use React Native `Alert.alert()` for user-facing errors
- Log errors for debugging, but don't expose raw errors to UI

## Data Rules

- Backend response: `{ data: T }` → `ApiResponse<T>`
- Null handling: `{value && <Component />}` — don't hide null with `?? fallback`
- Types defined in `src/types/api.ts` — don't inline `.json<{...}>`
