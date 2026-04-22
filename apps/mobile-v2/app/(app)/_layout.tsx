import { Stack } from "expo-router";
import { useThemeColors, fontFamily } from "@/theme";

export default function AppLayout() {
  const c = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.foreground,
        headerTitleStyle: { fontFamily: fontFamily.semiBold },
        contentStyle: { backgroundColor: c.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ presentation: "modal", gestureEnabled: false }} />
      <Stack.Screen name="exam/[id]" />
      <Stack.Screen name="session/[id]" />
      <Stack.Screen name="exam-result/[id]" />
      <Stack.Screen name="skill/[name]" options={{ headerShown: true, title: "Chi tiết kỹ năng" }} />
      <Stack.Screen name="submissions/index" />
      <Stack.Screen name="submissions/[id]" options={{ headerShown: true, title: "Chi tiết bài nộp" }} />
      <Stack.Screen name="practice/index" />
      <Stack.Screen name="practice/foundation/index" />
      <Stack.Screen name="practice/grammar/index" />
      <Stack.Screen name="practice/skills" />
      <Stack.Screen name="practice/[skill]" />
      <Stack.Screen name="practice/result/[id]" />
      <Stack.Screen name="vocabulary/index" />
      <Stack.Screen name="vocabulary/[id]" />
      <Stack.Screen name="account" options={{ headerShown: true, title: "Tài khoản" }} />
      <Stack.Screen name="goal" options={{ headerShown: true, title: "Mục tiêu học tập" }} />
    </Stack>
  );
}
