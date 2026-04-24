import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { HapticTouchable } from "@/components/HapticTouchable";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/use-auth";
import { useUser, useUploadAvatar } from "@/hooks/use-user";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";
import { useHaptics } from "@/contexts/HapticsContext";

const STORAGE_URL = process.env.EXPO_PUBLIC_STORAGE_URL ?? "";

function showComingSoon() {
  Alert.alert("Thông báo", "Tính năng đang phát triển");
}

export default function ProfileScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { user: authUser, signOut } = useAuth();
  const { data: userData, isLoading } = useUser(authUser?.id ?? "");
  const uploadAvatar = useUploadAvatar(authUser?.id ?? "");
  const { enabled: hapticsEnabled, setEnabled: setHapticsEnabled, trigger } = useHaptics();

  if (isLoading) return <LoadingScreen />;

  const u = userData ?? authUser;
  if (!u) return null;

  const initials = (u.fullName ?? u.email ?? "")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const avatarUri = userData?.avatarKey && STORAGE_URL
    ? `${STORAGE_URL}/${userData.avatarKey}`
    : null;

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Quyền truy cập", "Cần quyền truy cập thư viện ảnh để đổi avatar");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const ext = asset.uri.split(".").pop() ?? "jpg";
    uploadAvatar.mutate({
      uri: asset.uri,
      name: `avatar.${ext}`,
      type: asset.mimeType ?? `image/${ext}`,
    });
  }

  function handleLogout() {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => signOut() },
    ]);
  }

  return (
    <ScreenWrapper>
    <BouncyScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.foreground }]}>Tài khoản</Text>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <HapticTouchable onPress={handlePickAvatar} activeOpacity={0.7}>
          <View style={[styles.avatarWrap, { backgroundColor: c.primary + "18" }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: c.primary }]}>{initials}</Text>
            )}
            {uploadAvatar.isPending ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <View style={[styles.avatarBadge, { backgroundColor: c.primary }]}>
                <Ionicons name="camera" size={14} color={c.primaryForeground} />
              </View>
            )}
          </View>
        </HapticTouchable>
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
            style={styles.row}
            onPress={() => router.push("/(app)/onboarding")}
          >
            <Ionicons name="navigate-outline" size={20} color={c.primary} />
            <Text style={[styles.rowText, { color: c.primary }]}>Đặt lại mục tiêu học tập</Text>
          </HapticTouchable>
          <HapticTouchable style={[styles.row, { borderBottomColor: c.border }]} onPress={() => router.push("/(app)/courses/" as any)}>
            <Ionicons name="school-outline" size={20} color={c.primary} />
            <Text style={[styles.rowText, { color: c.primary }]}>Khóa học cấp tốc</Text>
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
    </BouncyScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  title: { fontSize: fontSize["2xl"], fontFamily: fontFamily.bold, textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.sm },
  avatarSection: { alignItems: "center", gap: spacing.sm },
  avatarWrap: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center" },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarText: { fontSize: fontSize["3xl"], fontFamily: fontFamily.bold },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", borderRadius: 45 },
  avatarBadge: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  name: { fontSize: fontSize.xl, fontFamily: fontFamily.bold },
  email: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, marginBottom: spacing.sm },
  section: { gap: spacing.sm, marginTop: spacing.lg },
  sectionHeader: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, letterSpacing: 0.5, paddingLeft: spacing.xs, marginBottom: spacing.xs },
  card: { borderWidth: 1, borderRadius: radius.xl, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.base, paddingVertical: spacing.base, borderBottomWidth: 1 },
  rowLast: { borderBottomWidth: 0 },
  rowText: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  version: { fontSize: fontSize.xs, textAlign: "center", marginTop: spacing.sm, fontFamily: fontFamily.regular },
});
