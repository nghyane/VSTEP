import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { Logo } from "@/components/Logo";
import { ApiError, resetPasswordApi } from "@/lib/api";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body as { message?: string; errors?: { email?: string[]; password?: string[]; newPassword?: string[] } } | null;
    return body?.errors?.password?.[0] ?? body?.errors?.newPassword?.[0] ?? body?.errors?.email?.[0] ?? body?.message ?? "Không đặt lại được mật khẩu.";
  }
  return "Không đặt lại được mật khẩu.";
}

export default function ResetPasswordScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; token?: string }>();
  const email = params.email ?? "";
  const token = params.token ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (password !== confirm) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await resetPasswordApi({ email, token, password, passwordConfirmation: confirm });
      setCompleted(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const invalid = !email || !token;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={[s.root, { backgroundColor: c.background }]}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.logoRow}><Logo size="lg" /></View>
        {invalid ? (
          <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border, borderBottomColor: c.border }]}>
            <Text style={[s.headline, { color: c.foreground }]}>Liên kết không hợp lệ</Text>
            <Text style={[s.sub, { color: c.subtle }]}>Vui lòng yêu cầu email đặt lại mật khẩu mới.</Text>
            <DepthButton fullWidth onPress={() => router.replace("/(auth)/forgot-password")}>Gửi lại email</DepthButton>
          </View>
        ) : completed ? (
          <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border, borderBottomColor: c.border }]}>
            <Text style={[s.headline, { color: c.foreground }]}>Đã đổi mật khẩu</Text>
            <Text style={[s.sub, { color: c.subtle }]}>Bạn có thể đăng nhập bằng mật khẩu mới.</Text>
            <DepthButton fullWidth onPress={() => router.replace("/(auth)/login")}>Đăng nhập</DepthButton>
          </View>
        ) : (
          <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border, borderBottomColor: c.border }]}>
            <Text style={[s.headline, { color: c.foreground }]}>Đặt lại mật khẩu</Text>
            <Text style={[s.sub, { color: c.subtle }]}>Tạo mật khẩu mới cho {email}.</Text>
            <PasswordField label="Mật khẩu mới" value={password} onChangeText={setPassword} show={showPassword} onToggleShow={() => setShowPassword((v) => !v)} />
            <PasswordField label="Nhập lại mật khẩu" value={confirm} onChangeText={setConfirm} show={showPassword} onToggleShow={() => setShowPassword((v) => !v)} />
            {error ? <Text style={[s.errorText, { color: c.destructive, backgroundColor: c.destructiveTint }]}>{error}</Text> : null}
            <DepthButton fullWidth onPress={handleSubmit} disabled={submitting || password.length < 8 || !confirm}>
              {submitting ? <ActivityIndicator color={c.primaryForeground} size="small" /> : "Đổi mật khẩu"}
            </DepthButton>
          </View>
        )}
        <View style={s.footer}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity><Text style={[s.footerLink, { color: c.primary }]}>Quay lại đăng nhập</Text></TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PasswordField({ label, value, onChangeText, show, onToggleShow }: { label: string; value: string; onChangeText: (value: string) => void; show: boolean; onToggleShow: () => void }) {
  const c = useThemeColors();
  return (
    <View style={s.fieldGroup}>
      <Text style={[s.label, { color: c.foreground }]}>{label}</Text>
      <View style={[s.inputWrap, { borderColor: c.border, backgroundColor: c.background }]}>
        <Ionicons name="lock-closed-outline" size={18} color={c.mutedForeground} />
        <TextInput
          style={[s.input, { color: c.foreground }]}
          placeholder="≥8 ký tự, có chữ hoa, chữ thường, số"
          placeholderTextColor={c.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="new-password"
          textContentType="newPassword"
          importantForAutofill="yes"
        />
        <TouchableOpacity onPress={onToggleShow}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color={c.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  logoRow: { alignItems: "center", marginBottom: spacing.xl },
  headline: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center", marginBottom: spacing.xs },
  sub: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20, marginBottom: spacing.lg },
  card: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius["2xl"], padding: spacing.xl, gap: spacing.base, marginBottom: spacing.lg },
  fieldGroup: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 2, borderRadius: radius.lg, paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  input: { flex: 1, fontSize: fontSize.base, fontFamily: fontFamily.regular, minHeight: 28 },
  errorText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, textAlign: "center", borderRadius: radius.button, padding: spacing.sm },
  footer: { alignItems: "center" },
  footerLink: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
});
