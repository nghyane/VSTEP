import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BouncyFlatList } from "@/components/BouncyScrollView";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GradientBackground } from "@/components/GradientBackground";
import { StickyHeader, HEADER_H } from "@/components/StickyHeader";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { EmptyState } from "@/components/EmptyState";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useClasses, useJoinClass } from "@/hooks/use-classes";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import type { ClassItem } from "@/types/api";


function useFadeIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 120, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity, translateY]);

  return { opacity, transform: [{ translateY }] };
}

export default function ClassesTab() {
  const c = useThemeColors();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useClasses();
  const joinClass = useJoinClass();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const [inviteCode, setInviteCode] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fade = useFadeIn(0);

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

  const renderClass = ({ item }: { item: ClassItem }) => (
    <HapticTouchable
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
    </HapticTouchable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <GradientBackground />
      <StickyHeader scrollY={scrollY} />
      <Animated.View style={[{ flex: 1 }, fade]}>
        <BouncyFlatList
          data={classes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingTop: HEADER_H + insets.top + 8 }]}
          ListHeaderComponent={
            <View>
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
                  <HapticTouchable
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
                  </HapticTouchable>
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
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.xl,
    paddingBottom: spacing["3xl"],
    flexGrow: 1,
  },
  joinSection: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  joinTitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semiBold,
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
    fontFamily: fontFamily.regular,
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  joinBtnText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  feedback: { fontSize: fontSize.xs, marginTop: spacing.sm, fontFamily: fontFamily.regular },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
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
  cardName: { fontFamily: fontFamily.semiBold, fontSize: fontSize.sm },
  cardDesc: { fontSize: fontSize.xs, marginTop: 2, fontFamily: fontFamily.regular },
});
