import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { LessonComplete } from "@/components/MascotStates";
import { useThemeColors } from "@/theme";

export default function PracticeResultScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const isObjective = id === "listening" || id === "reading";

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}> 
      <LessonComplete
        score={isObjective ? 7 : 0}
        total={isObjective ? 10 : 1}
        durationSeconds={780}
        onNext={() => router.replace("/(app)/(tabs)/practice" as any)}
        onReview={() => router.back()}
        nextLabel={isObjective ? "Quay về luyện tập" : "Theo dõi trạng thái chấm"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center" },
});
