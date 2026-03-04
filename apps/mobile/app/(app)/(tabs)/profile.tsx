import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/hooks/use-user";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import { useHaptics } from "@/contexts/HapticsContext";

export default function ProfileScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { user: authUser, signOut } = useAuth();
  const { data: userData, isLoading } = useUser(authUser?.id ?? "");
  const { enabled: hapticsEnabled, setEnabled: setHapticsEnabled, trigger } = useHaptics();

  if (isLoading) return <LoadingScreen />;

  const u = userData ?? authUser;
  if (!u) return null;

  const initials = (u.fullName ?? u.email)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleLogout() {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => signOut() },
    ]);
  }

  return (
    <ScreenWrapper>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.foreground }]}>Hồ sơ & Cài đặt</Text>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: c.primary + "18" }]}>
          <Text style={[styles.avatarText, { color: c.primary }]}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: c.foreground }]}>{u.fullName ?? "Chưa đặt tên"}</Text>
        <Text style={[styles.email, { color: c.mutedForeground }]}>{u.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: c.primary + "18" }]}>
          <Text style={{ color: c.primary, fontSize: fontSize.xs, fontWeight: "600" }}>Người học</Text>
        </View>
      </View>

      {/* Navigation rows */}
      <View style={[styles.navGroup, { borderColor: c.border }]}>
        <HapticTouchable
          style={[styles.navRow, { borderColor: c.border }]}
          onPress={() => { router.push("/(app)/account"); }}
        >
          <Ionicons name="shield-checkmark" size={20} color={c.foreground} />
          <Text style={[styles.navText, { color: c.foreground }]}>Tài khoản & Bảo mật</Text>
          <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
        </HapticTouchable>

        <HapticTouchable
          style={[styles.navRow, { borderColor: c.border }]}
          onPress={() => { router.push("/(app)/submissions"); }}
        >
          <Ionicons name="list" size={20} color={c.foreground} />
          <Text style={[styles.navText, { color: c.foreground }]}>Lịch sử bài nộp</Text>
          <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
        </HapticTouchable>

        <HapticTouchable
          style={[styles.navRow, styles.navRowLast, { borderColor: c.border }]}
          onPress={() => { router.push("/(app)/goal"); }}
        >
          <Ionicons name="flag" size={20} color={c.foreground} />
          <Text style={[styles.navText, { color: c.foreground }]}>Mục tiêu học tập</Text>
          <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
        </HapticTouchable>
      </View>

      {/* Settings */}
      <View style={[styles.navGroup, { borderColor: c.border }]}>
        <View style={[styles.navRow, styles.navRowLast, { borderColor: c.border }]}>
          <Ionicons name="phone-portrait-outline" size={20} color={c.foreground} />
          <Text style={[styles.navText, { color: c.foreground }]}>Rung khi chạm</Text>
          <Switch
            value={hapticsEnabled}
            onValueChange={(v) => {
              setHapticsEnabled(v);
              if (v) trigger();
            }}
            trackColor={{ false: c.muted, true: c.primary + "60" }}
            thumbColor={hapticsEnabled ? c.primary : c.mutedForeground}
          />
        </View>
      </View>

      <HapticTouchable style={[styles.logoutBtn, { backgroundColor: c.destructive + "15" }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={c.destructive} />
        <Text style={[styles.logoutText, { color: c.destructive }]}>Đăng xuất</Text>
      </HapticTouchable>
    </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.xl },
  title: { fontSize: fontSize["2xl"], fontWeight: "700" },
  avatarSection: { alignItems: "center", gap: spacing.sm },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: fontSize["2xl"], fontWeight: "700" },
  name: { fontSize: fontSize.xl, fontWeight: "700" },
  email: { fontSize: fontSize.sm },
  roleBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  navGroup: { borderWidth: 1, borderRadius: radius.xl, overflow: "hidden" },
  navRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.base, paddingVertical: spacing.base, borderBottomWidth: 1 },
  navRowLast: { borderBottomWidth: 0 },
  navText: { flex: 1, fontSize: fontSize.sm, fontWeight: "500" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.lg, paddingVertical: spacing.base },
  logoutText: { fontSize: fontSize.sm, fontWeight: "600" },
});
