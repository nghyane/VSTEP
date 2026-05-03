import { StyleSheet, Text, View } from "react-native";

import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import type { BookingTeacher } from "@/features/course/types";
import { getInitials } from "@/lib/utils";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

interface BookingTeacherCardProps {
  teacher: BookingTeacher;
  myBookingsCount: number;
}

export function BookingTeacherCard({ teacher, myBookingsCount }: BookingTeacherCardProps) {
  const c = useThemeColors();

  return (
    <DepthCard style={styles.card}>
      <Text style={[styles.eyebrow, { color: c.subtle }]}>Giáo viên 1-1</Text>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: c.primaryTint }]}>
          <Text style={[styles.avatarText, { color: c.primaryDark }]}>{getInitials(teacher.fullName)}</Text>
        </View>
        <View style={styles.body}>
          <Text style={[styles.name, { color: c.foreground }]}>{teacher.fullName}</Text>
          {teacher.title && <Text style={[styles.title, { color: c.mutedForeground }]}>{teacher.title}</Text>}
          <View style={styles.metaRow}>
            <GameIcon name="graduation" size={16} />
            <Text style={[styles.meta, { color: c.subtle }]}>Đã đặt {myBookingsCount} buổi</Text>
          </View>
        </View>
      </View>
      {teacher.bio && <Text style={[styles.bio, { color: c.mutedForeground }]}>{teacher.bio}</Text>}
    </DepthCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, marginBottom: spacing.base },
  eyebrow: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold, textTransform: "uppercase", letterSpacing: 0.8 },
  row: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  avatar: { width: 56, height: 56, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  body: { flex: 1, gap: spacing.xs },
  name: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold },
  title: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  meta: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  bio: { fontSize: fontSize.sm, lineHeight: 20 },
});
