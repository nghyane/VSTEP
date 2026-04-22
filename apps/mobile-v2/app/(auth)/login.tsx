import { useState, useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/Logo";
import { DepthButton } from "@/components/DepthButton";
import { Mascot } from "@/components/Mascot";
import { loginApi } from "@/lib/api";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function LoginScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = useCallback(() => {
    const e: typeof errors = {};
    const trimmed = email.trim();
    if (!trimmed) {
      e.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      e.email = "Email không hợp lệ";
    }
    if (!password) e.password = "Vui lòng nhập mật khẩu";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [email, password]);

  async function handleLogin() {
    if (!validate()) return;
    setErrors({});
    setLoading(true);
    try {
      const res = await loginApi(email.trim(), password);
      await signIn(res.accessToken, res.refreshToken, res.user, res.profile);
      if (!res.profile || res.profile.isInitialProfile) {
        router.replace("/(app)/onboarding");
      } else {
        router.replace("/(app)/(tabs)");
      }
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Đã xảy ra lỗi. Thử lại." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={[s.root, { backgroundColor: c.background }]}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={s.logoRow}>
          <Logo size="lg" />
        </View>

        {/* Mascot — wave, tĩnh, size vừa */}
        <View style={s.mascotWrap}>
          <Mascot name="wave" size={110} animation="none" />
        </View>

        <Text style={[s.headline, { color: c.foreground }]}>Chào mừng trở lại!</Text>
        <Text style={[s.sub, { color: c.mutedForeground }]}>
          Đăng nhập để tiếp tục hành trình VSTEP của bạn.
        </Text>

        {/* Form */}
        <View style={[s.card, { backgroundColor: c.surface }]}>
          {errors.general && (
            <View style={[s.errorBanner, { backgroundColor: c.destructiveTint }]}>
              <Ionicons name="alert-circle-outline" size={16} color={c.destructive} />
              <Text style={[s.errorBannerText, { color: c.destructive }]}>{errors.general}</Text>
            </View>
          )}

          <View style={s.fieldGroup}>
            <Text style={[s.label, { color: c.foreground }]}>Email</Text>
            <View
              style={[
                s.inputWrap,
                { borderColor: errors.email ? c.destructive : email ? c.borderFocus : c.border },
              ]}
            >
              <Ionicons name="mail-outline" size={18} color={c.mutedForeground} />
              <TextInput
                style={[s.input, { color: c.foreground }]}
                placeholder="your@email.com"
                placeholderTextColor={c.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            {errors.email && <Text style={[s.fieldError, { color: c.destructive }]}>{errors.email}</Text>}
          </View>

          <View style={s.fieldGroup}>
            <Text style={[s.label, { color: c.foreground }]}>Mật khẩu</Text>
            <View
              style={[
                s.inputWrap,
                { borderColor: errors.password ? c.destructive : password ? c.borderFocus : c.border },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={18} color={c.mutedForeground} />
              <TextInput
                style={[s.input, { color: c.foreground }]}
                placeholder="Nhập mật khẩu..."
                placeholderTextColor={c.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons
                  name={showPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={c.mutedForeground}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={[s.fieldError, { color: c.destructive }]}>{errors.password}</Text>
            )}
          </View>

          <DepthButton onPress={handleLogin} fullWidth disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" size="small" /> : "Đăng nhập"}
          </DepthButton>
        </View>

        <View style={s.footer}>
          <Text style={[s.footerText, { color: c.mutedForeground }]}>Chưa có tài khoản? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={[s.footerLink, { color: c.primary }]}>Đăng ký</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={{ height: insets.bottom + spacing["2xl"] }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  logoRow: { alignItems: "center", marginBottom: spacing.base },
  mascotWrap: { alignItems: "center", marginBottom: spacing.base },
  headline: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center", marginBottom: spacing.xs },
  sub: { fontSize: fontSize.sm, textAlign: "center", lineHeight: 20, marginBottom: spacing.xl },
  card: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius["2xl"],
    borderColor: "#E5E5E5",
    borderBottomColor: "#CACACA",
    padding: spacing.xl,
    gap: spacing.base,
    marginBottom: spacing.lg,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  errorBannerText: { fontSize: fontSize.sm, flex: 1 },
  fieldGroup: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 2,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: "#FAFAFA",
  },
  input: { flex: 1, fontSize: fontSize.base, fontFamily: fontFamily.regular, minHeight: 28 },
  fieldError: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: fontSize.sm },
  footerLink: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
});
