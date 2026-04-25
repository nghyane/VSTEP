---
name: mobile-anti-patterns
description: "Common mistakes in React Native/Expo development with this codebase. Anti-patterns to avoid. Load when code review or debugging."
---

# Mobile Anti-patterns

## Type Safety

**Wrong:** `payload.prompt as string`
**Right:** Discriminated union + `switch` or `===` check. TS auto-narrows.

**Wrong:** `tokens.getRefresh()!`
**Right:** `tokens.getRefresh() ?? ""` or early return.

**Wrong:** `.json<{ data: { id: string; name: string } }>()`
**Right:** Define type in `types.ts`, use `.json<ApiResponse<MyType>>()`.

## Auth Redirect in Render

**Wrong:**
```tsx
if (!isAuthenticated) {
  router.replace("/(auth)/login");
  return null;
}
```

**Right:**
```tsx
useEffect(() => {
  if (!isAuthenticated) {
    router.replace("/(auth)/login");
  }
}, [isAuthenticated]);

if (!isAuthenticated) return null;
```

## Error Handling Scattered

**Wrong:** Each component does `try/catch` + `Alert.alert()`.
**Right:** Global QueryClient `onError` handles 401 → logout. Components use `Alert` only for user-friendly messages.

## API Calls Outside useMutation

**Wrong:**
```tsx
const handleSubmit = async () => {
  await api.post("/submit", data);
  router.push("/result");
};
```

**Right:**
```tsx
const mutation = useMutation({
  mutationFn: (d) => api.post("/submit", d),
  onSuccess: () => router.push("/result"),
});

const handleSubmit = () => mutation.mutate(data);
```

**Why:** QueryClient `onError` only catches errors from queries + mutations, not plain async calls.

## Token Manipulation Outside Auth Store

**Wrong:** `SecureStore.setItemAsync("vstep_access_token", token)` in component.
**Right:** Auth store (`src/lib/auth.ts`) is the only place that calls `SecureStore.*`. External code calls store actions.

## Optional Chaining on Guaranteed Data

**Wrong:** `profile?.nickname` inside authenticated context.
**Right:** `useAuth()` returns typed state. Use `profile!.nickname` only if guard is certain, better: use discriminated union.

## Inline Map for Fixed UI Sets

**Wrong:**
```tsx
{SKILLS.map(skill => (
  <DepthCard key={skill} variant="skill" skillColor={skill.color}>
    <Text>{skill.label}</Text>
  </DepthCard>
))}
```

**Right:** Write each card explicitly. Easier to read, style individually.
```tsx
<DepthCard variant="skill" skillColor={colors.light.skillListening}>
  <Text>Nghe</Text>
</DepthCard>
<DepthCard variant="skill" skillColor={colors.light.skillReading}>
  <Text>Đọc</Text>
</DepthCard>
```

## Too Many Props

**Wrong:** Component receives 6+ separate props.
**Right:** Group related props into shared type. Props ≤ 3.

## Route Page Contains Logic

**Wrong:** Route page 140+ lines with hooks, handlers, sub-components inline.
**Right:** Route page ≤ 80 lines, only compose. Logic in `src/hooks/`, UI in `src/components/`.

## Hardcoded Values

**Wrong:** `color: "#58CC02"`, `padding: 16`, `fontSize: 16`
**Right:** `colors.light.primary`, `spacing.base`, `fontSize.base`

## Mock Data in Components

**Wrong:** Hardcoded exam/practice data in components.
**Right:** Data from API (TanStack Query). If API doesn't exist, create endpoint first.

## Audio Controls During Exam

**Wrong:** Using native audio controls (`<audio controls />`).
**Right:** Hidden audio + custom progress bar. VSTEP standard: audio plays once only.

## AsyncStorage for Tokens

**Wrong:** `AsyncStorage.setItem("token", value)`
**Right:** `expo-secure-store` for sensitive data. Only use AsyncStorage for non-sensitive cached data.
