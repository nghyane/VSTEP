import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GameIcon } from "@/components/GameIcon";
import { DepthButton } from "@/components/DepthButton";
import {
  useDailyGoal,
  useStreakMilestones,
  useTodayProgress,
  claimMilestone,
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
      <HapticTouchable
        style={[styles.btn, { backgroundColor: isActive ? c.streak + "15" : c.muted }]}
        onPress={() => setVisible(true)}
      >
        <View style={styles.iconWrap}>
          <GameIcon name="fire" size={18} />
        </View>
        <Text style={[styles.btnText, { color: isActive ? c.streak : c.mutedForeground }]}>
          {streak}
        </Text>
      </HapticTouchable>
      <StreakDialog
        visible={visible}
        onClose={() => setVisible(false)}
        streak={streak}
        activityByDay={activityByDay}
      />
    </>
  );
}

function StreakDialog({
  visible,
  onClose,
  streak,
  activityByDay,
}: {
  visible: boolean;
  onClose: () => void;
  streak: number;
  activityByDay: Record<string, number>;
}) {
  const c = useThemeColors();
  const todayCount = useTodayProgress();
  const dailyGoal = useDailyGoal();
  const milestones = useStreakMilestones();
  const weekDays = buildCurrentWeek(activityByDay);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <View style={[styles.header, { backgroundColor: c.streak + "12" }]}>
          <View style={styles.headerRow}>
            <GameIcon name="fire" size={36} />
            <Text style={[styles.streakNum, { color: c.streak }]}>{streak} ngay streak</Text>
          </View>
          <Text style={[styles.headerSub, { color: c.mutedForeground }]}>
            {streak > 0 ? "Tiep tuc hoc moi ngay nhe!" : "Bat dau chuoi hoc ngay hom nay!"}
          </Text>
        </View>

        <View style={styles.weekRow}>
          {weekDays.map((day) => (
            <View key={day.label} style={styles.weekDay}>
              <Text style={[styles.weekLabel, { color: c.mutedForeground }]}>{day.label}</Text>
              <View
                style={[
                  styles.weekCircle,
                  day.active
                    ? { borderColor: c.streak, backgroundColor: c.streak + "1A" }
                    : { backgroundColor: c.muted },
                  day.isToday && !day.active && { borderColor: c.streak + "66", borderWidth: 2 },
                  day.isFuture && { opacity: 0.4 },
                ]}
              >
                {day.active && <Ionicons name="checkmark" size={16} color={c.streak} />}
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.progressRow, { backgroundColor: c.muted }]}>
          <Text style={[styles.progressLabel, { color: c.foreground }]}>Hom nay</Text>
          <Text
            style={[
              styles.progressValue,
              { color: todayCount >= dailyGoal ? c.success : c.primary },
            ]}
          >
            {todayCount}/{dailyGoal} bai tap
          </Text>
        </View>

        <View style={styles.milestones}>
          {milestones.map((m) => {
            const unlocked = streak >= m.days;
            const isClaimed = m.claimed;
            return (
              <View key={m.days} style={[styles.milestone, { borderColor: unlocked ? c.coin : c.border }]}>
                <GameIcon name={unlocked ? "trophy" : "lock"} size={24} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.msTitle, { color: c.foreground }]}>{m.days} ngay</Text>
                  <Text style={[styles.msReward, { color: c.coin }]}>+{m.coins} xu</Text>
                </View>
                {unlocked && !isClaimed && (
                  <DepthButton
                    variant="coin"
                    size="sm"
                    onPress={() => {
                      void claimMilestone(m.days);
                    }}
                  >
                    Nhan
                  </DepthButton>
                )}
                {isClaimed && <Ionicons name="checkmark-circle" size={24} color={c.success} />}
                {!unlocked && (
                  <Text style={[styles.msLocked, { color: c.mutedForeground }]}>
                    {m.days - streak} ngay nua
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
}

interface WeekDay {
  label: string;
  active: boolean;
  isToday: boolean;
  isFuture: boolean;
}

function buildCurrentWeek(activityByDay: Record<string, number>): WeekDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const monOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + monOffset);
  const labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      label,
      active: (activityByDay[key] ?? 0) > 0,
      isToday: d.getTime() === today.getTime(),
      isFuture: d.getTime() > today.getTime(),
    };
  });
}

const styles = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  btnText: { fontSize: 13, fontFamily: fontFamily.bold, lineHeight: 18 },
  iconWrap: { width: 18, height: 18, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing["2xl"] },
  header: { padding: spacing.lg, marginHorizontal: -spacing.xl, marginTop: -6, marginBottom: spacing.lg },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  streakNum: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  headerSub: { fontSize: fontSize.sm, marginTop: 4 },
  weekRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.base },
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
