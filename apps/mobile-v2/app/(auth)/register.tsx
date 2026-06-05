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
import { HapticTouchable } from "@/components/HapticTouchable";
import { Mascot } from "@/components/Mascot";
import { ApiError, checkEmailApi, googleLoginApi, registerApi } from "@/lib/api";
import { getGoogleAuthUnavailableReason, signInWithGoogle } from "@/lib/google-auth";
import { showWelcomeGift } from "@/features/onboarding/welcome-gift-store";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

function targetDeadlineFromNow(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  return date.toISOString().slice(0, 10);
}

const LEARNER_ROLE = "learner";

export default function RegisterScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, signOut, setSuggestedNickname } = useAuth();
  const googleUnavailableReason = getGoogleAuthUnavailableReason();
  const googleReady = !googleUnavailableReason;
  const googleUnavailableHint = googleUnavailableReason?.includes("Expo Go") ? null : googleUnavailableReason;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const validate = useCallback(() => {
    const e: typeof errors = {};
    if (!fullName.trim()) e.fullName = "Vui lòng nhập tên hồ sơ";
    const trimmed = email.trim();
    if (!trimmed) {
      e.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      e.email = "Email không hợp lệ";
    }
    if (!password || password.length < 8) {
      e.password = "Mật khẩu tối thiểu 8 ký tự";
    } else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      e.password = "Mật khẩu phải có cả chữ hoa và chữ thường";
    } else if (!/\d/.test(password)) {
      e.password = "Mật khẩu phải có ít nhất một chữ số";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [fullName, email, password]);

  async function handleRegister() {
    if (!validate()) return;
    setErrors({});
    setLoading(true);
    try {
      const emailStatus = await checkEmailApi(email.trim());
      if (!emailStatus.available) {
        setErrors({ email: "Email này đã được sử dụng" });
        return;
      }
      const res = await registerApi(email.trim(), password, fullName.trim(), "B2", targetDeadlineFromNow());
      await signIn(res.accessToken, res.refreshToken, res.user, res.profile);
      if (res.onboardingBonus?.granted) {
        showWelcomeGift(res.onboardingBonus.amount);
      }
      router.replace("/(app)/(tabs)");
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Đã xảy ra lỗi. Thử lại." });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleRegister() {
    setErrors({});
    setGoogleLoading(true);
    try {
      const auth = await signInWithGoogle();
      if (auth.status === "cancel") return;
      if (auth.status === "error") {
        setErrors({ general: auth.message });
        return;
      }

      const res = await googleLoginApi(auth.idToken);
      if (res.user.role !== LEARNER_ROLE) {
        await signOut();
        setErrors({ general: "Ứng dụng mobile hiện chỉ hỗ trợ tài khoản learner." });
        return;
      }

      await signIn(res.accessToken, res.refreshToken, res.user, res.profile);
      if (res.needsOnboarding || !res.profile) {
        setSuggestedNickname(res.suggestedNickname);
        router.replace("/(app)/onboarding");
        return;
      }

      setSuggestedNickname(null);
      router.replace("/(app)/(tabs)");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const body = err.body as { message?: string } | null;
        setErrors({ general: body?.message ?? "Email này đã được đăng ký. Vui lòng đăng nhập bằng mật khẩu." });
      } else {
        setErrors({ general: err instanceof Error ? err.message : "Đăng ký Google thất bại." });
      }
    } finally {
      setGoogleLoading(false);
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

          <HapticTouchable
            onPress={handleGoogleRegister}
            disabled={googleLoading || loading || !googleReady}
            style={[
              s.googleButton,
              {
                backgroundColor: googleReady ? c.surface : c.muted,
                borderColor: googleReady ? c.border : c.borderLight,
                borderBottomColor: googleReady ? c.mutedForeground : c.border,
                opacity: googleLoading || loading ? 0.75 : 1,
              },
            ]}
          >
            {googleLoading ? (
              <ActivityIndicator color={c.foreground} size="small" />
            ) : (
              <>
                <View style={[s.googleIconWrap, { backgroundColor: c.background }]}>
                  <Text style={[s.googleIconText, { color: c.foreground }]}>G</Text>
                </View>
                <Text style={[s.googleButtonText, { color: googleReady ? c.foreground : c.subtle }]}>Đăng ký với Google</Text>
              </>
            )}
          </HapticTouchable>

          {googleUnavailableHint ? <Text style={[s.fieldHint, { color: c.warning }]}>{googleUnavailableHint}</Text> : null}

          <View style={s.dividerRow}>
            <View style={[s.divider, { backgroundColor: c.border }]} />
            <Text style={[s.dividerText, { color: c.subtle }]}>hoặc</Text>
            <View style={[s.divider, { backgroundColor: c.border }]} />
          </View>

          <View style={s.fieldGroup}>
            <Text style={[s.label, { color: c.foreground }]}>Tên hồ sơ</Text>
            <View style={[s.inputWrap, { borderColor: errors.fullName ? c.destructive : fullName ? c.borderFocus : c.border }]}>
              <Ionicons name="person-outline" size={18} color={c.mutedForeground} />
              <TextInput
                style={[s.input, { color: c.foreground }]}
                placeholder="Tên bạn muốn dùng"
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
                placeholder="≥8 ký tự, có chữ hoa, chữ thường, số"
                placeholderTextColor={c.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="new-password"
                textContentType="newPassword"
                importantForAutofill="yes"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={18} color={c.mutedForeground} />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={[s.fieldError, { color: c.destructive }]}>{errors.password}</Text>
            ) : (
              <Text style={[s.fieldHint, { color: c.mutedForeground }]}>Tối thiểu 8 ký tự, có chữ hoa, chữ thường và chữ số.</Text>
            )}
          </View>

          <DepthButton onPress={handleRegister} fullWidth disabled={loading || googleLoading}>
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
  errorBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  errorBannerText: { fontSize: fontSize.sm, flex: 1 },
  googleButton: {
    minHeight: 54,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconText: { fontSize: fontSize.base, fontFamily: fontFamily.extraBold },
  googleButtonText: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  fieldGroup: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 2, borderRadius: radius.lg, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, backgroundColor: "#FAFAFA" },
  input: { flex: 1, fontSize: fontSize.base, fontFamily: fontFamily.regular, minHeight: 28 },
  fieldError: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  fieldHint: { fontSize: fontSize.xs, fontFamily: fontFamily.regular },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: fontSize.sm },
  footerLink: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
});
