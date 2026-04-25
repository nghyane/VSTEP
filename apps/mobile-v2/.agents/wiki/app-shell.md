# Mobile App Shell Architecture

## Navigation Structure

```
app/
├── _layout.tsx                 # Root: AuthProvider + QueryClientProvider
├── index.tsx                   # Entry: redirect to auth or app
├── (auth)/                     # Auth group (modal)
│   ├── _layout.tsx            # Modal presentation
│   ├── login.tsx
│   └── register.tsx
└── (app)/                      # Main app group
    ├── _layout.tsx            # Stack layout for all app screens
    ├── (tabs)/                # Bottom tab navigation
    │   ├── _layout.tsx        # Tab config
    │   ├── index.tsx          # Dashboard (Overview)
    │   ├── practice.tsx       # Practice Hub
    │   ├── exams.tsx          # Exam List
    │   └── profile.tsx        # Profile
    ├── practice/              # Practice routes
    ├── exam/                  # Exam routes
    ├── vocabulary/            # Vocab routes
    └── ...
```

## Auth Flow

1. App launches → `_layout.tsx` restores session from SecureStore
2. If no valid token → redirect to `/(auth)/login`
3. If valid token but no profile → redirect to `/(app)/onboarding`
4. If authenticated with profile → show tabs

## State Providers

```tsx
// app/_layout.tsx
<SafeAreaProvider>
  <QueryClientProvider client={queryClient}>
    <AuthContext.Provider value={authValue}>
      <HapticsProvider>
        <Stack>...</Stack>
      </HapticsProvider>
    </AuthContext.Provider>
  </QueryClientProvider>
</SafeAreaProvider>
```

## Safe Area Strategy

- `useSafeAreaInsets()` in every screen with scrollable content
- Add `spacing["2xl"]` to bottom inset for comfortable padding
- Tab bar handles its own safe area via `react-native-safe-area-context`
