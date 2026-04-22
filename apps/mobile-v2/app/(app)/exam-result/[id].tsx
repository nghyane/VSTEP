import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { LessonComplete } from "@/components/MascotStates";
import { useThemeColors } from "@/theme";

export default function ExamResultScreen() {
  const c = useThemeColors();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}> 
      <LessonComplete
        score={68}
        total={100}
        durationSeconds={3580}
        onNext={() => router.replace("/(app)/(tabs)/exams" as any)}
        onReview={() => router.back()}
        nextLabel="Quay về thi thử"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center" },
});
