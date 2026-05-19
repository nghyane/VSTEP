import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { CourseBookingContent } from "@/features/course/CourseBookingContent";
import { fontFamily, fontSize, spacing, useThemeColors } from "@/theme";

export default function CourseBookingScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();

  if (!courseId) return <ErrorState />;
  return <CourseBookingContent courseId={courseId} />;
}

function ErrorState() {
  const c = useThemeColors();
  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <Text style={[styles.text, { color: c.subtle }]}>Không tìm thấy khóa học</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  text: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, textAlign: "center" },
});
