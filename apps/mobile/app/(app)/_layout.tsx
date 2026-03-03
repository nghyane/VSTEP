import { Stack } from "expo-router";
import { useThemeColors } from "@/theme";

export default function AppLayout() {
  const c = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: c.card },
        headerTintColor: c.foreground,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ presentation: "modal", gestureEnabled: false, headerShown: false }} />
      <Stack.Screen
        name="exam/[id]"
        options={{ headerShown: true, title: "Chi tiết đề thi" }}
      />
      <Stack.Screen
        name="session/[id]"
        options={{ headerShown: true, title: "Phiên thi" }}
      />
      <Stack.Screen
        name="skill/[name]"
        options={{ headerShown: true, title: "Chi tiết kỹ năng" }}
      />
      <Stack.Screen
        name="submissions/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="submissions/[id]"
        options={{ headerShown: true, title: "Chi tiết bài nộp" }}
      />
      <Stack.Screen
        name="practice/index"
        options={{ headerShown: true, title: "Luyện tập" }}
      />
      <Stack.Screen
        name="practice/[skill]"
        options={{ headerShown: true, title: "Làm bài" }}
      />
      <Stack.Screen
        name="practice/result/[id]"
        options={{ headerShown: true, title: "Kết quả" }}
      />
      <Stack.Screen
        name="classes/index"
        options={{ headerShown: true, title: "Lớp học" }}
      />
      <Stack.Screen
        name="classes/[id]"
        options={{ headerShown: true, title: "Chi tiết lớp" }}
      />
    </Stack>
  );
}
