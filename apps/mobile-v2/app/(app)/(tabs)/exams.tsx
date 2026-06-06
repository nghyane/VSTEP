import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTouchable } from "@/components/HapticTouchable";
import { BrandIcon } from "@/components/BrandIcon";
import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { SkillIcon } from "@/components/SkillIcon";
import { CoinButton } from "@/features/coin/CoinButton";
import { useAppConfig, useExams, type Exam } from "@/hooks/use-exams";
import { MascotEmpty } from "@/components/MascotStates";
import { useThemeColors, useSkillColor, useResponsiveLayout, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Skill } from "@/types/api";

const SKILLS: { key: Skill; label: string }[] = [
  { key: "listening", label: "Nghe" },
  { key: "reading", label: "Đọc" },
  { key: "writing", label: "Viết" },
  { key: "speaking", label: "Nói" },
];

type StatusFilter = "all" | "not_started" | "in_progress" | "submitted";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "not_started", label: "Chưa làm" },
  { key: "in_progress", label: "Đang làm" },
  { key: "submitted", label: "Đã nộp" },
];

export default function ExamsScreen() {
  const c = useThemeColors();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError } = useExams();
  const { data: config } = useAppConfig();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const exams = (data ?? []).filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    return exam.userState?.status === statusFilter;
  });
  const activeExam = (data ?? []).find((exam) => exam.userState?.activeSessionId);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.lg,
          paddingLeft: layout.isTabletLandscape ? layout.contentInsetStart : layout.horizontalPadding,
          paddingRight: layout.horizontalPadding,
          alignItems: "center",
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.sectionShell, { maxWidth: layout.contentMaxWidth, opacity: fadeAnim }]}>
        <View style={[styles.headerRow, layout.isTablet ? styles.headerRowWide : null]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: c.foreground }]}>Thi thử</Text>
            <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Chọn một đề thi, xem chi tiết rồi bắt đầu phiên thi hoàn chỉnh.</Text>
          </View>
          <CoinButton />
        </View>

        {activeExam ? (
          <ActiveSessionCard exam={activeExam} />
        ) : null}

        <View style={[styles.searchWrap, { backgroundColor: c.surface, borderColor: c.border }]}> 
          <Ionicons name="search-outline" size={17} color={c.subtle} />
          <TextInput
            style={[styles.searchInput, { color: c.foreground }]}
            placeholder="Tìm kiếm đề thi..."
            placeholderTextColor={c.placeholder}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 ? (
            <HapticTouchable onPress={() => setSearch("")}> 
              <Ionicons name="close-circle" size={17} color={c.subtle} />
            </HapticTouchable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.key;
            return (
              <HapticTouchable
                key={filter.key}
                onPress={() => setStatusFilter(filter.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? c.primaryTint : c.surface,
                    borderColor: active ? c.primary : c.border,
                  },
                ]}
              >
                <Text style={[styles.filterText, { color: active ? c.primaryDark : c.mutedForeground }]}>
                  {filter.label}
                </Text>
              </HapticTouchable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : null}

      {isError ? (
        <View style={styles.loadingWrap}>
          <Text style={{ color: c.destructive, fontSize: fontSize.sm, textAlign: "center" }}>
            Không thể tải danh sách đề thi. Kiểm tra kết nối và thử lại.
          </Text>
        </View>
      ) : null}

      {!isLoading && !isError && exams.length === 0 ? (
        <MascotEmpty
          mascot="think"
          title="Không tìm thấy đề thi nào"
          subtitle="Hãy thử một từ khóa khác hoặc quay lại xem toàn bộ thư viện đề."
        />
      ) : null}

      <View style={[styles.sectionShell, styles.list, { maxWidth: layout.contentMaxWidth }]}> 
        {exams.map((exam, index) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              index={index}
              cost={config?.pricing.exam.fullTestCostCoins ?? 25}
              onPress={() => router.push(`/(app)/exam/${exam.id}` as any)}
            />
        ))}
      </View>
    </ScrollView>
  );
}

