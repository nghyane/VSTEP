import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HapticTouchable } from "@/components/HapticTouchable";
import { MascotEmpty } from "@/components/MascotStates";
import { useSpeakingConversationScenarios, useSpeakingTasks } from "@/hooks/use-practice";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function SpeakingListScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const speakingColor = c.skillSpeaking;
  const speakingText = c.coinDark;
  const { data: tasks, isLoading, isError } = useSpeakingTasks();
  const { data: scenarios, isLoading: scenariosLoading } = useSpeakingConversationScenarios();

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.background }]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <HapticTouchable onPress={() => router.back()} style={s.backRow}>
        <Ionicons name="arrow-back" size={20} color={c.foreground} />
        <Text style={[s.backText, { color: c.foreground }]}>Luyện tập</Text>
      </HapticTouchable>

      <View>
        <Text style={[s.title, { color: c.foreground }]}>Luyện nói</Text>
        <Text style={[s.sub, { color: c.mutedForeground }]}>Roleplay, shadowing và VSTEP Speaking trên mobile</Text>
      </View>

      <View style={s.quickActions}>
        <HapticTouchable
          scalePress
          style={[s.quickCard, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => router.push("/(app)/practice/speaking/shadowing" as never)}
        >
          <Ionicons name="volume-high-outline" size={18} color={speakingColor} />
          <View style={s.quickCopy}>
            <Text style={[s.quickText, { color: c.foreground }]}>Shadowing</Text>
            <Text style={[s.quickSub, { color: c.mutedForeground }]}>Nghe - nhắc lại - check độ khớp</Text>
          </View>
        </HapticTouchable>
        <HapticTouchable
          scalePress
          style={[s.quickCard, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => router.push("/(app)/practice/speaking/history" as never)}
        >
          <Ionicons name="time-outline" size={18} color={speakingColor} />
          <View style={s.quickCopy}>
            <Text style={[s.quickText, { color: c.foreground }]}>Lịch sử</Text>
            <Text style={[s.quickSub, { color: c.mutedForeground }]}>Drill và VSTEP đã nộp</Text>
          </View>
        </HapticTouchable>
      </View>

      <View>
        <Text style={[s.sectionLabel, { color: c.subtle }]}>AI ROLEPLAY</Text>
        {scenariosLoading && <ActivityIndicator color={speakingColor} style={s.inlineLoader} />}
        {!scenariosLoading && scenarios && scenarios.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scenarioRow}>
            {scenarios.map((scenario) => (
              <HapticTouchable
                key={scenario.id}
                scalePress
                style={[s.scenarioCard, { backgroundColor: c.card, borderColor: c.border }]}
                onPress={() => router.push(`/(app)/practice/speaking/conversation/${scenario.id}` as never)}
              >
                <View style={[s.avatar, { backgroundColor: c.coinTint }]}>
                  <Ionicons name="chatbubbles-outline" size={20} color={speakingText} />
                </View>
                <Text style={[s.scenarioTitle, { color: c.foreground }]} numberOfLines={2}>{scenario.title}</Text>
                <Text style={[s.scenarioMeta, { color: c.mutedForeground }]} numberOfLines={1}>
                  {scenario.characterName} · {scenario.level}
                </Text>
                <Text style={[s.scenarioDesc, { color: c.subtle }]} numberOfLines={2}>
                  {scenario.description ?? "Luyện phản xạ hội thoại với AI."}
                </Text>
              </HapticTouchable>
            ))}
          </ScrollView>
        )}
        {!scenariosLoading && (!scenarios || scenarios.length === 0) && (
          <View style={[s.emptyStrip, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[s.emptyText, { color: c.mutedForeground }]}>Chưa có kịch bản roleplay từ server.</Text>
          </View>
        )}
      </View>

      <HapticTouchable
        scalePress
        style={[s.wideAction, { backgroundColor: c.card, borderColor: c.border }]}
        onPress={() => router.push("/(app)/practice/speaking/drills" as never)}
      >
        <View style={[s.actionIcon, { backgroundColor: c.coinTint }]}>
          <Ionicons name="flash-outline" size={20} color={speakingText} />
        </View>
        <View style={s.quickCopy}>
          <Text style={[s.quickText, { color: c.foreground }]}>Speaking Drills</Text>
          <Text style={[s.quickSub, { color: c.mutedForeground }]}>Dùng backend drill thật, không mock đâu nha.</Text>
        </View>
      </HapticTouchable>

      {isLoading && (
        <View style={s.center}><ActivityIndicator color={speakingColor} size="large" /></View>
      )}

      {isError && (
        <View style={s.center}>
          <Text style={[s.errorText, { color: c.destructive }]}>Không thể tải dữ liệu. Kiểm tra kết nối và thử lại.</Text>
        </View>
      )}

      {!isLoading && tasks && tasks.length > 0 && (
        <View>
          <Text style={[s.sectionLabel, { color: c.subtle }]}>VSTEP SPEAKING</Text>
          <View style={s.cardGrid}>
            {tasks.map((task) => (
              <HapticTouchable
                key={task.id}
                scalePress
                style={s.cardWrapper}
                onPress={() => router.push(`/(app)/practice/speaking/${task.id}` as never)}
              >
                <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderBottomColor: c.border }]}>
                  <View style={[s.partBadge, { backgroundColor: c.coinTint }]}>
                    <Text style={[s.partBadgeText, { color: speakingText }]}>Part {task.part}</Text>
                  </View>
                  <Text style={[s.cardTitle, { color: c.foreground }]} numberOfLines={3}>{task.title}</Text>
                  <View style={s.cardMeta}>
                    <Ionicons name="mic-outline" size={12} color={speakingColor} />
                    <Text style={[s.cardMetaText, { color: c.mutedForeground }]}>
                      {task.speakingSeconds}s · {task.taskType}
                    </Text>
                  </View>
                </View>
              </HapticTouchable>
            ))}
          </View>
        </View>
      )}

      {!isLoading && (!tasks || tasks.length === 0) && (
        <MascotEmpty mascot="think" title="Chưa có bài nói" subtitle="Nội dung đang được cập nhật." />
      )}

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing["3xl"] },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold },
  sub: { fontSize: fontSize.sm, marginTop: spacing.xs },
  center: { paddingVertical: spacing["2xl"], alignItems: "center" },
  quickActions: { flexDirection: "row", gap: spacing.sm },
  quickCard: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg, padding: spacing.md },
  wideAction: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg, padding: spacing.md },
  quickCopy: { flex: 1, gap: 2 },
  quickText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  quickSub: { fontSize: 11, lineHeight: 15 },
  inlineLoader: { alignSelf: "flex-start", marginVertical: spacing.md },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1, marginBottom: spacing.md },
  scenarioRow: { gap: spacing.md, paddingRight: spacing.xl },
  scenarioCard: { width: 220, borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg, padding: spacing.base, gap: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  scenarioTitle: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold, lineHeight: 21 },
  scenarioMeta: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  scenarioDesc: { fontSize: fontSize.xs, lineHeight: 17 },
  emptyStrip: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.base },
  emptyText: { fontSize: fontSize.sm, textAlign: "center" },
  actionIcon: { width: 44, height: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 14, textAlign: "center" },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  cardWrapper: { width: "47%" },
  card: {
    borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.lg,
    padding: spacing.base, gap: spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 3,
  },
  partBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  partBadgeText: { fontSize: 10, fontFamily: fontFamily.extraBold },
  cardTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, lineHeight: 20 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaText: { fontSize: fontSize.xs },
});
