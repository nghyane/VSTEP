import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DepthButton } from "@/components/DepthButton";
import { Logo } from "@/components/Logo";
import { ApiError, requestPasswordResetApi } from "@/lib/api";
import { fontFamily, fontSize, radius, spacing, useThemeColors } from "@/theme";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body as { message?: string; errors?: { email?: string[] } } | null;
    return body?.errors?.email?.[0] ?? body?.message ?? "Không gửi được email đặt lại mật khẩu.";
  }
  return "Không gửi được email đặt lại mật khẩu.";
}

export default function ForgotPasswordScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await requestPasswordResetApi(email.trim());
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={[s.root, { backgroundColor: c.background }]}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.logoRow}><Logo size="lg" /></View>
        <Text style={[s.headline, { color: c.foreground }]}>Quên mật khẩu</Text>
        <Text style={[s.sub, { color: c.subtle }]}>Nhập email để nhận liên kết đặt lại mật khẩu.</Text>

        <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border, borderBottomColor: c.border }]}>
          {sent ? (
            <>
              <View style={[s.successBox, { backgroundColor: c.primaryTint }]}>
                <Text style={[s.successText, { color: c.primary }]}>Nếu email tồn tại, hệ thống đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.</Text>
              </View>
              <DepthButton fullWidth onPress={() => router.replace("/(auth)/login")}>Quay lại đăng nhập</DepthButton>
            </>
          ) : (
            <>
              <View style={s.fieldGroup}>
                <Text style={[s.label, { color: c.foreground }]}>Email</Text>
                <View style={[s.inputWrap, { borderColor: c.border, backgroundColor: c.background }]}>
                  <Ionicons name="mail-outline" size={18} color={c.mutedForeground} />
                  <TextInput
                    style={[s.input, { color: c.foreground }]}
                    placeholder="email@example.com"
                    placeholderTextColor={c.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>
              {error ? <Text style={[s.errorText, { color: c.destructive, backgroundColor: c.destructiveTint }]}>{error}</Text> : null}
              <DepthButton fullWidth onPress={handleSubmit} disabled={submitting || !email.trim()}>
                {submitting ? <ActivityIndicator color={c.primaryForeground} size="small" /> : "Gửi email đặt lại mật khẩu"}
              </DepthButton>
            </>
          )}
        </View>

        <View style={s.footer}>
          <Text style={[s.footerText, { color: c.mutedForeground }]}>Nhớ mật khẩu? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity><Text style={[s.footerLink, { color: c.primary }]}>Đăng nhập</Text></TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  logoRow: { alignItems: "center", marginBottom: spacing.xl },
  headline: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center", marginBottom: spacing.xs },
  sub: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20, marginBottom: spacing.xl },
  card: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius["2xl"], padding: spacing.xl, gap: spacing.base, marginBottom: spacing.lg },
  fieldGroup: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 2, borderRadius: radius.lg, paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  input: { flex: 1, fontSize: fontSize.base, fontFamily: fontFamily.regular, minHeight: 28 },
  errorText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, textAlign: "center", borderRadius: radius.button, padding: spacing.sm },
  successBox: { borderRadius: radius.button, padding: spacing.md },
  successText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold, textAlign: "center", lineHeight: 20 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: fontSize.sm },
  footerLink: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
});
