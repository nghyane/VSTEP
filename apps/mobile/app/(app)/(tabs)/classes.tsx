import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { EmptyState } from "@/components/EmptyState";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useClasses, useJoinClass } from "@/hooks/use-classes";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { Class } from "@/types/api";

export default function ClassesTab() {
  const c = useThemeColors();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useClasses();
  const joinClass = useJoinClass();

  const [inviteCode, setInviteCode] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} onRetry={refetch} />;

  const classes = data?.data ?? [];

  const handleJoin = async () => {
    const code = inviteCode.trim();
    if (!code) return;
    setFeedback(null);
    try {
      await joinClass.mutateAsync(code);
      setFeedback({ type: "success", message: "Tham gia lớp thành công!" });
      setInviteCode("");
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message ?? "Không thể tham gia lớp",
      });
    }
  };

  const renderClass = ({ item }: { item: Class }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={() => router.push(`/(app)/classes/${item.id}`)}
    >
      <View style={[styles.iconWrap, { backgroundColor: c.primary + "20" }]}>
        <Ionicons name="people" size={20} color={c.primary} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: c.foreground }]}>
          {item.name}
        </Text>
        {item.description ? (
          <Text
            style={[styles.cardDesc, { color: c.mutedForeground }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={[styles.title, { color: c.foreground }]}>
                Lớp học
              </Text>
              <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
                Quản lý các lớp bạn đã tham gia
              </Text>
            </View>

            <View
              style={[
                styles.joinSection,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              <Text style={[styles.joinTitle, { color: c.foreground }]}>
                Tham gia lớp
              </Text>
              <View style={styles.joinRow}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: c.muted,
                      color: c.foreground,
                      borderColor: c.border,
                    },
                  ]}
                  placeholder="Nhập mã mời..."
                  placeholderTextColor={c.mutedForeground}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[
                    styles.joinBtn,
                    {
                      backgroundColor: c.primary,
                      opacity: joinClass.isPending ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleJoin}
                  disabled={joinClass.isPending}
                >
                  <Ionicons name="enter" size={18} color={c.primaryForeground} />
                  <Text
                    style={[styles.joinBtnText, { color: c.primaryForeground }]}
                  >
                    Tham gia
                  </Text>
                </TouchableOpacity>
              </View>
              {feedback && (
                <Text
                  style={[
                    styles.feedback,
                    {
                      color:
                        feedback.type === "success"
                          ? c.success
                          : c.destructive,
                    },
                  ]}
                >
                  {feedback.message}
                </Text>
              )}
            </View>

            <Text style={[styles.sectionTitle, { color: c.foreground }]}>
              Danh sách lớp
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Chưa tham gia lớp nào"
            subtitle="Nhập mã mời để tham gia lớp học"
          />
        }
        renderItem={renderClass}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.xl,
    paddingBottom: spacing["3xl"],
    flexGrow: 1,
  },
  header: { marginBottom: spacing.lg },
  title: { fontSize: fontSize["2xl"], fontWeight: "700" },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs },
  joinSection: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  joinTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  joinRow: { flexDirection: "row", gap: spacing.sm },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  joinBtnText: { fontSize: fontSize.sm, fontWeight: "600" },
  feedback: { fontSize: fontSize.xs, marginTop: spacing.sm },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: { flex: 1 },
  cardName: { fontWeight: "600", fontSize: fontSize.sm },
  cardDesc: { fontSize: fontSize.xs, marginTop: 2 },
});
