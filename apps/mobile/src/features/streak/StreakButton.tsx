// StreakButton — fire icon + streak count, opens StreakDialog
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon } from "@/components/GameIcon";
import { DepthButton } from "@/components/DepthButton";
import {
  DAILY_GOAL, STREAK_MILESTONES,
  useClaimedMilestones, useTodayProgress, claimMilestone,
} from "@/features/streak/streak-store";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";

interface StreakButtonProps {
  streak: number;
  activityByDay?: Record<string, number>;
}

export function StreakButton({ streak, activityByDay = {} }: StreakButtonProps) {
  const c = useThemeColors();
  const [visible, setVisible] = useState(false);
  const isActive = streak > 0;

  return (
    <>
      <HapticTouchable style={[styles.btn, { backgroundColor: isActive ? c.skillSpeaking + "15" : c.muted }]} onPress={() => setVisible(true)}>
        <GameIcon name="fire" size={18} />
        <Text style={[styles.btnText, { color: isActive ? c.skillSpeaking : c.subtle }]}>{streak}</Text>
      </HapticTouchable>
      <StreakDialog visible={visible} onClose={() => setVisible(false)} streak={streak} activityByDay={activityByDay} />
    </>
  );
}

function StreakDialog({ visible, onClose, streak, activityByDay }: {
  visible: boolean; onClose: () => void; streak: number; activityByDay: Record<string, number>;
}) {
  const c = useThemeColors();
  const todayCount = useTodayProgress();
  const claimedSet = useClaimedMilestones();
  const weekDays = buildCurrentWeek(activityByDay);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: c.skillSpeaking + "15" }]}>
          <View style={styles.headerRow}>
            <GameIcon name="fire" size={32} />
            <Text style={[styles.streakNum, { color: c.skillSpeaking }]}>{streak} ngày streak</Text>
          </View>
          <Text style={[styles.headerSub, { color: c.subtle }]}>
            {streak > 0 ? "Tiếp tục học mỗi ngày nhé!" : "Bắt đầu chuỗi học ngay hôm nay!"}
          </Text>
        </View>

        {/* Week view */}
        <View style={styles.weekRow}>
          {weekDays.map((day) => (
            <View key={day.label} style={styles.weekDay}>
              <Text style={[styles.weekLabel, { color: c.subtle }]}>{day.label}</Text>
              <View style={[
                styles.weekCircle,
                day.active ? { borderColor: c.skillSpeaking, backgroundColor: c.skillSpeaking + "1A" } : { backgroundColor: c.background },
                day.isToday && !day.active && { borderColor: c.skillSpeaking + "66", borderWidth: 2 },
                day.isFuture && { opacity: 0.4 },
              ]}>
                {day.active && <Ionicons name="checkmark" size={16} color={c.skillSpeaking} />}
              </View>
            </View>
          ))}
        </View>

        {/* Today progress */}
        <View style={[styles.progressRow, { backgroundColor: c.background }]}>
          <Text style={[styles.progressLabel, { color: c.foreground }]}>Hôm nay</Text>
          <Text style={[styles.progressValue, { color: todayCount >= DAILY_GOAL ? c.success : c.primary }]}>
            {todayCount}/{DAILY_GOAL} đề thi
          </Text>
        </View>

        {/* Milestones */}
        <View style={styles.milestones}>
          {STREAK_MILESTONES.map((m) => {
            const unlocked = streak >= m.days;
            const isClaimed = claimedSet.has(m.days);
            return (
              <View key={m.days} style={[styles.milestone, { borderColor: unlocked ? c.coin : c.border }]}>
                <GameIcon name={unlocked ? "trophy" : "lock"} size={24} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.msTitle, { color: c.foreground }]}>{m.days} ngày</Text>
                  <Text style={[styles.msReward, { color: c.coin }]}>+{m.coins} xu</Text>
                </View>
                {unlocked && !isClaimed && (
                  <DepthButton variant="coin" size="sm" onPress={() => claimMilestone(m.days)}>Nhận</DepthButton>
                )}
                {isClaimed && <Ionicons name="checkmark-circle" size={24} color={c.success} />}
                {!unlocked && <Text style={[styles.msLocked, { color: c.subtle }]}>{m.days - streak} ngày nữa</Text>}
              </View>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
}

interface WeekDay { label: string; active: boolean; isToday: boolean; isFuture: boolean }

function buildCurrentWeek(activityByDay: Record<string, number>): WeekDay[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const monOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today); monday.setDate(today.getDate() + monOffset);
  const labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  return labels.map((label, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { label, active: (activityByDay[key] ?? 0) > 0, isToday: d.getTime() === today.getTime(), isFuture: d.getTime() > today.getTime() };
  });
}

const styles = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  btnText: { fontSize: 13, fontFamily: fontFamily.bold },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing["2xl"] },
  header: { padding: spacing.lg, marginHorizontal: -spacing.xl, marginTop: -6 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  streakNum: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  headerSub: { fontSize: fontSize.sm, marginTop: 4 },
  weekRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.lg },
  weekDay: { alignItems: "center", gap: 6 },
  weekLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  weekCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.base },
  progressLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  progressValue: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  milestones: { gap: spacing.sm, marginBottom: spacing.sm },
  milestone: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderRadius: radius.xl, padding: spacing.md },
  msTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  msReward: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  msLocked: { fontSize: fontSize.xs },
});
