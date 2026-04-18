// Course list screen — Khóa học cấp tốc
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DepthCard } from "@/components/DepthCard";
import { DepthButton } from "@/components/DepthButton";
import { GameIcon } from "@/components/GameIcon";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  type Course, MOCK_COURSES, discountPercent, formatVnd,
  isCourseFull, isCourseEnded, enrollInCourse, isEnrolled, useEnrollments,
} from "@/features/course/course-store";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";

export default function CoursesScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const enrollments = useEnrollments();
  const myCourses = MOCK_COURSES.filter((co) => enrollments.some((e) => e.courseId === co.id));
  const exploreCourses = MOCK_COURSES.filter((co) => !enrollments.some((e) => e.courseId === co.id));

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title="Khóa học cấp tốc" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        {myCourses.length > 0 && (
          <>
            <Text style={[styles.section, { color: c.foreground }]}>Khóa của tôi</Text>
            {myCourses.map((co) => <MyCourseCard key={co.id} course={co} />)}
          </>
        )}

        <Text style={[styles.section, { color: c.foreground }]}>Đang tuyển sinh</Text>
        {exploreCourses.length === 0 && <Text style={[styles.empty, { color: c.mutedForeground }]}>Không có khóa nào đang mở.</Text>}
        {exploreCourses.map((co) => <CourseCard key={co.id} course={co} />)}
      </ScrollView>
    </View>
  );
}

function CourseCard({ course }: { course: Course }) {
  const c = useThemeColors();
  const disc = discountPercent(course);
  const full = isCourseFull(course);
  const ended = isCourseEnded(course);

  function handleEnroll() {
    Alert.alert("Xác nhận đăng ký", `${course.title}\nGiá: ${formatVnd(course.priceVnd)}\nBạn sẽ nhận ${course.bonusCoins} xu bonus.`, [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng ký", onPress: () => enrollInCourse(course) },
    ]);
  }

  return (
    <DepthCard style={styles.card}>
      {/* Level badge */}
      <View style={[styles.levelBadge, { backgroundColor: c.primary + "15" }]}>
        <Text style={[styles.levelText, { color: c.primary }]}>{course.level}</Text>
      </View>

      <Text style={[styles.cardTitle, { color: c.foreground }]}>{course.title}</Text>
      <Text style={[styles.cardTarget, { color: c.mutedForeground }]}>{course.targetExam}</Text>
      <Text style={[styles.cardDesc, { color: c.mutedForeground }]}>{course.description}</Text>

      {/* Highlights */}
      {course.highlights.map((h) => (
        <View key={h} style={styles.hlRow}>
          <Ionicons name="checkmark-circle" size={14} color={c.success} />
          <Text style={[styles.hlText, { color: c.foreground }]}>{h}</Text>
        </View>
      ))}

      {/* Instructor */}
      <View style={styles.instrRow}>
        <GameIcon name="graduation" size={20} />
        <View>
          <Text style={[styles.instrName, { color: c.foreground }]}>{course.instructorName}</Text>
          <Text style={[styles.instrTitle, { color: c.mutedForeground }]}>{course.instructorTitle}</Text>
        </View>
      </View>

      {/* Price + slots */}
      <View style={[styles.priceRow, { borderTopColor: c.border }]}>
        <View>
          <View style={styles.priceInline}>
            <Text style={[styles.price, { color: c.destructive }]}>{formatVnd(course.priceVnd)}</Text>
            {disc > 0 && <Text style={[styles.origPrice, { color: c.mutedForeground }]}>{formatVnd(course.originalPriceVnd)}</Text>}
          </View>
          {disc > 0 && <Text style={[styles.discount, { color: c.success }]}>Giảm {disc}%</Text>}
          <View style={styles.bonusRow}>
            <GameIcon name="coin" size={14} />
            <Text style={[styles.bonusText, { color: c.coinDark }]}>+{course.bonusCoins} xu</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.slots, { color: full ? c.destructive : c.mutedForeground }]}>
            {full ? "Hết chỗ" : `Còn ${course.maxSlots - course.soldSlots}/${course.maxSlots} chỗ`}
          </Text>
          {!full && !ended && <DepthButton variant="primary" size="sm" onPress={handleEnroll}>Đăng ký</DepthButton>}
          {ended && <Text style={[styles.endedBadge, { color: c.mutedForeground }]}>Đã kết thúc</Text>}
        </View>
      </View>
    </DepthCard>
  );
}

