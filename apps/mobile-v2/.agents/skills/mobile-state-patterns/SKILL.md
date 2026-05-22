---
name: mobile-state-patterns
description: "TanStack Query + useMutation + useReducer patterns. Auth flow, local stores, error handling, API integration. Load when working with data/state."
---

# Mobile State Patterns

## Core Architecture

```
Component → Hook (useQuery/useMutation) → API → Backend
                ↓
          useReducer (session state)
                ↓
          Zustand (local stores: coin, streak)
```

**Rules:**
- Server state = TanStack Query
- Session state = useReducer  
- Local UI state = useState (simple) or Zustand (complex, shared)
- Auth = React Context + SecureStore

## TanStack Query

### Setup

```ts
// src/lib/query-client.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: false },
    mutations: { onError: globalErrorHandler },
  },
});
```

### Queries (Read)

```ts
// src/hooks/use-exams.ts
export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: () => api.get<Exam[]>("api/v1/exams"),
  });
}

// With params
export function useExam(id: string) {
  return useQuery({
    queryKey: ["exam", id],
    queryFn: () => api.get<ExamDetail>(`api/v1/exams/${id}`),
    enabled: !!id,
  });
}

// With select
export function useExamList() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: () => api.get<Exam[]>("api/v1/exams"),
    select: (data) => ({
      exams: data,
      totalCount: data.length,
      hasExams: data.length > 0,
    }),
  });
}
```

### Mutations (Write)

```ts
// src/hooks/use-auth.ts
export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: LoginInput) => 
      loginApi(email, password),
    onSuccess: (data) => {
      // Auth context handles token storage
    },
  });
}

// Usage in component
const login = useLogin();

const handleSubmit = () => {
  login.mutate({ email, password });
  // DO NOT: await login.mutateAsync() + try/catch
};
```

**MANDATORY:**
- All API POST/PATCH/DELETE → `useMutation`
- DO NOT try/catch in component for API calls
- Global `onError` handles 401 → logout
- Side effects in `onSuccess`, not inline

## useReducer Patterns

### Practice Session

```ts
type PracticeState = {
  currentIndex: number;
  answers: Map<string, number>;
  revealed: Set<string>;
  status: "idle" | "active" | "completed";
};

type PracticeAction =
  | { type: "INIT"; count: number }
  | { type: "ANSWER"; questionId: string; answer: number }
  | { type: "REVEAL"; questionId: string }
  | { type: "NEXT" }
  | { type: "COMPLETE" };

function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
  switch (action.type) {
    case "INIT":
      return {
        currentIndex: 0,
        answers: new Map<string, number>(),
        revealed: new Set<string>(),
        status: "active",
      };
    case "ANSWER":
      return {
        ...state,
        answers: new Map(state.answers).set(action.questionId, action.answer),
      };
    case "REVEAL":
      return {
        ...state,
        revealed: new Set(state.revealed).add(action.questionId),
      };
    case "NEXT":
      return { ...state, currentIndex: state.currentIndex + 1 };
    case "COMPLETE":
      return { ...state, status: "completed" };
    default:
      return state;
  }
}

// Usage
const [state, dispatch] = useReducer(practiceReducer, {
  currentIndex: 0,
  answers: new Map<string, number>(),
  revealed: new Set<string>(),
  status: "idle",
});
```

**Important:**
- Generic type parameters MANDATORY for Map/Set in initial state
- Discriminated union for actions — `switch (action.type)` exhaustive
- DO NOT inline setState in mutation callback — dispatch action in `onSuccess`

### Exam Session

```ts
type ExamPhase = "device-check" | "active" | "submitting" | "submitted";

type ExamState = {
  phase: ExamPhase;
  currentSection: number;
  answers: Record<string, string>;
  timeLeft: number;
};

type ExamAction =
  | { type: "START_EXAM" }
  | { type: "ANSWER"; questionId: string; value: string }
  | { type: "NEXT_SECTION" }
  | { type: "SUBMIT" }
  | { type: "TICK"; seconds: number };

function examReducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case "START_EXAM":
      return { ...state, phase: "active" };
    case "ANSWER":
      return { ...state, answers: { ...state.answers, [action.questionId]: action.value } };
    case "NEXT_SECTION":
      return { ...state, currentSection: state.currentSection + 1 };
    case "SUBMIT":
      return { ...state, phase: "submitting" };
    case "TICK":
      return { ...state, timeLeft: Math.max(0, state.timeLeft - action.seconds) };
    default:
      return state;
  }
}
```

