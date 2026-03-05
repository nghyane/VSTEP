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

function showComingSoon() {
  Alert.alert("Thông báo", "Tính năng đang phát triển");
}

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
      <Text style={[styles.title, { color: c.foreground }]}>Tài khoản</Text>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: c.primary + "18" }]}>
          <Text style={[styles.avatarText, { color: c.primary }]}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: c.foreground }]}>{u.fullName ?? "Chưa đặt tên"}</Text>
        <Text style={[styles.email, { color: c.mutedForeground }]}>{u.email}</Text>
      </View>

      {/* TÀI KHOẢN */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: c.primary }]}>TÀI KHOẢN</Text>
        <View style={[styles.card, { borderColor: c.border }]}>
          <HapticTouchable
            style={[styles.row, { borderColor: c.border }]}
            onPress={() => { router.push("/(app)/account"); }}
          >
            <Ionicons name="person-outline" size={20} color={c.foreground} />
            <Text style={[styles.rowText, { color: c.foreground }]}>Hồ sơ</Text>
            <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
          </HapticTouchable>
          <HapticTouchable
            style={[styles.row, styles.rowLast]}
            onPress={() => { router.push("/(app)/account"); }}
          >
            <Ionicons name="lock-closed-outline" size={20} color={c.foreground} />
            <Text style={[styles.rowText, { color: c.foreground }]}>Đổi mật khẩu</Text>
            <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
          </HapticTouchable>
        </View>
      </View>

      {/* HỌC TẬP */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: c.primary }]}>HỌC TẬP</Text>
        <View style={[styles.card, { borderColor: c.border }]}>
          <HapticTouchable
            style={[styles.row, { borderColor: c.border }]}
            onPress={() => { router.push("/(app)/submissions"); }}
          >
            <Ionicons name="list-outline" size={20} color={c.foreground} />
            <Text style={[styles.rowText, { color: c.foreground }]}>Lịch sử bài nộp</Text>
            <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
          </HapticTouchable>
          <HapticTouchable
            style={[styles.row, styles.rowLast]}
            onPress={() => { router.push("/(app)/goal"); }}
          >
            <Ionicons name="flag-outline" size={20} color={c.foreground} />
            <Text style={[styles.rowText, { color: c.foreground }]}>Mục tiêu học tập</Text>
            <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
          </HapticTouchable>
        </View>
      </View>

      {/* CÀI ĐẶT */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: c.primary }]}>CÀI ĐẶT</Text>
        <View style={[styles.card, { borderColor: c.border }]}>
          <View style={[styles.row, { borderColor: c.border }]}>
            <Ionicons name="phone-portrait-outline" size={20} color={c.foreground} />
            <Text style={[styles.rowText, { color: c.foreground }]}>Rung khi chạm</Text>
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
          <HapticTouchable
            style={[styles.row, { borderColor: c.border }]}
            onPress={showComingSoon}
          >
            <Ionicons name="document-text-outline" size={20} color={c.foreground} />
            <Text style={[styles.rowText, { color: c.foreground }]}>Điều khoản & Điều kiện</Text>
            <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
          </HapticTouchable>
          <HapticTouchable
            style={[styles.row, { borderColor: c.border }]}
            onPress={showComingSoon}
          >
            <Ionicons name="shield-outline" size={20} color={c.foreground} />
            <Text style={[styles.rowText, { color: c.foreground }]}>Chính sách bảo mật</Text>
            <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
          </HapticTouchable>
          <HapticTouchable
            style={[styles.row, { borderColor: c.border }]}
            onPress={showComingSoon}
          >
            <Ionicons name="headset-outline" size={20} color={c.foreground} />
            <Text style={[styles.rowText, { color: c.foreground }]}>Liên hệ/ Hỗ trợ</Text>
            <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
          </HapticTouchable>
          <HapticTouchable
            style={[styles.row, styles.rowLast]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={c.destructive} />
            <Text style={[styles.rowText, { color: c.destructive }]}>Đăng xuất</Text>
          </HapticTouchable>
        </View>
      </View>

      <Text style={[styles.version, { color: c.mutedForeground }]}>Phiên bản 1.0.0</Text>
    </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.lg },
  title: { fontSize: fontSize["2xl"], fontWeight: "700", textAlign: "center" },
  avatarSection: { alignItems: "center", gap: spacing.sm },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: fontSize["3xl"], fontWeight: "700" },
  name: { fontSize: fontSize.xl, fontWeight: "700" },
  email: { fontSize: fontSize.sm },
  section: { gap: spacing.sm },
  sectionHeader: { fontSize: fontSize.xs, fontWeight: "700", letterSpacing: 0.5, paddingLeft: spacing.xs },
  card: { borderWidth: 1, borderRadius: radius.xl, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.base, paddingVertical: spacing.base, borderBottomWidth: 1 },
  rowLast: { borderBottomWidth: 0 },
  rowText: { flex: 1, fontSize: fontSize.sm, fontWeight: "500" },
  version: { fontSize: fontSize.xs, textAlign: "center", marginTop: spacing.sm },
});
