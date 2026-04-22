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
import { registerApi } from "@/lib/api";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function RegisterScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const validate = useCallback(() => {
    const e: typeof errors = {};
    if (!fullName.trim()) e.fullName = "Vui lòng nhập họ tên";
    const trimmed = email.trim();
    if (!trimmed) {
      e.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      e.email = "Email không hợp lệ";
    }
    if (!password || password.length < 8) e.password = "Mật khẩu tối thiểu 8 ký tự";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [fullName, email, password]);

  async function handleRegister() {
    if (!validate()) return;
    setErrors({});
    setLoading(true);
    try {
      const res = await registerApi(email.trim(), password, fullName.trim());
      await signIn(res.accessToken, res.refreshToken, res.user, res.profile);
      router.replace("/(app)/onboarding");
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
    >
      <ScrollView
        style={[s.root, { backgroundColor: c.background }]}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.logoRow}>
          <Logo size="lg" />
        </View>

        {/* Mascot happy — tĩnh */}
        <View style={s.mascotWrap}>
          <Mascot name="happy" size={100} animation="none" />
        </View>

        <Text style={[s.headline, { color: c.foreground }]}>Tạo tài khoản mới</Text>
        <Text style={[s.sub, { color: c.mutedForeground }]}>
          Bắt đầu hành trình chinh phục VSTEP ngay hôm nay.
        </Text>

        <View style={[s.card, { backgroundColor: c.surface }]}>
          {errors.general && (
            <View style={[s.errorBanner, { backgroundColor: c.destructiveTint }]}>
              <Ionicons name="alert-circle-outline" size={16} color={c.destructive} />
              <Text style={[s.errorBannerText, { color: c.destructive }]}>{errors.general}</Text>
            </View>
          )}

          <View style={s.fieldGroup}>
            <Text style={[s.label, { color: c.foreground }]}>Họ và tên</Text>
            <View style={[s.inputWrap, { borderColor: errors.fullName ? c.destructive : fullName ? c.borderFocus : c.border }]}>
              <Ionicons name="person-outline" size={18} color={c.mutedForeground} />
              <TextInput
                style={[s.input, { color: c.foreground }]}
                placeholder="Nguyễn Văn A"
                placeholderTextColor={c.placeholder}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
            {errors.fullName && <Text style={[s.fieldError, { color: c.destructive }]}>{errors.fullName}</Text>}
          </View>

          <View style={s.fieldGroup}>
            <Text style={[s.label, { color: c.foreground }]}>Email</Text>
            <View style={[s.inputWrap, { borderColor: errors.email ? c.destructive : email ? c.borderFocus : c.border }]}>
              <Ionicons name="mail-outline" size={18} color={c.mutedForeground} />
              <TextInput
                style={[s.input, { color: c.foreground }]}
                placeholder="your@email.com"
                placeholderTextColor={c.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={[s.fieldError, { color: c.destructive }]}>{errors.email}</Text>}
          </View>

          <View style={s.fieldGroup}>
            <Text style={[s.label, { color: c.foreground }]}>Mật khẩu</Text>
            <View style={[s.inputWrap, { borderColor: errors.password ? c.destructive : password ? c.borderFocus : c.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={c.mutedForeground} />
              <TextInput
                style={[s.input, { color: c.foreground }]}
                placeholder="Tối thiểu 8 ký tự"
                placeholderTextColor={c.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={18} color={c.mutedForeground} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={[s.fieldError, { color: c.destructive }]}>{errors.password}</Text>}
          </View>

          <DepthButton onPress={handleRegister} fullWidth disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" size="small" /> : "Đăng ký"}
          </DepthButton>
        </View>

        <View style={s.footer}>
          <Text style={[s.footerText, { color: c.mutedForeground }]}>Đã có tài khoản? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={[s.footerLink, { color: c.primary }]}>Đăng nhập</Text>
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
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
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
  errorBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  errorBannerText: { fontSize: fontSize.sm, flex: 1 },
  fieldGroup: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 2, borderRadius: radius.lg, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, backgroundColor: "#FAFAFA" },
  input: { flex: 1, fontSize: fontSize.base, fontFamily: fontFamily.regular, minHeight: 28 },
  fieldError: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: fontSize.sm },
  footerLink: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
});