## Zustand Local Stores

### Pattern

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

**Rules:**
- Store = state sync ONLY
- NO async in store
- Async operations = separate `loadXxx()` functions
- Load data on app launch in `_layout.tsx`

### Sync with Backend

```ts
// src/features/coin/coin-store.ts
export async function loadCoins() {
  try {
    const data = await api.get<{ amount: number }>("api/v1/wallet");
    useCoinStore.getState().setAmount(data.amount);
  } catch {
    // Ignore — use default 0
  }
}

// In _layout.tsx
useEffect(() => {
  Promise.all([loadCoins(), loadStreakData(), loadNotifications()])
    .catch(() => undefined);
}, []);
```

## Auth Flow

### Context

```ts
// src/hooks/use-auth.ts
type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

interface AuthCtx {
  status: AuthStatus;
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (accessToken: string, refreshToken: string, user: AuthUser, profile: Profile | null) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthCtx>({...});
export function useAuth() { return useContext(AuthContext); }
```

### Token Storage

```ts
// src/lib/auth.ts
import * as SecureStore from "expo-secure-store";

export async function saveTokens(accessToken: string, refreshToken: string, user: AuthUser, profile: Profile | null) {
  await Promise.all([
    SecureStore.setItemAsync("vstep_access_token", accessToken),
    SecureStore.setItemAsync("vstep_refresh_token", refreshToken),
    SecureStore.setItemAsync("vstep_user", JSON.stringify(user)),
    SecureStore.setItemAsync("vstep_profile", JSON.stringify(profile)),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync("vstep_access_token"),
    SecureStore.deleteItemAsync("vstep_refresh_token"),
    SecureStore.deleteItemAsync("vstep_user"),
    SecureStore.deleteItemAsync("vstep_profile"),
  ]);
}
```

**MANDATORY:**
- Token storage = SecureStore (NOT AsyncStorage)
- Auth store is the ONLY place calling `SecureStore.*`
- Components DO NOT import `SecureStore` directly

### Route Guard

```ts
// app/_layout.tsx
const segments = useSegments();
const router = useRouter();
const { status, profile } = useAuth();

useEffect(() => {
  if (status === "initializing") return;
  
  const inAuthGroup = segments[0] === "(auth)";
  
  if (status !== "authenticated" && !inAuthGroup) {
    router.replace("/(auth)/login");
  } else if (status === "authenticated" && !profile && segments[1] !== "onboarding") {
    router.replace("/(app)/onboarding");
  } else if (status === "authenticated" && inAuthGroup) {
    router.replace("/(app)/(tabs)");
  }
}, [status, profile, segments, router]);
```

**Rules:**
- Guard in `useEffect`, NOT in render body
- `if (status === "initializing") return;` — prevent flash
- After useEffect: `if (!isAuthenticated) return null;` — render nothing

## Error Handling

### Global Handler

```ts
// src/lib/query-client.ts
function globalErrorHandler(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    useAuth.getState().signOut();
    return;
  }
  // Toast/Alert for other errors
}
```

### Component Pattern

```tsx
// RIGHT: No try/catch
const mutation = useMutation({
  mutationFn: submitExam,
  onSuccess: () => router.push("/result"),
});

const handleSubmit = () => mutation.mutate(sessionId);

// WRONG: try/catch in component
const handleSubmit = async () => {
  try {
    await api.post("/submit", data);
    router.push("/result");
  } catch (e) {
    Alert.alert("Error", e.message);
  }
};
```

## Anti-patterns

❌ **WRONG:** Direct API call in component
```ts
const data = await fetch("/api/exams");
```

✅ **RIGHT:** Through useQuery
```ts
const { data } = useQuery({ queryKey: ["exams"], queryFn: () => api.get("/api/exams") });
```

❌ **WRONG:** `as` cast
```ts
const exam = response as Exam;
```

✅ **RIGHT:** Generic type
```ts
const exam = response as ExamDetail; // only at boundary
// or define type in types.ts
```

❌ **WRONG:** Optional chaining on guaranteed data
```ts
profile?.nickname // in authenticated context
```

✅ **RIGHT:** Direct access after guard
```ts
if (!profile) return null;
profile.nickname
```
