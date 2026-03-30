import { useRef, useState } from "react";
import { Animated, StyleSheet, Text, TextInput, View, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFadeIn } from "@/hooks/use-fade-in";
import { HapticTouchable } from "@/components/HapticTouchable";
import { GradientBackground } from "@/components/GradientBackground";
import { StickyHeader, HEADER_H } from "@/components/StickyHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { EmptyState } from "@/components/EmptyState";
import { useClasses, useJoinClass } from "@/hooks/use-classes";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import type { ClassItem } from "@/types/api";

export default function ClassesTab() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fade0 = useFadeIn(0);
  const fade1 = useFadeIn(100);

  const { data, isLoading, error, refetch } = useClasses();
  const joinMutation = useJoinClass();
  const [code, setCode] = useState("");
  const [joinMsg, setJoinMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleJoin() {
    if (!code.trim()) return;
    setJoinMsg(null);
    try {
      const res = await joinMutation.mutateAsync(code.trim());
      setJoinMsg({ text: `Đã tham gia lớp ${res.className}`, ok: true });
      setCode("");
    } catch (err: any) {
      setJoinMsg({ text: err.message ?? "Không thể tham gia lớp", ok: false });
    }
  }

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} onRetry={refetch} />;

  const classes = data?.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <GradientBackground />
      <StickyHeader scrollY={scrollY} />
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: HEADER_H + insets.top + 8, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        {/* Join class */}
        <Animated.View style={fade0}>
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.cardTitle, { color: c.foreground }]}>Tham gia lớp học</Text>
            <View style={styles.joinRow}>
              <TextInput
                style={[styles.input, { backgroundColor: c.muted, color: c.foreground, borderColor: c.border }]}
                placeholder="Nhập mã mời..."
                placeholderTextColor={c.mutedForeground}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
              <HapticTouchable
                style={[styles.joinBtn, { backgroundColor: c.primary, opacity: joinMutation.isPending ? 0.6 : 1 }]}
                onPress={handleJoin}
                disabled={joinMutation.isPending || !code.trim()}
              >
                <Ionicons name="enter-outline" size={18} color={c.primaryForeground} />
              </HapticTouchable>
            </View>
            {joinMsg && (
              <Text style={{ color: joinMsg.ok ? c.success : c.destructive, fontSize: fontSize.xs, marginTop: spacing.xs }}>
                {joinMsg.text}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Class list */}
        <Animated.View style={fade1}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Lớp học của tôi</Text>
          {classes.length === 0 ? (
            <EmptyState icon="people-outline" title="Chưa tham gia lớp nào" subtitle="Nhập mã mời để tham gia lớp học" />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {classes.map((cls) => (
                <ClassCard key={cls.id} item={cls} onPress={() => router.push(`/(app)/classes/${cls.id}`)} />
              ))}
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

function ClassCard({ item, onPress }: { item: ClassItem; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <HapticTouchable style={[styles.classCard, { backgroundColor: c.card, borderColor: c.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.classIcon, { backgroundColor: c.primary + "15" }]}>
        <Ionicons name="school-outline" size={22} color={c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.foreground, fontWeight: "600", fontSize: fontSize.sm }} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={{ color: c.mutedForeground, fontSize: fontSize.xs }} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
    </HapticTouchable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, gap: spacing.base },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.sm },
  cardTitle: { fontWeight: "700", fontSize: fontSize.base },
  joinRow: { flexDirection: "row", gap: spacing.sm },
  input: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.sm },
  joinBtn: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontWeight: "700", fontSize: fontSize.lg, marginTop: spacing.sm },
  classCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.base },
  classIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
