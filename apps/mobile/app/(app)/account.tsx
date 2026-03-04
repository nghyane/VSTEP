import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { useAuth } from "@/hooks/use-auth";
import { HapticTouchable } from "@/components/HapticTouchable";
import { useChangePassword, useUpdateUser, useUser } from "@/hooks/use-user";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function AccountScreen() {
  const c = useThemeColors();
  const { user: authUser } = useAuth();
  const { data: userData, isLoading } = useUser(authUser?.id ?? "");

  if (isLoading) return <LoadingScreen />;

  const u = userData ?? authUser;
  if (!u) return null;

  return (
    <ScreenWrapper>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <UpdateInfoSection userId={u.id} fullName={u.fullName ?? ""} email={u.email} colors={c} />
        <ChangePasswordSection userId={u.id} colors={c} />
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
      <HapticTouchable style={[styles.saveBtn, { backgroundColor: c.primary, opacity: update.isPending ? 0.7 : 1 }]} onPress={handleSave} disabled={update.isPending}>
        <Text style={{ color: c.primaryForeground, fontWeight: "600" }}>{update.isPending ? "Đang lưu..." : "Lưu thay đổi"}</Text>
      </HapticTouchable>
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
      <HapticTouchable style={[styles.saveBtn, { backgroundColor: c.primary, opacity: changePw.isPending ? 0.7 : 1 }]} onPress={handleSubmit} disabled={changePw.isPending}>
        <Text style={{ color: c.primaryForeground, fontWeight: "600" }}>{changePw.isPending ? "Đang xử lý..." : "Đổi mật khẩu"}</Text>
      </HapticTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"], gap: spacing.xl },
  section: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.base, gap: spacing.md, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: "700" },
  field: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: "500" },
  input: { borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.base },
  saveBtn: { borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: "center" },
});
