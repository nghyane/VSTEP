import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { CourseCard } from "@/features/course/CourseCard";
import { useCourses } from "@/features/course/queries";
import { useThemeColors, spacing, fontSize, fontFamily, radius } from "@/theme";

type Tab = "explore" | "mine";

export function ClassesContent() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("explore");
  const { data, isLoading } = useCourses();

  const courses = data?.data ?? [];
  const enrolledIds = new Set(data?.enrolledCourseIds ?? []);
  const enrollments = data?.enrollments ?? {};
  const mineList = courses.filter((course) => enrolledIds.has(course.id));
  const exploreList = courses.filter((course) => !enrolledIds.has(course.id));
  const list = tab === "mine" ? mineList : exploreList;

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.base }]}>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Khóa học</Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.desc, { color: c.mutedForeground }]}>Học cùng giáo viên chấm thi VSTEP — ôn trúng đề sát ngày thi.</Text>
        <BookingHint hasCourses={mineList.length > 0} />
        <View style={[styles.tabs, { borderBottomColor: c.border }]}>
          <TabButton label="Khám phá" active={tab === "explore"} onPress={() => setTab("explore")} />
          <TabButton label="Của tôi" active={tab === "mine"} onPress={() => setTab("mine")} />
        </View>

        {isLoading ? (
          <CenterMessage title="Đang tải..." />
        ) : list.length === 0 ? (
          <EmptyState tab={tab} onExplore={() => setTab("explore")} />
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing["3xl"] }}
            renderItem={({ item }) => (
              <CourseCard
                course={item}
                enrolled={enrolledIds.has(item.id)}
                enrollment={enrollments[item.id] ?? null}
                onPress={() => router.push(`/(app)/courses/${item.id}` as never)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

function BookingHint({ hasCourses }: { hasCourses: boolean }) {
  const c = useThemeColors();
  return (
    <View style={[styles.bookingHint, { backgroundColor: hasCourses ? c.primaryTint : c.warningTint, borderColor: hasCourses ? c.primary : c.warning }]}>
      <Text style={[styles.bookingHintTitle, { color: hasCourses ? c.primaryDark : c.warning }]}>Đặt lịch 1-1</Text>
      <Text style={[styles.bookingHintText, { color: c.mutedForeground }]}>
        {hasCourses ? "Chọn khóa của bạn để đặt buổi học riêng với giảng viên." : "Đăng ký một khóa học để mở khóa buổi học riêng 30 phút."}
      </Text>
    </View>
  );
}

function EmptyState({ tab, onExplore }: { tab: Tab; onExplore: () => void }) {
  return (
    <CenterMessage title={tab === "mine" ? "Chưa có khóa học nào" : "Chưa có khóa nào đang mở"} onExplore={tab === "mine" ? onExplore : undefined} />
  );
}

function CenterMessage({ title, onExplore }: { title: string; onExplore?: () => void }) {
  const c = useThemeColors();
  return (
    <View style={styles.center}>
      <Text style={[styles.centerTitle, { color: c.foreground }]}>{title}</Text>
      {onExplore && (
        <Pressable onPress={onExplore}>
          <Text style={[styles.discoverText, { color: c.primary }]}>Khám phá khóa học →</Text>
        </Pressable>
      )}
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <Pressable onPress={onPress} style={styles.tabBtn}>
      <View style={[styles.tabIndicator, active && { borderBottomColor: c.primary }]}>
        <Text style={[styles.tabText, { color: active ? c.foreground : c.subtle }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.base },
  headerTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  body: { flex: 1, paddingHorizontal: spacing.xl },
  desc: { fontSize: fontSize.sm, marginBottom: spacing.md },
  bookingHint: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, gap: spacing.xs },
  bookingHintTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold },
  bookingHintText: { fontSize: fontSize.xs, lineHeight: 18 },
  tabs: { flexDirection: "row", borderBottomWidth: 2, marginBottom: spacing.base },
  tabBtn: { paddingBottom: spacing.sm, paddingHorizontal: spacing.md },
  tabIndicator: { paddingBottom: spacing.xs, borderBottomWidth: 2 },
  tabText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  discoverText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing["3xl"] },
  centerTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
});
