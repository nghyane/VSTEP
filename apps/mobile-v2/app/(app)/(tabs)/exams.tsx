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
import { DepthCard } from "@/components/DepthCard";
import { GameIcon } from "@/components/GameIcon";
import { SkillIcon } from "@/components/SkillIcon";
import { CoinButton } from "@/features/coin/CoinButton";
import { FULL_TEST_COST } from "@/features/coin/coin-store";
import { useExams, type Exam } from "@/hooks/use-exams";
import { MascotEmpty } from "@/components/MascotStates";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { Skill } from "@/types/api";

const SKILLS: { key: Skill; label: string }[] = [
  { key: "listening", label: "Nghe" },
  { key: "reading", label: "Đọc" },
  { key: "writing", label: "Viết" },
  { key: "speaking", label: "Nói" },
];

export default function ExamsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useExams();
  const [search, setSearch] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const exams = (data ?? []).filter((exam) =>
    exam.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: c.foreground }]}>Thi thử</Text>
            <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Chọn một đề thi, xem chi tiết rồi bắt đầu phiên thi hoàn chỉnh.</Text>
          </View>
          <CoinButton />
        </View>

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
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : null}

      {!isLoading && exams.length === 0 ? (
        <MascotEmpty
          mascot="think"
          title="Không tìm thấy đề thi nào"
          subtitle="Hãy thử một từ khóa khác hoặc quay lại xem toàn bộ thư viện đề."
        />
      ) : null}

      <View style={styles.list}>
        {exams.map((exam, index) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            index={index}
            onPress={() => router.push(`/(app)/exam/${exam.id}` as any)}
          />
        ))}
      </View>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function ExamCard({
  exam,
  index,
  onPress,
}: {
  exam: Exam;
  index: number;
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
      <HapticTouchable onPress={onPress} activeOpacity={0.8}>
        <DepthCard>
          {exam.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {exam.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: c.muted }]}> 
                  <Text style={[styles.tagText, { color: c.mutedForeground }]}>#{tag}</Text>
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
          </View>

          <View style={styles.skillRow}>
            {SKILLS.map((skill) => (
              <SkillChip key={skill.key} skill={skill.key} label={skill.label} />
            ))}
          </View>

          <View style={[styles.cardFooter, { borderTopColor: c.borderLight }]}> 
            <View style={styles.coinWrap}>
              <GameIcon name="coin" size={16} />
              <Text style={[styles.coinText, { color: c.coinDark }]}>{FULL_TEST_COST} xu</Text>
            </View>
            <View style={[styles.ctaBtn, { backgroundColor: c.primary }]}> 
              <Text style={styles.ctaBtnText}>Xem chi tiết</Text>
              <Ionicons name="arrow-forward" size={13} color="#FFF" />
            </View>
          </View>
        </DepthCard>
      </HapticTouchable>
    </Animated.View>
  );
}

function SkillChip({ skill, label }: { skill: Skill; label: string }) {
  const color = useSkillColor(skill);
  return (
    <View style={[styles.chip, { backgroundColor: color + "15" }]}> 
      <SkillIcon skill={skill} size={12} />
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.base },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  subtitle: { fontSize: fontSize.xs, marginTop: spacing.xs, lineHeight: 18 },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 2, borderRadius: radius.xl, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, marginBottom: spacing.xl },
  searchInput: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  loadingWrap: { paddingVertical: spacing["3xl"], alignItems: "center" },
  list: { gap: spacing.base },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.xs },
  tag: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  tagText: { fontSize: 10, fontFamily: fontFamily.medium },
  cardTitle: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold, lineHeight: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.xs },
  metaText: { fontSize: fontSize.xs },
  skillRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap", marginTop: spacing.xs },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  chipText: { fontSize: 11, fontFamily: fontFamily.semiBold },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.md },
  coinWrap: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  coinText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  ctaBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 4 },
  ctaBtnText: { color: "#FFF", fontSize: fontSize.xs, fontFamily: fontFamily.bold },
});