function ActiveSessionCard({ exam }: { exam: Exam }) {
  const c = useThemeColors();
  const router = useRouter();
  const sessionId = exam.userState?.activeSessionId;
  const title = exam.title;

  const handleContinue = () => {
    if (!sessionId) return;
    router.push(`/(app)/session/${sessionId}?resume=1` as any);
  };

  return (
    <DepthCard style={styles.activeCard}>
      <View style={styles.activeHeader}>
        <View style={[styles.activeIcon, { backgroundColor: c.warningTint }]}> 
          <Ionicons name="time-outline" size={18} color={c.warning} />
        </View>
        <View style={styles.activeTextWrap}>
          <Text style={[styles.activeEyebrow, { color: c.warning }]}>Phiên thi đang diễn ra</Text>
          <Text style={[styles.activeTitle, { color: c.foreground }]} numberOfLines={1}>{title}</Text>
        </View>
      </View>
      <View style={styles.activeActions}>
        <DepthButton size="sm" onPress={handleContinue}>
          Tiếp tục
        </DepthButton>
      </View>
    </DepthCard>
  );
}

function ExamCard({
  exam,
  index,
  cost,
  onPress,
}: {
  exam: Exam;
  index: number;
  cost: number;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      delay: 100 + index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <HapticTouchable activeOpacity={1}>
        <DepthCard>
          {exam.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {exam.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: c.muted }]}> 
                  <Text style={[styles.tagText, { color: c.mutedForeground }]}>#{tag.replace(/^#+/, "")}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={[styles.cardTitle, { color: c.foreground }]} numberOfLines={2}>
            {exam.title}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={c.subtle} />
            <Text style={[styles.metaText, { color: c.subtle }]}>{exam.totalDurationMinutes} phút</Text>
            {exam.bestScore != null && (
              <>
                <Text style={[styles.metaDot, { color: c.subtle }]}>·</Text>
                <Ionicons name="star-outline" size={13} color={c.coin} />
                <Text style={[styles.metaText, { color: c.coinDark }]}>{exam.bestScore.toFixed(1)}</Text>
              </>
            )}
            {getExamAttemptCount(exam) > 0 && (
              <>
                <Text style={[styles.metaDot, { color: c.subtle }]}>·</Text>
                <Text style={[styles.metaText, { color: c.subtle }]}>{getExamAttemptCount(exam)} lần thi</Text>
              </>
            )}
          </View>

          <View style={styles.skillRow}>
            {getExamSkills(exam).map((skill) => (
              <SkillChip key={skill.key} skill={skill.key} label={skill.label} />
            ))}
          </View>

          <View style={[styles.cardFooter, { borderTopColor: c.borderLight }]}> 
            <View style={styles.coinWrap}>
              <BrandIcon name="coin" size={16} />
              <Text style={[styles.coinText, { color: c.coinDark }]}>{cost} xu</Text>
            </View>
            <DepthButton size="sm" onPress={onPress}>
              Xem chi tiết →
            </DepthButton>
          </View>
        </DepthCard>
      </HapticTouchable>
    </Animated.View>
  );
}

function getExamAttemptCount(exam: Exam): number {
  return exam.attemptsCount ?? exam.attemptCount ?? exam.userState?.sessionCount ?? 0;
}

function getExamSkills(exam: Exam): { key: Skill; label: string }[] {
  if (!exam.skill || exam.skill === "mixed") return SKILLS;
  return SKILLS.filter((skill) => skill.key === exam.skill);
}

function SkillChip({ skill, label }: { skill: Skill; label: string }) {
  const color = useSkillColor(skill);
  return (
    <View style={[styles.chip, { backgroundColor: color + "15" }]}> 
      <SkillIcon skill={skill} size={12} bare />
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { gap: spacing.base },
  sectionShell: { width: "100%" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.base },
  headerRowWide: { alignItems: "center" },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  subtitle: { fontSize: fontSize.xs, marginTop: spacing.xs, lineHeight: 18 },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 2, borderRadius: radius.xl, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, marginBottom: spacing.xl },
  activeCard: { marginBottom: spacing.base },
  activeHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  activeIcon: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  activeTextWrap: { flex: 1 },
  activeEyebrow: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  activeTitle: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold, marginTop: 2 },
  activeActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.base },
  searchInput: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  filterRow: { gap: spacing.sm, paddingBottom: spacing.xl },
  filterChip: { borderWidth: 2, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterText: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  loadingWrap: { paddingVertical: spacing["3xl"], alignItems: "center" },
  list: { gap: spacing.base },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.xs },
  tag: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  tagText: { fontSize: 10, fontFamily: fontFamily.medium },
  cardTitle: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold, lineHeight: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.xs },
  metaText: { fontSize: fontSize.xs },
  metaDot: { fontSize: fontSize.sm },
  skillRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap", marginTop: spacing.xs },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  chipText: { fontSize: 11, fontFamily: fontFamily.semiBold },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.md },
  coinWrap: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  coinText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
});
