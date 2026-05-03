import { StyleSheet, Text, View } from "react-native";

import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { HapticTouchable } from "@/components/HapticTouchable";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";
import type { Course, EnrollmentDetail } from "@/features/course/types";
import { formatDate, formatNumber, formatVnd } from "@/lib/utils";

interface CourseCardProps {
  course: Course;
  enrolled: boolean;
  enrollment?: EnrollmentDetail | null;
  onPress: () => void;
}

export function CourseCard({ course, enrolled, enrollment, onPress }: CourseCardProps) {
  const c = useThemeColors();
  const sold = course.soldSlots;
  const remaining = sold === undefined ? null : Math.max(0, course.maxSlots - sold);
  const commitment = enrollment?.commitment ?? null;

  return (
    <HapticTouchable onPress={onPress} activeOpacity={0.85}>
      <DepthCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={[styles.title, { color: c.foreground }]} numberOfLines={2}>
            {course.title}
          </Text>
          {enrolled && (
            <View style={[styles.enrolledBadge, { backgroundColor: c.primaryTint }]}>
              <Text style={[styles.enrolledText, { color: c.primaryDark }]}>Đã đăng ký</Text>
            </View>
          )}
          {!enrolled && remaining !== null && (
            <View style={[styles.enrolledBadge, { backgroundColor: remaining <= 5 ? c.warningTint : c.infoTint }]}>
              <Text style={[styles.enrolledText, { color: remaining <= 5 ? c.warning : c.info }]}>
                {remaining === 0 ? "Đã đầy" : `Còn ${remaining} chỗ`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <GameIcon name="target" size={16} />
            <Text style={[styles.metaText, { color: c.mutedForeground }]}>{course.targetLevel}</Text>
          </View>
          <View style={styles.metaItem}>
            <GameIcon name="calendar" size={16} />
            <Text style={[styles.metaText, { color: c.mutedForeground }]}>
              {formatDate(course.startDate)} · {course.scheduleItemsCount ?? 0} buổi
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {course.teacher && (
            <View style={styles.metaItem}>
              <GameIcon name="graduation" size={16} />
              <Text style={[styles.metaText, { color: c.mutedForeground }]} numberOfLines={1}>
                {course.teacher.fullName}
              </Text>
            </View>
          )}
          {sold !== undefined && (
            <View style={styles.metaItem}>
              <GameIcon name="users" size={16} />
              <Text style={[styles.metaText, { color: c.mutedForeground }]}>
                {sold}/{course.maxSlots} học viên
              </Text>
            </View>
          )}
        </View>

        {enrolled && enrollment?.nextSession && (
          <View style={[styles.nextBox, { backgroundColor: c.primaryTint, borderColor: c.primary + "40" }]}>
            <Text style={[styles.nextLabel, { color: c.primaryDark }]}>Buổi tiếp theo</Text>
            <Text style={[styles.nextText, { color: c.foreground }]} numberOfLines={1}>
              {formatDate(enrollment.nextSession.date)} · {enrollment.nextSession.startTime} - {enrollment.nextSession.endTime}
            </Text>
            <Text style={[styles.nextTopic, { color: c.mutedForeground }]} numberOfLines={1}>
              {enrollment.nextSession.topic}
            </Text>
          </View>
        )}

        {enrolled && commitment && commitment.phase !== "not_enrolled" && (
          <Text style={[styles.commitmentText, { color: commitment.phase === "met" ? c.success : c.warning }]}>
            Cam kết: {commitment.completed}/{commitment.required} bài thi
          </Text>
        )}

        {course.description && (
          <Text style={[styles.desc, { color: c.subtle }]} numberOfLines={2}>
            {course.description}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={[styles.price, { color: c.foreground }]}>
            {formatVnd(course.priceVnd)}
          </Text>
          {course.originalPriceVnd && course.originalPriceVnd > course.priceVnd && (
            <Text style={[styles.originalPrice, { color: c.subtle }]}>
              {formatVnd(course.originalPriceVnd)}
            </Text>
          )}
          {course.bonusCoins > 0 && (
            <View style={[styles.bonusBadge, { backgroundColor: c.coinTint }]}>
              <Text style={[styles.bonusText, { color: c.coinDark }]}>
                +{formatNumber(course.bonusCoins)} xu
              </Text>
            </View>
          )}
        </View>
      </DepthCard>
    </HapticTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.base,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.bold,
    flex: 1,
  },
  enrolledBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.md,
  },
  enrolledText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
  },
  desc: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  nextBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: 2,
  },
  nextLabel: {
    fontSize: 10,
    fontFamily: fontFamily.extraBold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  nextText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.extraBold,
  },
  nextTopic: {
    fontSize: fontSize.xs,
  },
  commitmentText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  price: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.extraBold,
  },
  originalPrice: {
    fontSize: fontSize.xs,
    textDecorationLine: "line-through",
  },
  bonusBadge: {
    marginLeft: "auto",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.md,
  },
  bonusText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
  },
});
