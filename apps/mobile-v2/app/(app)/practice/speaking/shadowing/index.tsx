// Shadowing lesson list — mirrors apps/frontend-v3/src/features/practice/components/SpeakingContent.tsx
// ShadowingSection. Each lesson card shows level + segment count + progress.
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthCard } from "@/components/DepthCard";
import { HapticTouchable } from "@/components/HapticTouchable";
import { LevelFilters, type Level } from "@/components/LevelFilters";
import { MascotEmpty } from "@/components/MascotStates";
import { StatusFilters, type StatusFilter } from "@/components/StatusFilters";
import { useShadowingLessons } from "@/features/shadowing/use-shadowing-lessons";
import { useShadowingProgress } from "@/features/shadowing/use-shadowing-progress";
import {
  fontFamily,
  fontSize,
  radius,
  spacing,
  useThemeColors,
} from "@/theme";

const COLOR = "#FFC800";

export default function ShadowingListScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: progress } = useShadowingProgress();
  const { data: allLessons, isLoading, isError } = useShadowingLessons();

  const [level, setLevel] = useState<Level | null>(null);
  const [status, setStatus] = useState<StatusFilter>("Tất cả");

  // Apply level + status filters using persisted progress data.
  const lessons = useMemo(() => {
    if (!allLessons) return [];
    return allLessons.filter((lesson) => {
      if (level && lesson.level.toUpperCase() !== level) return false;
      if (status === "Tất cả") return true;
      const doneCount = new Set(
        (progress?.[lesson.id] ?? []).map((p) => p.segmentIndex),
      ).size;
      const total = lesson.segmentCount;
      const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
      if (status === "Chưa làm") return doneCount === 0;
      if (status === "Đang làm") return doneCount > 0 && pct < 100;
      return pct >= 100;
    });
  }, [allLessons, level, status, progress]);

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Luyện nói</Text>
      </HapticTouchable>

      <View>
        <Text style={[s.title, { color: c.foreground }]}>Shadowing</Text>
        <Text style={[s.sub, { color: c.mutedForeground }]}>
          Nghe và nhại theo từng câu. AI đánh giá độ chính xác từng từ.
        </Text>
      </View>

      <View style={s.filtersStack}>
        <LevelFilters level={level} onLevelChange={setLevel} />
        <StatusFilters status={status} onStatusChange={setStatus} />
      </View>

      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={COLOR} size="large" />
        </View>
      ) : null}

      {isError ? (
        <MascotEmpty
          mascot="think"
          title="Không tải được danh sách"
          subtitle="Kiểm tra kết nối và thử lại."
        />
      ) : null}

      {!isLoading && !isError && lessons.length === 0 ? (
        <View
          style={[
            s.emptyStrip,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              borderBottomColor: "#CACACA",
            },
          ]}
        >
          <Text style={[s.emptyText, { color: c.mutedForeground }]}>
            {allLessons && allLessons.length > 0
              ? "Không có bài nào phù hợp với bộ lọc."
              : "Chưa có bài shadowing nào. Nội dung đang được cập nhật."}
          </Text>
        </View>
      ) : null}

      <View style={s.list}>
        {lessons.map((lesson) => {
          const doneCount = new Set(
            (progress?.[lesson.id] ?? []).map((p) => p.segmentIndex),
          ).size;
          const total = lesson.segmentCount;
          const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
          const completed = pct >= 100;

          return (
            <HapticTouchable
              key={lesson.id}
              scalePress
              onPress={() =>
                router.push(
                  `/(app)/practice/speaking/shadowing/${lesson.id}` as never,
                )
              }
            >
              <DepthCard style={s.card}>
                <View style={s.cardTop}>
                  <View style={[s.levelBadge, { backgroundColor: COLOR + "25" }]}>
                    <Text style={[s.levelText, { color: c.coinDark }]}>
                      {lesson.level}
                    </Text>
                  </View>
                  {doneCount > 0 ? (
                    <View
                      style={[
                        s.statusBadge,
                        {
                          backgroundColor: completed
                            ? c.primaryTint
                            : c.warningTint,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.statusText,
                          { color: completed ? c.primaryDark : c.warning },
                        ]}
                      >
                        {completed ? "Hoàn thành" : `${doneCount}/${total} đoạn`}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text
                  style={[s.cardTitle, { color: c.foreground }]}
                  numberOfLines={2}
                >
                  {lesson.title}
                </Text>

                <View style={s.metaRow}>
                  <Ionicons
                    name="mic-outline"
                    size={14}
                    color={c.coinDark}
                  />
                  <Text style={[s.metaText, { color: c.mutedForeground }]}>
                    {lesson.segmentCount} đoạn ·{" "}
                    {lesson.estimatedMinutes ?? "?"} phút
                  </Text>
                </View>

                {doneCount > 0 ? (
                  <View style={[s.progressTrack, { backgroundColor: c.muted }]}>
                    <View
                      style={[
                        s.progressFill,
                        {
                          backgroundColor: completed ? c.success : c.coin,
                          width: `${pct}%`,
                        },
                      ]}
                    />
                  </View>
                ) : null}
              </DepthCard>
            </HapticTouchable>
          );
        })}
      </View>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  sub: { fontSize: fontSize.sm, marginTop: spacing.xs, lineHeight: 20 },
  list: { gap: spacing.md },
  card: { padding: spacing.lg, gap: spacing.sm },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  levelText: { fontSize: 10, fontFamily: fontFamily.bold },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: { fontSize: 10, fontFamily: fontFamily.bold },
  cardTitle: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.bold,
    lineHeight: 22,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: fontSize.xs },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    overflow: "hidden",
    marginTop: spacing.xs,
  },
  progressFill: { height: "100%", borderRadius: radius.full },
  filtersStack: { gap: spacing.sm },
  loadingWrap: { paddingVertical: spacing.xl, alignItems: "center" },
  emptyStrip: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  emptyText: { fontSize: fontSize.sm, textAlign: "center" },
});
