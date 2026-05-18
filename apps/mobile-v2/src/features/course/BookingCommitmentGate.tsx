import { StyleSheet, Text, View } from "react-native";

import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import type { BookingCommitment } from "@/features/course/types";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

interface BookingCommitmentGateProps {
  commitment: BookingCommitment;
}

export function BookingCommitmentGate({ commitment }: BookingCommitmentGateProps) {
  const c = useThemeColors();
  const met = commitment.phase === "met";
  const remaining = Math.max(0, commitment.required - commitment.completed);
  const progress = commitment.required > 0 ? commitment.completed / commitment.required : 0;

  return (
    <DepthCard variant={met ? "success" : "skill"} skillColor={c.warning} style={styles.card}>
      <View style={styles.header}>
        <GameIcon name={met ? "check" : "lock"} size={28} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: met ? c.primaryDark : c.warning }]}>Cam kết đầu vào</Text>
          <Text style={[styles.desc, { color: c.mutedForeground }]}>
            {met ? "Bạn đã mở khóa đặt lịch 1-1." : `Hoàn thành thêm ${remaining} đề thi để mở khóa.`}
          </Text>
        </View>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: c.border }]}>
        <View style={[styles.progressFill, { backgroundColor: met ? c.success : c.warning, flex: progress }]} />
        <View style={{ flex: Math.max(0, 1 - progress) }} />
      </View>
      <Text style={[styles.count, { color: c.foreground }]}>Đã hoàn thành {commitment.completed}/{commitment.required} đề</Text>
    </DepthCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, marginBottom: spacing.base },
  header: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  headerText: { flex: 1, gap: spacing.xs },
  title: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  desc: { fontSize: fontSize.sm, lineHeight: 20 },
  progressTrack: { height: 12, borderRadius: radius.full, flexDirection: "row", overflow: "hidden" },
  progressFill: { borderRadius: radius.full },
  count: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
