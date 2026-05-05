import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SkillIcon } from "@/components/SkillIcon";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import { depthNeutral } from "@/theme/depth";
import type { Skill } from "@/types/api";

// ─── Mock exercises ───────────────────────────────────────────────

type CardStatus = "not_started" | "in_progress" | "completed";

interface MockExercise {
  id: string;
  title: string;
  description: string;
  meta: string;
  category: string;
  status: CardStatus;
  score?: number;
  total?: number;
}

const CATEGORIES: Record<Skill, { key: string; label: string }[]> = {
  listening: [
    { key: "1", label: "Part 1 · Hội thoại ngắn" },
    { key: "2", label: "Part 2 · Hội thoại dài" },
    { key: "3", label: "Part 3 · Bài giảng" },
  ],
  reading: [
    { key: "1", label: "Part 1 · Đọc hiểu ngắn" },
    { key: "2", label: "Part 2 · Đọc hiểu trung bình" },
    { key: "3", label: "Part 3 · Đọc hiểu dài" },
  ],
  writing: [
    { key: "part-1", label: "Part 1 · Viết thư" },
    { key: "part-2", label: "Part 2 · Viết luận" },
  ],
  speaking: [
    { key: "A2", label: "A2 · Sơ cấp" },
    { key: "B1", label: "B1 · Trung cấp" },
    { key: "B2", label: "B2 · Trên trung cấp" },
    { key: "C1", label: "C1 · Nâng cao" },
  ],
};

// Mock exercises synced with frontend-v2 mock data IDs + titles
const EXERCISE_DB: Record<Skill, MockExercise[]> = {
  listening: [
    { id: "l1-directions", title: "Hỏi đường đến bưu điện", description: "Một người lạ hỏi đường đến bưu điện gần nhất.", meta: "2 phút", category: "1", status: "completed", score: 2, total: 2 },
    { id: "l1-cafe-order", title: "Gọi đồ tại quán cà phê", description: "Khách hàng gọi đồ uống và bánh ngọt tại quầy.", meta: "2 phút", category: "1", status: "in_progress", score: 1, total: 3 },
    { id: "l2-job-interview", title: "Phỏng vấn xin việc", description: "Ứng viên trả lời câu hỏi phỏng vấn.", meta: "4 phút", category: "2", status: "not_started", total: 4 },
    { id: "l2-travel-plan", title: "Lên kế hoạch du lịch", description: "Hai bạn bàn về chuyến du lịch sắp tới.", meta: "4 phút", category: "2", status: "not_started", total: 3 },
    { id: "l3-sleep-health", title: "Giấc ngủ và sức khỏe", description: "Bài giảng về tầm quan trọng của giấc ngủ.", meta: "5 phút", category: "3", status: "not_started", total: 5 },
    { id: "l3-climate-change", title: "Biến đổi khí hậu", description: "Thuyết trình về biến đổi khí hậu toàn cầu.", meta: "5 phút", category: "3", status: "not_started", total: 5 },
  ],
  reading: [
    { id: "r1-menu", title: "Thông báo nhà hàng", description: "Thông báo về giờ mở cửa và menu mới.", meta: "3 phút", category: "1", status: "completed", score: 3, total: 3 },
    { id: "r1-library", title: "Thông báo thư viện trường", description: "Quy định mới của thư viện.", meta: "3 phút", category: "1", status: "not_started", total: 2 },
    { id: "r2-remote-work", title: "Xu hướng làm việc từ xa", description: "Bài viết về ưu nhược điểm làm việc từ xa.", meta: "5 phút", category: "2", status: "in_progress", score: 2, total: 4 },
    { id: "r2-urban-garden", title: "Vườn rau đô thị", description: "Xu hướng trồng rau tại nhà ở thành phố.", meta: "5 phút", category: "2", status: "not_started", total: 4 },
    { id: "r3-ai-education", title: "Trí tuệ nhân tạo và giáo dục", description: "Tác động của AI đến hệ thống giáo dục.", meta: "7 phút", category: "3", status: "not_started", total: 5 },
  ],
  writing: [
    { id: "w1-apology-letter", title: "Thư xin lỗi bạn bè", description: "Viết thư xin lỗi vì lỡ hẹn.", meta: "120 từ · 20 phút", category: "part-1", status: "completed" },
    { id: "w1-complaint-letter", title: "Thư phàn nàn khách sạn", description: "Viết thư phàn nàn về dịch vụ.", meta: "120 từ · 20 phút", category: "part-1", status: "not_started" },
    { id: "w1-invitation-letter", title: "Thư mời bạn nước ngoài", description: "Viết thư mời bạn đến thăm.", meta: "120 từ · 20 phút", category: "part-1", status: "not_started" },
    { id: "w2-social-media", title: "Mạng xã hội có hại hay có lợi", description: "Viết luận bàn về tác động của mạng xã hội.", meta: "250 từ · 40 phút", category: "part-2", status: "not_started" },
    { id: "w2-air-pollution", title: "Ô nhiễm không khí ở thành phố lớn", description: "Viết luận về nguyên nhân và giải pháp.", meta: "250 từ · 40 phút", category: "part-2", status: "not_started" },
    { id: "w2-study-abroad", title: "Du học hay học trong nước", description: "Viết luận so sánh hai lựa chọn.", meta: "250 từ · 40 phút", category: "part-2", status: "not_started" },
  ],
  speaking: [
    { id: "sp-a2-daily", title: "Daily routine", description: "Luyện các câu mô tả thói quen hằng ngày.", meta: "4 phút", category: "A2", status: "completed", score: 5, total: 5 },
    { id: "sp-a2-family", title: "My family", description: "Giới thiệu về gia đình.", meta: "4 phút", category: "A2", status: "in_progress", score: 3, total: 5 },
    { id: "sp-b1-travel", title: "A memorable trip", description: "Kể về một chuyến đi đáng nhớ.", meta: "5 phút", category: "B1", status: "not_started", total: 5 },
    { id: "sp-b1-work", title: "Talking about work", description: "Nói về công việc và môi trường làm việc.", meta: "5 phút", category: "B1", status: "not_started", total: 5 },
    { id: "sp-b2-opinion", title: "Technology in education", description: "Trình bày quan điểm về công nghệ trong giáo dục.", meta: "5 phút", category: "B2", status: "not_started", total: 5 },
    { id: "sp-c1-social", title: "Social media and privacy", description: "Thảo luận về mạng xã hội và quyền riêng tư.", meta: "6 phút", category: "C1", status: "not_started", total: 5 },
  ],
};

