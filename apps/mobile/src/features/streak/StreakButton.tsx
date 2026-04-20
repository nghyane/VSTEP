// StreakButton — fire icon + streak count, opens StreakDialog
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon } from "@/components/GameIcon";
import { useStreak } from "@/features/streak/queries";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

export function StreakButton() {
  const c = useThemeColors();
  const [visible, setVisible] = useState(false);
  const { data: streak } = useStreak();
  const count = streak?.current_streak ?? 0;
  const isActive = count > 0;

  return (
    <>
      <HapticTouchable style={[styles.btn, { backgroundColor: isActive ? c.streakTint : c.background }]} onPress={() => setVisible(true)}>
        <GameIcon name="fire" size={18} />
        <Text style={[styles.btnText, { color: isActive ? c.streak : c.subtle }]}>{count}</Text>
      </HapticTouchable>
      <StreakDialog visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}

function StreakDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const c = useThemeColors();
  const { data: streak } = useStreak();
  const count = streak?.current_streak ?? 0;
  const todayCount = streak?.today_sessions ?? 0;
  const dailyGoal = streak?.daily_goal ?? 3;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <View style={[styles.header, { backgroundColor: c.streakTint }]}>
          <View style={styles.headerRow}>
            <GameIcon name="fire" size={32} />
            <Text style={[styles.streakNum, { color: c.streak }]}>{count} ngày streak</Text>
          </View>
          <Text style={[styles.headerSub, { color: c.subtle }]}>
            {count > 0 ? "Tiếp tục học mỗi ngày nhé!" : "Bắt đầu chuỗi học ngay hôm nay!"}
          </Text>
        </View>

        <View style={[styles.progressRow, { backgroundColor: c.background }]}>
          <Text style={[styles.progressLabel, { color: c.foreground }]}>Hôm nay</Text>
          <Text style={[styles.progressValue, { color: todayCount >= dailyGoal ? c.success : c.primary }]}>
            {todayCount}/{dailyGoal} bài luyện tập
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: c.background }]}>
            <Text style={[styles.statValue, { color: c.streak }]}>{count}</Text>
            <Text style={[styles.statLabel, { color: c.subtle }]}>Hiện tại</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.background }]}>
            <Text style={[styles.statValue, { color: c.foreground }]}>{streak?.longest_streak ?? 0}</Text>
            <Text style={[styles.statLabel, { color: c.subtle }]}>Dài nhất</Text>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  btnText: { fontSize: 13, fontFamily: fontFamily.bold },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing["2xl"] },
  header: { padding: spacing.lg, marginHorizontal: -spacing.xl, marginTop: -6 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  streakNum: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  headerSub: { fontSize: fontSize.sm, marginTop: 4 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.base },
  progressLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  progressValue: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  statsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.base },
  statCard: { flex: 1, alignItems: "center", padding: spacing.md, borderRadius: radius.lg },
  statValue: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  statLabel: { fontSize: fontSize.xs, marginTop: 2 },
});
