// Shadowing session screen — segment-by-segment shadow practice.
// Mirrors apps/frontend-v3/src/features/practice/components/ShadowingInProgress.tsx
// adapted to React Native + expo-speech + mobile useSpeechToText hook.
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { FocusHeader } from "@/components/FocusHeader";
import { HapticTouchable } from "@/components/HapticTouchable";
import { MascotEmpty } from "@/components/MascotStates";
import { ShadowingSegmentCard } from "@/features/shadowing/ShadowingSegmentCard";
import type { ShadowingLessonDetail } from "@/features/shadowing/types";
import { useShadowingLessonDetail } from "@/features/shadowing/use-shadowing-lessons";
import { useShadowingSession } from "@/features/shadowing/use-shadowing-session";
import {
  fontFamily,
  fontSize,
  radius,
  spacing,
  useThemeColors,
} from "@/theme";

const COLOR = "#FFC800";

export default function ShadowingLessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: lesson, isLoading, isError } = useShadowingLessonDetail(lessonId ?? "");

  if (isLoading) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={COLOR} size="large" />
      </View>
    );
  }

  if (isError || !lesson) {
    return (
      <View style={[s.center, { backgroundColor: c.background }]}>
        <MascotEmpty
          mascot="think"
          title="Không tìm thấy bài học"
          subtitle="Bài shadowing này không tồn tại hoặc đã bị gỡ."
        />
        <DepthButton
          fullWidth
          onPress={() => router.back()}
          style={{ marginTop: spacing.xl }}
        >
          Quay lại
        </DepthButton>
      </View>
    );
  }

  return <SessionView lesson={lesson} insets={insets} c={c} onBack={() => router.back()} />;
}

interface SessionViewProps {
  lesson: ShadowingLessonDetail;
  insets: { top: number; bottom: number };
  c: ReturnType<typeof useThemeColors>;
  onBack: () => void;
}

function SessionView({ lesson, insets, c, onBack }: SessionViewProps) {
  const session = useShadowingSession(lesson);
  const { segment, current, total, mergedDone, mic, elapsed, attempt, emptyWarning } = session;
  const completedCount = mergedDone.size;
  const isLast = current === total - 1;

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      <FocusHeader
        current={completedCount}
        total={total}
        accentColor={COLOR}
        onClose={onBack}
        c={c}
        topInset={insets.top}
      />

      <View style={[s.lessonHeader, { borderBottomColor: c.borderLight }]}>
        <View style={s.lessonHeaderRow}>
          <View style={[s.levelBadge, { backgroundColor: COLOR + "20" }]}>
            <Text style={[s.levelText, { color: c.coinDark }]}>{lesson.level}</Text>
          </View>
          <Text
            style={[s.lessonTitle, { color: c.foreground }]}
            numberOfLines={1}
          >
            {lesson.title}
          </Text>
        </View>
        <Text style={[s.lessonProgress, { color: c.subtle }]}>
          Đoạn {current + 1}/{total} · Đã hoàn thành {completedCount}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {segment ? (
          <ShadowingSegmentCard
            segment={segment}
            mic={mic}
            elapsed={elapsed}
            attempt={attempt}
            emptyWarning={emptyWarning}
            onListen={session.handleListen}
            onRecord={session.handleRecord}
          />
        ) : null}

        <View style={s.segmentMap}>
          {lesson.segments.map((seg, idx) => {
            const isDone = mergedDone.has(idx);
            const isCurrent = idx === current;
            const tone = isCurrent ? c.info : isDone ? c.success : c.muted;
            const fg = isCurrent
              ? c.primaryForeground
              : isDone
                ? c.primaryForeground
                : c.mutedForeground;
            return (
              <HapticTouchable
                key={seg.id}
                onPress={() => session.goTo(idx)}
                style={[s.segmentDot, { backgroundColor: tone }]}
              >
                <Text style={[s.segmentDotText, { color: fg }]}>{idx + 1}</Text>
              </HapticTouchable>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={[
          s.footer,
          {
            paddingBottom: insets.bottom + spacing.base,
            borderTopColor: c.borderLight,
            backgroundColor: c.surface,
          },
        ]}
      >
        <HapticTouchable
          onPress={() => session.goTo(current - 1)}
          disabled={current === 0}
          style={[
            s.footerBtn,
            {
              backgroundColor: c.muted,
              opacity: current === 0 ? 0.4 : 1,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={18} color={c.foreground} />
          <Text style={[s.footerBtnText, { color: c.foreground }]}>Trước</Text>
        </HapticTouchable>

        <HapticTouchable
          onPress={() => session.goTo(current + 1)}
          disabled={isLast}
          style={[
            s.footerBtn,
            {
              backgroundColor: COLOR,
              opacity: isLast ? 0.4 : 1,
            },
          ]}
        >
          <Text style={[s.footerBtnText, { color: c.primaryForeground }]}>
            {isLast ? "Hết bài" : "Tiếp"}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={c.primaryForeground}
          />
        </HapticTouchable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["3xl"],
  },
  lessonHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.xs,
  },
  lessonHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  levelText: { fontSize: 10, fontFamily: fontFamily.bold },
  lessonTitle: {
    flex: 1,
    fontSize: fontSize.base,
    fontFamily: fontFamily.bold,
  },
  lessonProgress: { fontSize: fontSize.xs },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  segmentMap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "center",
  },
  segmentDot: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentDotText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.button,
  },
  footerBtnText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
});
