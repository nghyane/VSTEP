# State Management Patterns

## useReducer vs useState

Use `useReducer` when:
- 3+ related states change together (index + revealed + answered)
- State transitions have clear names (init, answer, reveal, next)
- Need access to current state in mutation callback

Use `useState` when:
- 1-2 independent states
- Simple toggle (open/close, playing/paused)

## useMutation for all API writes

All API POST/PATCH/DELETE must go through `useMutation` — no direct calls from callbacks.
Reason: QueryClient `onError` only catches errors from queries + mutations, not plain async calls.

**Wrong:**
```ts
const rate = async (rating: number) => {
  await api.post("/review", { rating }); // 401 not caught
  setState({ ...state, rating });
};
```

**Right:**
```ts
const mutation = useMutation({
  mutationFn: (r: number) => api.post("/review", { rating: r }),
  onSuccess: () => dispatch({ type: "advance" }),
});
const rate = (rating: number) => mutation.mutate(rating);
```

## Mutation side effects

- `onSuccess` dispatches reducer action — no inline setState
- `mutation.isPending` replaces `useState` for submitting
- `mutate()` (fire-and-forget) instead of `mutateAsync` + await when result not needed at call site

## Discriminated Union for state machines

```ts
type PracticeState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "active"; currentIndex: number; answers: Map<string, number> }
  | { kind: "review"; answers: Map<string, { selected: number; correct: number }> }
  | { kind: "completed"; score: number };
```

Use `switch (state.kind)` for exhaustive handling — no `as` cast.

## Zustand local stores

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

- Use Zustand for: coin, streak, notification (local UI state)
- Sync with backend on app launch
- No async in store — async in separate `loadXxx()` functions
