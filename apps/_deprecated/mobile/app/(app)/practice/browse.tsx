import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { BouncyFlatList } from "@/components/BouncyScrollView";
import { HapticTouchable } from "@/components/HapticTouchable";
import { SkillIcon, SKILL_LABELS } from "@/components/SkillIcon";
import { MascotEmpty } from "@/components/MascotStates";
import { useListeningExercises, useReadingExercises } from "@/features/practice/queries";
import { useThemeColors, useSkillColor, spacing, radius, fontSize } from "@/theme";
import type { Skill } from "@/types/api";
import type { ListeningExercise, ReadingExercise } from "@/features/practice/types";

const MCQ_SKILLS: Skill[] = ["listening", "reading"];

export default function BrowseScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const [skill, setSkill] = useState<"listening" | "reading">("listening");

  const { data: listening, isLoading: loadingL } = useListeningExercises();
  const { data: reading, isLoading: loadingR } = useReadingExercises();

  const exercises = skill === "listening" ? (listening ?? []) : (reading ?? []);
  const isLoading = skill === "listening" ? loadingL : loadingR;

  return (
    <ScreenWrapper noPadding>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.foreground }]}>Chọn bài tập</Text>
        <View style={styles.tabs}>
          {MCQ_SKILLS.map((s) => (
            <HapticTouchable
              key={s}
              style={[styles.tab, skill === s && { backgroundColor: c.primary + "18", borderColor: c.primary }]}
              onPress={() => setSkill(s as "listening" | "reading")}
            >
              <SkillIcon skill={s} size={14} />
              <Text style={[styles.tabText, { color: skill === s ? c.primary : c.mutedForeground }]}>
                {SKILL_LABELS[s]}
              </Text>
            </HapticTouchable>
          ))}
        </View>
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: spacing["2xl"] }} />}

      {!isLoading && exercises.length === 0 && (
        <MascotEmpty
          mascot={skill === "listening" ? "listen" : "read"}
          title="Chưa có bài tập"
          subtitle="Nội dung đang được cập nhật"
        />
      )}

      {!isLoading && exercises.length > 0 && (
        <BouncyFlatList
          data={exercises}
          keyExtractor={(item) => (item as ListeningExercise | ReadingExercise).id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const ex = item as ListeningExercise | ReadingExercise;
            return (
              <HapticTouchable
                style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
                onPress={() => router.push(`/(app)/practice/${skill}/${ex.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardRow}>
                  <View style={styles.partBadge}>
                    <Text style={[styles.partText, { color: c.primary }]}>Part {ex.part}</Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: c.foreground }]} numberOfLines={2}>
                    {ex.title}
                  </Text>
                </View>
                {ex.description && (
                  <Text style={[styles.cardDesc, { color: c.mutedForeground }]} numberOfLines={1}>
                    {ex.description}
                  </Text>
                )}
                {ex.estimatedMinutes && (
                  <Text style={[styles.cardMeta, { color: c.mutedForeground }]}>
                    ~{ex.estimatedMinutes} phút
                  </Text>
                )}
              </HapticTouchable>
            );
          }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.base, borderBottomWidth: 1 },
  title: { fontSize: fontSize.xl, fontWeight: "700", marginBottom: spacing.base },
  tabs: { flexDirection: "row", gap: spacing.sm },
  tab: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: "transparent" },
  tabText: { fontSize: fontSize.sm, fontWeight: "600" },
  list: { padding: spacing.xl, gap: spacing.sm },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.xs },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  partBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: "transparent" },
  partText: { fontSize: fontSize.xs, fontWeight: "700" },
  cardTitle: { flex: 1, fontSize: fontSize.sm, fontWeight: "600" },
  cardDesc: { fontSize: fontSize.xs },
  cardMeta: { fontSize: fontSize.xs },
});
