import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { CourseCard } from "@/features/course/CourseCard";
import { useCourses } from "@/features/course/queries";
import { useThemeColors, spacing, fontSize, fontFamily } from "@/theme";

type Tab = "explore" | "mine";

export default function ClassesScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("explore");
  const { data, isLoading } = useCourses();

  const courses = data?.data ?? [];
  const enrolledIds = new Set(data?.enrolledCourseIds ?? []);
  const list = tab === "mine" ? courses.filter((c) => enrolledIds.has(c.id)) : courses;

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.base }]}>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Khóa học</Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.desc, { color: c.mutedForeground }]}>
          Học cùng giáo viên chấm thi VSTEP — ôn trúng đề sát ngày thi.
        </Text>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: c.border }]}>
          <TabButton label="Khám phá" active={tab === "explore"} onPress={() => setTab("explore")} />
          <TabButton label="Của tôi" active={tab === "mine"} onPress={() => setTab("mine")} />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <Text style={[styles.centerText, { color: c.subtle }]}>Đang tải...</Text>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.centerTitle, { color: c.foreground }]}>
              {tab === "mine" ? "Chưa có khóa học nào" : "Chưa có khóa nào đang mở"}
            </Text>
            {tab === "mine" && (
            <Pressable onPress={() => setTab("explore")}>
              <Text style={[styles.discoverText, { color: c.primary }]}>Khám phá khóa học →</Text>
            </Pressable>
            )}
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing["3xl"] }}
            renderItem={({ item }) => (
              <CourseCard
                course={item}
                enrolled={enrolledIds.has(item.id)}
                onPress={() => router.push(`/(app)/courses/${item.id}` as any)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const c = useThemeColors();

  return (
    <Pressable onPress={onPress} style={styles.tabBtn}>
      <View style={[styles.tabIndicator, active && { borderBottomColor: c.primary }]}>
        <Text style={[styles.tabText, { color: active ? c.foreground : c.subtle }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.base },
  headerTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  body: { paddingHorizontal: spacing.xl },
  desc: { fontSize: fontSize.sm, marginBottom: spacing.md },
  tabs: { flexDirection: "row", borderBottomWidth: 2, marginBottom: spacing.base },
  tabBtn: { paddingBottom: spacing.sm, paddingHorizontal: spacing.md },
  tabIndicator: { paddingBottom: spacing.xs, borderBottomWidth: 2 },
  tabText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  discoverText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing["3xl"] },
  centerText: { fontSize: fontSize.sm },
  centerTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.bold },
});
