import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { HapticTouchable } from "@/components/HapticTouchable";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { EmptyState } from "@/components/EmptyState";
import { SKILL_LABELS } from "@/components/SkillIcon";
import {
  useClassDetail,
  useLeaveClass,
  useClassFeedback,
  useAssignments,
  useLeaderboard,
  useStartAssignment,
  useSubmitAnswer,
} from "@/hooks/use-classes";
import { useAuth } from "@/hooks/use-auth";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { ClassAssignment, ClassAssignmentSubmission, ClassFeedback, LeaderboardEntry, Skill } from "@/types/api";

type Tab = "assignments" | "leaderboard" | "feedback" | "members";

export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const { user } = useAuth();

  const { data: detail, isLoading, error } = useClassDetail(id!);
  const leaveMutation = useLeaveClass();
  const [tab, setTab] = useState<Tab>("assignments");

  if (isLoading) return <LoadingScreen />;
  if (error || !detail) return <ErrorScreen message={error?.message ?? "Không tìm thấy lớp"} />;

  function handleLeave() {
    Alert.alert("Rời lớp", `Bạn có chắc muốn rời khỏi "${detail!.name}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Rời lớp",
        style: "destructive",
        onPress: () =>
          leaveMutation.mutate(id!, { onSuccess: () => router.back() }),
      },
    ]);
  }

  const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "assignments", label: "Bài tập", icon: "document-text-outline" },
    { key: "leaderboard", label: "Xếp hạng", icon: "trophy-outline" },
    { key: "feedback", label: "Nhận xét", icon: "chatbubble-outline" },
    { key: "members", label: "Thành viên", icon: "people-outline" },
  ];

  return (
    <ScreenWrapper noPadding>
      <BouncyScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.title, { color: c.foreground }]}>{detail.name}</Text>
          {detail.description ? (
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>{detail.description}</Text>
          ) : null}
          <View style={styles.metaRow}>
            <Ionicons name="people" size={14} color={c.mutedForeground} />
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>{detail.memberCount} thành viên</Text>
          </View>
        </View>

        {/* Tab bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {tabs.map((t) => (
            <HapticTouchable
              key={t.key}
              style={[styles.tabChip, { backgroundColor: tab === t.key ? c.primary + "18" : c.muted, borderColor: tab === t.key ? c.primary : "transparent" }]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons name={t.icon} size={14} color={tab === t.key ? c.primary : c.mutedForeground} />
              <Text style={{ color: tab === t.key ? c.primary : c.mutedForeground, fontSize: fontSize.xs, fontWeight: "600" }}>
                {t.label}
              </Text>
            </HapticTouchable>
          ))}
        </ScrollView>

        {/* Tab content */}
        {tab === "assignments" && <AssignmentsTab classId={id!} />}
        {tab === "leaderboard" && <LeaderboardTab classId={id!} currentUserId={user?.id} />}
        {tab === "feedback" && <FeedbackTab classId={id!} />}
        {tab === "members" && <MembersTab members={detail.members} />}

        {/* Leave class */}
        <HapticTouchable style={[styles.leaveBtn, { borderColor: c.destructive }]} onPress={handleLeave}>
          <Ionicons name="exit-outline" size={16} color={c.destructive} />
          <Text style={{ color: c.destructive, fontWeight: "600", fontSize: fontSize.sm }}>Rời lớp</Text>
        </HapticTouchable>
      </BouncyScrollView>
    </ScreenWrapper>
  );
}

// ─── Assignments Tab ─────────────────────────────────────────────────────────

function AssignmentsTab({ classId }: { classId: string }) {
  const c = useThemeColors();
  const { data: assignments, isLoading } = useAssignments(classId);
  const startMutation = useStartAssignment();
  const submitMutation = useSubmitAnswer();
  const [writingText, setWritingText] = useState<Record<string, string>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  if (isLoading) return <ActivityIndicator style={{ padding: spacing.xl }} color={c.primary} />;

  const items = assignments ?? [];
  if (items.length === 0) return <EmptyState icon="document-text-outline" title="Chưa có bài tập" />;

  function handleStart(assignmentId: string) {
    startMutation.mutate({ classId, assignmentId });
  }

  function handleSubmit(assignment: ClassAssignment) {
    const skill = assignment.skill;
    let answer = "";
    if (skill === "writing" || skill === "speaking") {
      answer = writingText[assignment.id] ?? "";
    } else {
      answer = selectedAnswers[assignment.id] ?? "";
    }
    if (!answer.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập câu trả lời");
      return;
    }
    const isPastDue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
    if (isPastDue) {
      Alert.alert("Quá hạn", "Bài tập đã quá hạn. Bạn vẫn muốn nộp?", [
        { text: "Hủy", style: "cancel" },
        { text: "Nộp", onPress: () => submitMutation.mutate({ classId, assignmentId: assignment.id, answer }) },
      ]);
    } else {
      submitMutation.mutate({ classId, assignmentId: assignment.id, answer });
    }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((a) => {
        const mySub = a.submissions?.find((s) => true);
        const isPastDue = a.dueDate && new Date(a.dueDate) < new Date();
        return (
          <View key={a.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.assignmentHeader}>
              <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.sm, flex: 1 }}>{a.title}</Text>
              {a.skill && (
                <View style={[styles.skillBadge, { backgroundColor: c.primary + "15" }]}>
                  <Text style={{ color: c.primary, fontSize: 10, fontWeight: "600" }}>
                    {SKILL_LABELS[a.skill as Skill] ?? a.skill}
                  </Text>
                </View>
              )}
            </View>
            {a.description && <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>{a.description}</Text>}
            {a.dueDate && (
              <Text style={{ color: isPastDue ? c.destructive : c.mutedForeground, fontSize: fontSize.xs }}>
                {isPastDue ? "Quá hạn: " : "Hạn: "}{new Date(a.dueDate).toLocaleDateString("vi-VN")}
              </Text>
            )}

            {/* Submission status */}
            {mySub?.status === "graded" && (
              <View style={[styles.resultBadge, { backgroundColor: c.success + "15" }]}>
                <Ionicons name="checkmark-circle" size={14} color={c.success} />
                <Text style={{ color: c.success, fontSize: fontSize.xs, fontWeight: "600" }}>
                  Đã chấm: {mySub.score}/10
                </Text>
                {mySub.feedback ? <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>{mySub.feedback}</Text> : null}
              </View>
            )}
            {mySub?.status === "submitted" && (
              <View style={[styles.resultBadge, { backgroundColor: c.warning + "15" }]}>
                <Ionicons name="time-outline" size={14} color={c.warning} />
                <Text style={{ color: c.warning, fontSize: fontSize.xs, fontWeight: "600" }}>Đã nộp, chờ chấm</Text>
              </View>
            )}

            {/* Answer form for pending */}
            {mySub?.status === "pending" && a.content && (
              <View style={{ gap: spacing.sm }}>
                <View style={[styles.contentBox, { backgroundColor: c.muted }]}>
                  <Text style={{ color: c.foreground, fontSize: fontSize.sm }}>{a.content}</Text>
                </View>
                {(a.skill === "writing" || a.skill === "speaking") ? (
                  <TextInput
                    style={[styles.answerInput, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
                    placeholder="Nhập câu trả lời..."
                    placeholderTextColor={c.mutedForeground}
                    multiline
                    textAlignVertical="top"
                    value={writingText[a.id] ?? ""}
                    onChangeText={(t) => setWritingText((prev) => ({ ...prev, [a.id]: t }))}
                  />
                ) : (
                  <TextInput
                    style={[styles.mcqInput, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
                    placeholder="Nhập đáp án (A, B, C, D)..."
                    placeholderTextColor={c.mutedForeground}
                    value={selectedAnswers[a.id] ?? ""}
                    onChangeText={(t) => setSelectedAnswers((prev) => ({ ...prev, [a.id]: t }))}
                    autoCapitalize="characters"
                  />
                )}
                <HapticTouchable
                  style={[styles.submitBtn, { backgroundColor: c.primary }]}
                  onPress={() => handleSubmit(a)}
                  disabled={submitMutation.isPending}
                >
                  <Text style={{ color: c.primaryForeground, fontWeight: "600", fontSize: fontSize.sm }}>
                    {submitMutation.isPending ? "Đang nộp..." : "Nộp bài"}
                  </Text>
                </HapticTouchable>
              </View>
            )}

            {/* Start button if no submission yet */}
            {!mySub && (
              <HapticTouchable
                style={[styles.submitBtn, { backgroundColor: c.primary }]}
                onPress={() => handleStart(a.id)}
                disabled={startMutation.isPending}
              >
                <Ionicons name="play" size={16} color={c.primaryForeground} />
                <Text style={{ color: c.primaryForeground, fontWeight: "600", fontSize: fontSize.sm }}>Làm bài</Text>
              </HapticTouchable>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Leaderboard Tab ─────────────────────────────────────────────────────────

function LeaderboardTab({ classId, currentUserId }: { classId: string; currentUserId?: string }) {
  const c = useThemeColors();
  const { data, isLoading } = useLeaderboard(classId);

  if (isLoading) return <ActivityIndicator style={{ padding: spacing.xl }} color={c.primary} />;

  const entries = data ?? [];
  if (entries.length === 0) return <EmptyState icon="trophy-outline" title="Chưa có dữ liệu" />;

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      {entries.map((entry) => {
        const isMe = entry.userId === currentUserId;
        const rankColor = entry.rank === 1 ? "#FFD700" : entry.rank === 2 ? "#C0C0C0" : entry.rank === 3 ? "#CD7F32" : c.mutedForeground;
        return (
          <View key={entry.userId} style={[styles.leaderRow, isMe && { backgroundColor: c.primary + "08" }]}>
            <Text style={{ color: rankColor, fontWeight: "800", fontSize: fontSize.base, width: 28, textAlign: "center" }}>
              {entry.rank}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.foreground, fontWeight: isMe ? "700" : "500", fontSize: fontSize.sm }}>
                {entry.fullName}{isMe ? " (Bạn)" : ""}
              </Text>
            </View>
            <Text style={{ color: c.primary, fontWeight: "700", fontSize: fontSize.sm }}>
              {entry.avgScore.toFixed(1)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Feedback Tab ────────────────────────────────────────────────────────────

function FeedbackTab({ classId }: { classId: string }) {
  const c = useThemeColors();
  const { data, isLoading } = useClassFeedback(classId);

  if (isLoading) return <ActivityIndicator style={{ padding: spacing.xl }} color={c.primary} />;

  const items = data?.data ?? [];
  if (items.length === 0) return <EmptyState icon="chatbubble-outline" title="Chưa có nhận xét" />;

  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((fb) => (
        <View key={fb.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.feedbackHeader}>
            <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.sm }}>
              {fb.fromUserName ?? "Giảng viên"}
            </Text>
            {fb.skill && (
              <View style={[styles.skillBadge, { backgroundColor: c.primary + "15" }]}>
                <Text style={{ color: c.primary, fontSize: 10, fontWeight: "600" }}>
                  {SKILL_LABELS[fb.skill as Skill] ?? fb.skill}
                </Text>
              </View>
            )}
          </View>
          <Text style={{ color: c.foreground, fontSize: fontSize.sm, lineHeight: 20 }}>{fb.content}</Text>
          <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>
            {new Date(fb.createdAt).toLocaleDateString("vi-VN")}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Members Tab ─────────────────────────────────────────────────────────────

function MembersTab({ members }: { members: { id: string; userId: string; fullName: string | null; email: string; joinedAt: string }[] }) {
  const c = useThemeColors();

  if (members.length === 0) return <EmptyState icon="people-outline" title="Chưa có thành viên" />;

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      {members.map((m) => (
        <View key={m.id} style={styles.memberRow}>
          <View style={[styles.avatar, { backgroundColor: c.primary + "18" }]}>
            <Text style={{ color: c.primary, fontWeight: "700", fontSize: fontSize.xs }}>
              {(m.fullName ?? m.email).charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.foreground, fontWeight: "500", fontSize: fontSize.sm }}>{m.fullName ?? m.email}</Text>
            <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }}>{m.email}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.base, paddingBottom: spacing["3xl"] },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm },
  title: { fontWeight: "700", fontSize: fontSize.lg },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  tabRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  tabChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5 },
  assignmentHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  skillBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  contentBox: { borderRadius: radius.md, padding: spacing.md },
  answerInput: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, minHeight: 120, fontSize: fontSize.sm },
  mcqInput: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.sm },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.md, paddingVertical: spacing.sm },
  resultBadge: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radius.md, padding: spacing.sm },
  leaderRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  feedbackHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  leaveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderWidth: 1, borderRadius: radius.lg, paddingVertical: spacing.md },
});