function MyCourseCard({ course }: { course: Course }) {
  const c = useThemeColors();
  const ended = isCourseEnded(course);

  return (
    <DepthCard variant={ended ? "neutral" : "primary"} style={styles.card}>
      <View style={styles.myHeader}>
        <Text style={[styles.cardTitle, { color: c.foreground, flex: 1 }]}>{course.title}</Text>
        {ended ? (
          <View style={[styles.statusBadge, { backgroundColor: c.muted }]}><Text style={[styles.statusText, { color: c.mutedForeground }]}>Đã kết thúc</Text></View>
        ) : (
          <View style={[styles.statusBadge, { backgroundColor: c.success + "15" }]}><Text style={[styles.statusText, { color: c.success }]}>Đang học</Text></View>
        )}
      </View>
      <Text style={[styles.cardTarget, { color: c.mutedForeground }]}>{course.targetExam}</Text>

      {/* Schedule preview */}
      <Text style={[styles.schedLabel, { color: c.foreground }]}>Lịch học</Text>
      {course.sessions.slice(0, 3).map((s) => (
        <View key={s.id} style={styles.schedRow}>
          <Text style={[styles.schedNum, { color: c.primary }]}>Buổi {s.sessionNumber}</Text>
          <Text style={[styles.schedDate, { color: c.mutedForeground }]}>{s.date} · {s.startTime}–{s.endTime}</Text>
          <Text style={[styles.schedTopic, { color: c.foreground }]}>{s.topic}</Text>
        </View>
      ))}
      {course.sessions.length > 3 && <Text style={[styles.schedMore, { color: c.primary }]}>+{course.sessions.length - 3} buổi nữa</Text>}

      {/* Zoom link */}
      {!ended && (
        <View style={[styles.zoomRow, { backgroundColor: c.primary + "0D" }]}>
          <Ionicons name="videocam" size={16} color={c.primary} />
          <Text style={[styles.zoomText, { color: c.primary }]} numberOfLines={1}>{course.livestreamUrl}</Text>
        </View>
      )}
    </DepthCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: spacing.xl },
  section: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, marginTop: spacing.lg, marginBottom: spacing.sm },
  empty: { fontSize: fontSize.sm, textAlign: "center", paddingVertical: spacing["2xl"] },
  card: { marginBottom: spacing.base },
  levelBadge: { alignSelf: "flex-start", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  levelText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  cardTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, marginTop: spacing.xs },
  cardTarget: { fontSize: fontSize.xs, marginTop: 2 },
  cardDesc: { fontSize: fontSize.sm, lineHeight: 20, marginTop: spacing.sm },
  hlRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  hlText: { fontSize: fontSize.xs, flex: 1 },
  instrRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  instrName: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  instrTitle: { fontSize: fontSize.xs },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 1, paddingTop: spacing.md, marginTop: spacing.md },
  priceInline: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  price: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  origPrice: { fontSize: fontSize.sm, textDecorationLine: "line-through" },
  discount: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  bonusRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  bonusText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  slots: { fontSize: fontSize.xs, marginBottom: spacing.xs },
  endedBadge: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  // My course
  myHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  statusText: { fontSize: 10, fontFamily: fontFamily.bold },
  schedLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold, marginTop: spacing.md },
  schedRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  schedNum: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, width: 50 },
  schedDate: { fontSize: fontSize.xs, flex: 1 },
  schedTopic: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  schedMore: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, marginTop: spacing.xs },
  zoomRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.md },
  zoomText: { fontSize: fontSize.xs, flex: 1 },
});
