import { StyleSheet, Text, View } from "react-native";

import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { HapticTouchable } from "@/components/HapticTouchable";
import { fontSize, fontFamily, radius, spacing, useThemeColors } from "@/theme";
import type { Course } from "@/features/course/types";

interface CourseCardProps {
  course: Course;
  enrolled: boolean;
  onPress: () => void;
}

export function CourseCard({ course, enrolled, onPress }: CourseCardProps) {
  const c = useThemeColors();

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
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <GameIcon name="target" size={16} />
            <Text style={[styles.metaText, { color: c.mutedForeground }]}>{course.targetLevel}</Text>
          </View>
          <View style={styles.metaItem}>
            <GameIcon name="calendar" size={16} />
            <Text style={[styles.metaText, { color: c.mutedForeground }]}>
              {formatDate(course.startDate)}
            </Text>
          </View>
        </View>

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
                +{course.bonusCoins} xu
              </Text>
            </View>
          )}
        </View>
      </DepthCard>
    </HapticTouchable>
  );
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
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
