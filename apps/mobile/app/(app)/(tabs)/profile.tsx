import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/use-auth";
import { useChangePassword, useUpdateUser, useUser } from "@/hooks/use-user";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";

export default function ProfileScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { user: authUser, signOut } = useAuth();
  const { data: userData, isLoading } = useUser(authUser?.id ?? "");

  if (isLoading) return <LoadingScreen />;

  const u = userData ?? authUser;
  if (!u) return null;

  const initials = (u.fullName ?? u.email)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => signOut() },
    ]);
  }

  return (
    <ScreenWrapper>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.foreground }]}>Hồ sơ cá nhân</Text>

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

      {/* Update Info */}
      <UpdateInfoSection userId={u.id} fullName={u.fullName ?? ""} email={u.email} colors={c} />

      {/* Change Password */}
      <ChangePasswordSection userId={u.id} colors={c} />

      {/* Navigation */}
      <TouchableOpacity
        style={[styles.navRow, { borderColor: c.border }]}
        onPress={() => router.push("/(app)/submissions")}
      >
        <Ionicons name="list" size={20} color={c.foreground} />
        <Text style={[styles.navText, { color: c.foreground }]}>Lịch sử bài nộp</Text>
        <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navRow, { borderColor: c.border }]}
        onPress={() => router.push("/(app)/onboarding")}
      >
        <Ionicons name="flag" size={20} color={c.foreground} />
        <Text style={[styles.navText, { color: c.foreground }]}>Mục tiêu học tập</Text>
        <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: c.destructive + "15" }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={c.destructive} />
        <Text style={[styles.logoutText, { color: c.destructive }]}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
    </ScreenWrapper>
  );
}

function UpdateInfoSection({ userId, fullName: initName, email: initEmail, colors: c }: { userId: string; fullName: string; email: string; colors: ReturnType<typeof useThemeColors> }) {
  const update = useUpdateUser(userId);
  const [fullName, setFullName] = useState(initName);
  const [email, setEmail] = useState(initEmail);

  function handleSave() {
    update.mutate({ fullName, email });
  }

  return (
    <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>Cập nhật thông tin</Text>
      <View style={styles.field}>
        <Text style={[styles.label, { color: c.foreground }]}>Họ và tên</Text>
        <TextInput style={[styles.input, { borderColor: c.border, color: c.foreground, backgroundColor: c.background }]} value={fullName} onChangeText={setFullName} />
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: c.foreground }]}>Email</Text>
        <TextInput style={[styles.input, { borderColor: c.border, color: c.foreground, backgroundColor: c.background }]} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </View>
      {update.isSuccess && <Text style={{ color: c.success, fontSize: fontSize.sm }}>Đã cập nhật</Text>}
      {update.isError && <Text style={{ color: c.destructive, fontSize: fontSize.sm }}>{update.error.message}</Text>}
      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: c.primary, opacity: update.isPending ? 0.7 : 1 }]} onPress={handleSave} disabled={update.isPending}>
        <Text style={{ color: c.primaryForeground, fontWeight: "600" }}>{update.isPending ? "Đang lưu..." : "Lưu thay đổi"}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ChangePasswordSection({ userId, colors: c }: { userId: string; colors: ReturnType<typeof useThemeColors> }) {
  const changePw = useChangePassword(userId);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  function handleSubmit() {
    setValidationError("");
    if (newPassword.length < 8) { setValidationError("Mật khẩu mới phải có ít nhất 8 ký tự"); return; }
    if (newPassword !== confirmPassword) { setValidationError("Mật khẩu xác nhận không khớp"); return; }
    changePw.mutate({ currentPassword, newPassword }, {
      onSuccess: () => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); },
    });
  }

  return (
    <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>Đổi mật khẩu</Text>
      <View style={styles.field}>
        <Text style={[styles.label, { color: c.foreground }]}>Mật khẩu hiện tại</Text>
        <TextInput style={[styles.input, { borderColor: c.border, color: c.foreground, backgroundColor: c.background }]} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: c.foreground }]}>Mật khẩu mới</Text>
        <TextInput style={[styles.input, { borderColor: c.border, color: c.foreground, backgroundColor: c.background }]} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: c.foreground }]}>Xác nhận mật khẩu</Text>
        <TextInput style={[styles.input, { borderColor: c.border, color: c.foreground, backgroundColor: c.background }]} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      </View>
      {validationError ? <Text style={{ color: c.destructive, fontSize: fontSize.sm }}>{validationError}</Text> : null}
      {changePw.isSuccess && <Text style={{ color: c.success, fontSize: fontSize.sm }}>Đã đổi mật khẩu</Text>}
      {changePw.isError && <Text style={{ color: c.destructive, fontSize: fontSize.sm }}>{changePw.error.message}</Text>}
      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: c.primary, opacity: changePw.isPending ? 0.7 : 1 }]} onPress={handleSubmit} disabled={changePw.isPending}>
        <Text style={{ color: c.primaryForeground, fontWeight: "600" }}>{changePw.isPending ? "Đang xử lý..." : "Đổi mật khẩu"}</Text>
      </TouchableOpacity>
    </View>
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
  section: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: "700" },
  field: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: "500" },
  input: { borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.base },
  saveBtn: { borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: "center" },
  navRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, paddingVertical: spacing.base },
  navText: { flex: 1, fontSize: fontSize.sm, fontWeight: "500" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.lg, paddingVertical: spacing.base },
  logoutText: { fontSize: fontSize.sm, fontWeight: "600" },
});