function getExercises(skill: Skill, category: string): MockExercise[] {
  return EXERCISE_DB[skill].filter((e) => e.category === category);
}

// ─── Skill tabs ───────────────────────────────────────────────────

const SKILL_ORDER: Skill[] = ["listening", "reading", "speaking", "writing"];
const SKILL_VN: Record<Skill, string> = { listening: "Nghe", reading: "Đọc", writing: "Viết", speaking: "Nói" };

// ─── Screen ───────────────────────────────────────────────────────

export default function SkillHubScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeSkill, setActiveSkill] = useState<Skill>("listening");
  const cats = CATEGORIES[activeSkill];
  const [activeCat, setActiveCat] = useState(cats[0].key);

  // Reset category when skill changes
  function handleSkillChange(skill: Skill) {
    setActiveSkill(skill);
    setActiveCat(CATEGORIES[skill][0].key);
  }

  const exercises = getExercises(activeSkill, activeCat);
  const activeCatLabel = cats.find((c) => c.key === activeCat)?.label ?? "";

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Luyện tập kỹ năng" />
      </View>

      {/* Skill tabs */}
      <View style={[styles.tabRow, { borderBottomColor: c.border }]}>
        {SKILL_ORDER.map((skill) => {
          const active = skill === activeSkill;
          const color = useSkillColor(skill);
          return (
            <HapticTouchable key={skill} style={styles.tab} onPress={() => handleSkillChange(skill)}>
              <View style={styles.tabInner}>
                <SkillIcon skill={skill} size={16} />
                <Text style={[styles.tabLabel, { color: active ? color : c.subtle, fontFamily: active ? fontFamily.semiBold : fontFamily.medium }]}>
                  {SKILL_VN[skill]}
                </Text>
              </View>
              {active && <View style={[styles.tabIndicator, { backgroundColor: color }]} />}
            </HapticTouchable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {cats.map((cat) => {
            const active = cat.key === activeCat;
            const color = useSkillColor(activeSkill);
            return (
              <HapticTouchable
                key={cat.key}
                style={[styles.chip, { borderColor: active ? color : c.border, backgroundColor: active ? color + "15" : "transparent" }]}
                onPress={() => setActiveCat(cat.key)}
              >
                <Text style={[styles.chipText, { color: active ? color : c.subtle }]}>{cat.label}</Text>
              </HapticTouchable>
            );
          })}
        </ScrollView>

        {/* Header */}
        <View style={styles.listHeader}>
          <Text style={[styles.listHeaderLabel, { color: c.foreground }]}>{activeCatLabel}</Text>
          <Text style={[styles.listHeaderCount, { color: c.subtle }]}>{exercises.length} bài</Text>
        </View>

        {/* Exercise cards grid */}
        <View style={styles.grid}>
          {exercises.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} skill={activeSkill} onPress={() => router.push(`/(app)/practice/${activeSkill}`)} />
          ))}
        </View>

        {exercises.length === 0 && (
          <Text style={[styles.empty, { color: c.subtle }]}>Chưa có bài tập cho phần này.</Text>
        )}

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────

function ExerciseCard({ exercise: ex, skill, onPress }: { exercise: MockExercise; skill: Skill; onPress: () => void }) {
  const c = useThemeColors();
  const color = useSkillColor(skill);
  const pct = ex.total && ex.score !== undefined ? Math.round((ex.score / ex.total) * 100) : 0;
  const hasProgress = ex.status !== "not_started" && ex.total && ex.total > 0;

  return (
    <HapticTouchable style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardTop}>
        <Text style={[styles.cardTitle, { color: c.foreground }]} numberOfLines={1}>{ex.title}</Text>
        {ex.status !== "not_started" && (
          <View style={[styles.statusBadge, { backgroundColor: ex.status === "completed" ? c.success + "18" : c.warning + "18" }]}>
            <Text style={[styles.statusText, { color: ex.status === "completed" ? c.success : c.warning }]}>
              {ex.status === "completed" ? "Hoàn thành" : "Đang làm"}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.cardDesc, { color: c.subtle }]} numberOfLines={2}>{ex.description}</Text>
      <View style={styles.cardMeta}>
        <Text style={[styles.cardMetaText, { color: c.subtle }]}>{ex.meta}</Text>
        {ex.total !== undefined && (
          <View style={[styles.countPill, { backgroundColor: c.background }]}>
            <Text style={[styles.countText, { color: c.subtle }]}>{ex.total} câu</Text>
          </View>
        )}
      </View>
      {hasProgress && (
        <View style={styles.progressWrap}>
          <View style={styles.progressMeta}>
            <Text style={[styles.progressText, { color: c.subtle }]}>{ex.score}/{ex.total} đúng</Text>
            <Text style={[styles.progressText, { color: c.subtle }]}>{pct}%</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: c.background }]}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct >= 80 ? c.success : pct >= 50 ? c.primary : c.warning }]} />
          </View>
        </View>
      )}
    </HapticTouchable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Tabs
  tabRow: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: spacing.base },
  tab: { flex: 1, alignItems: "center", paddingVertical: spacing.md },
  tabInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  tabLabel: { fontSize: fontSize.sm },
  tabIndicator: { position: "absolute", bottom: 0, left: "20%", right: "20%", height: 2, borderRadius: 1 },
  // Content
  scroll: { paddingHorizontal: spacing.xl },
  chipRow: { gap: spacing.sm, paddingVertical: spacing.base },
  chip: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  chipText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.base },
  listHeaderLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  listHeaderCount: { fontSize: fontSize.xs },
  grid: { gap: spacing.sm },
  empty: { textAlign: "center", paddingVertical: spacing["3xl"], fontSize: fontSize.sm },
  // Card
  card: { ...depthNeutral, borderRadius: radius.xl, padding: spacing.base, gap: spacing.xs },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  cardTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold, flex: 1 },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusText: { fontSize: 11, fontFamily: fontFamily.medium },
  cardDesc: { fontSize: fontSize.xs },
  cardMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  cardMetaText: { fontSize: fontSize.xs },
  countPill: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  countText: { fontSize: 11, fontFamily: fontFamily.medium },
  progressWrap: { marginTop: spacing.xs },
  progressMeta: { flexDirection: "row", justifyContent: "space-between" },
  progressText: { fontSize: 11 },
  progressTrack: { height: 4, borderRadius: 2, marginTop: 4, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
});
