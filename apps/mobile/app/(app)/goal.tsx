import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useProgress, useUpdateGoal, useCreateGoal } from "@/hooks/use-progress";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { VstepBand } from "@/types/api";

const BANDS: { value: VstepBand; score: string; desc: string }[] = [
  { value: "B1", score: "4.0 – 5.5", desc: "Giao tiếp cơ bản" },
  { value: "B2", score: "6.0 – 8.0", desc: "Chuẩn đầu ra phổ biến" },
  { value: "C1", score: "8.5 – 10", desc: "Thành thạo, linh hoạt" },
];

const DAILY_OPTIONS = [
  { value: 15, label: "15 phút", sub: "Ít nhưng đều đặn" },
  { value: 30, label: "30 phút", sub: "Phù hợp với đa số" },
  { value: 45, label: "45 phút", sub: "Tiến bộ nhanh hơn" },
  { value: 60, label: "60+ phút", sub: "Tập trung cao" },
];

const TIMELINE_OPTIONS = [
  { value: "3m", label: "3 tháng", months: 3 },
  { value: "6m", label: "6 tháng", months: 6 },
  { value: "1y", label: "1 năm", months: 12 },
  { value: "none", label: "Không giới hạn", months: 24 },
];

export default function GoalScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const progressQuery = useProgress();
  const updateGoal = useUpdateGoal();
  const createGoal = useCreateGoal();
  const existingGoal = progressQuery.data?.goal ?? null;
  const isMutating = updateGoal.isPending || createGoal.isPending;

  const [targetBand, setTargetBand] = useState<VstepBand>(existingGoal?.targetBand ?? "B2");
  const [dailyMinutes, setDailyMinutes] = useState(existingGoal?.dailyStudyTimeMinutes ?? 30);
  const [timeline, setTimeline] = useState("6m");

  if (progressQuery.isLoading) return <LoadingScreen />;

  function handleSave() {
    if (isMutating) return;

    const now = new Date();
    const opt = TIMELINE_OPTIONS.find((t) => t.value === timeline);
    now.setMonth(now.getMonth() + (opt?.months ?? 6));
    const deadline = now.toISOString();
    const payload = { targetBand, deadline, dailyStudyTimeMinutes: dailyMinutes };

    const onSuccess = async () => {
      await progressQuery.refetch();
      router.back();
    };

    if (existingGoal) {
      updateGoal.mutate({ id: existingGoal.id, ...payload }, { onSuccess });
    } else {
      createGoal.mutate(payload, { onSuccess });
    }
  }

  return (
    <ScreenWrapper noPadding>
      <BouncyScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Band */}
        <View style={styles.sectionGap}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Mục tiêu band điểm</Text>
          {BANDS.map((b) => {
            const selected = targetBand === b.value;
            return (
              <HapticTouchable
                key={b.value}
                activeOpacity={0.7}
                onPress={() => setTargetBand(b.value)}
                style={[styles.optionCard, { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primary + "08" : c.card }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: c.foreground }]}>{b.value} ({b.score})</Text>
                  <Text style={[styles.optionSub, { color: c.mutedForeground }]}>{b.desc}</Text>
                </View>
                {selected && <Ionicons name="checkmark-circle" size={22} color={c.primary} />}
              </HapticTouchable>
            );
          })}
        </View>

        {/* Daily minutes */}
        <View style={styles.sectionGap}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Thời gian học mỗi ngày</Text>
          {DAILY_OPTIONS.map((d) => {
            const selected = dailyMinutes === d.value;
            return (
              <HapticTouchable
                key={d.value}
                activeOpacity={0.7}
                onPress={() => setDailyMinutes(d.value)}
                style={[styles.optionCard, { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primary + "08" : c.card }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: c.foreground }]}>{d.label}</Text>
                  <Text style={[styles.optionSub, { color: c.mutedForeground }]}>{d.sub}</Text>
                </View>
                {selected && <Ionicons name="checkmark-circle" size={22} color={c.primary} />}
              </HapticTouchable>
            );
          })}
        </View>

        {/* Timeline */}
        <View style={styles.sectionGap}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Thời hạn đạt mục tiêu</Text>
          {TIMELINE_OPTIONS.map((t) => {
            const selected = timeline === t.value;
            return (
              <HapticTouchable
                key={t.value}
                activeOpacity={0.7}
                onPress={() => setTimeline(t.value)}
                style={[styles.optionCard, { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primary + "08" : c.card }]}
              >
                <Text style={[styles.optionTitle, { color: c.foreground, flex: 1 }]}>{t.label}</Text>
                {selected && <Ionicons name="checkmark-circle" size={22} color={c.primary} />}
              </HapticTouchable>
            );
          })}
        </View>

        {/* Status messages */}
        {updateGoal.isSuccess && <Text style={{ color: c.success, fontSize: fontSize.sm, textAlign: "center" }}>Đã cập nhật mục tiêu</Text>}
        {createGoal.isSuccess && <Text style={{ color: c.success, fontSize: fontSize.sm, textAlign: "center" }}>Đã tạo mục tiêu</Text>}
        {(updateGoal.isError || createGoal.isError) && (
          <Text style={{ color: c.destructive, fontSize: fontSize.sm, textAlign: "center" }}>
            {(updateGoal.error ?? createGoal.error)?.message}
          </Text>
        )}
      </BouncyScrollView>

      {/* Fixed save button at bottom */}
      <View style={[styles.bottomBar, { borderTopColor: c.border, backgroundColor: c.background }]}>
        <HapticTouchable
          style={[styles.saveBtn, { backgroundColor: c.primary, opacity: isMutating ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={isMutating}
        >
          <Text style={{ color: c.primaryForeground, fontWeight: "600", fontSize: fontSize.base }}>
            {isMutating ? "Đang lưu..." : "Lưu mục tiêu"}
          </Text>
        </HapticTouchable>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xl, gap: spacing["2xl"] },
  sectionGap: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: "700", marginBottom: spacing.xs },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
  },
  optionTitle: { fontSize: fontSize.base, fontWeight: "600" },
  optionSub: { fontSize: fontSize.sm, marginTop: 2 },
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  saveBtn: { borderRadius: radius.lg, paddingVertical: spacing.base, alignItems: "center" },
});
