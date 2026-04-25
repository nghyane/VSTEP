---
name: mobile-navigation
description: "Expo Router navigation patterns, tab layout, focus mode, safe area, gestures. Load when creating or modifying routes."
---

# Mobile Navigation Patterns

## App Shell

- Root layout: `app/_layout.tsx` — auth context provider + query client
- Auth group: `app/(auth)/` — login, register (modal presentation)
- App group: `app/(app)/_layout.tsx` — stack navigation
- Tabs: `app/(app)/(tabs)/_layout.tsx` — 4 tabs (Overview, Practice, Exams, Profile)

## Tab Navigation

```tsx
// app/(app)/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CustomTabBar } from "@/components/CustomTabBar";

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: "Overview" }} />
      <Tabs.Screen name="practice" options={{ title: "Practice" }} />
      <Tabs.Screen name="exams" options={{ title: "Exams" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
```

## Focus Mode

- Screens with `headerShown: false` for exam/practice (fullscreen immersion)
- Configured in `app/(app)/_layout.tsx`:
  ```tsx
  <Stack.Screen name="exam/[id]" options={{ headerShown: false, gestureEnabled: false }} />
  <Stack.Screen name="session/[id]" options={{ gestureEnabled: false }} />
  ```

## Route Guards

- Auth guard: `useSegments()` + `useRouter()` in `_layout.tsx`
- Profile guard: redirect to onboarding if `!profile`
- Do NOT navigate in render body — use `useEffect`

## Safe Area

- Always use `useSafeAreaInsets()` for top/bottom padding
- ScrollView: `contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}`
- Fixed bottom elements: `paddingBottom: insets.bottom + spacing.lg`

## Navigation Patterns

- `router.push()` — navigate forward (stack push)
- `router.replace()` — replace current screen (no back)
- `router.back()` — go back
- `router.dismiss()` — dismiss modal
- Hidden routes: `options={{ href: null }}`

## Gesture Control

- Disable swipe back for exam screens: `gestureEnabled: false`
- Enable for practice screens: `gestureEnabled: true`
- Modal screens: `presentation: "modal"` + `gestureEnabled: false` for onboarding
