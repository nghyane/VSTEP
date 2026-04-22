import { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "@/components/HapticTouchable";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/Logo";
import { DepthButton } from "@/components/DepthButton";
import { Mascot } from "@/components/Mascot";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
import { loginApi } from "@/lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const c = useThemeColors();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    if (!password) {
      e.password = "Vui lòng nhập mật khẩu";
    }
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
      router.replace("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <BouncyScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Mascot name="wave" size={100} animation="bounce" />
          <Text style={[styles.heading, { color: c.foreground }]}>
            Tham gia vào VSTEP
          </Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            Nền tảng luyện thi thông minh
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.foreground }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.card, borderColor: errors.email ? c.destructive : c.border, color: c.foreground }]}
              placeholder="Hãy nhập email"
              placeholderTextColor={c.mutedForeground}
              value={email}
              onChangeText={(t) => { setEmail(t); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {errors.email ? <Text style={[styles.fieldError, { color: c.destructive }]}>{errors.email}</Text> : null}
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: c.foreground }]}>Mật khẩu</Text>
              <HapticTouchable
                onPress={() => Alert.alert("Thông báo", "Tính năng đang phát triển")}
              >
                <Text style={[styles.forgotText, { color: c.primary }]}>Quên mật khẩu?</Text>
              </HapticTouchable>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: c.card, borderColor: errors.password ? c.destructive : c.border, color: c.foreground }]}
                placeholder="Hãy nhập mật khẩu"
                placeholderTextColor={c.mutedForeground}
                value={password}
                onChangeText={(t) => { setPassword(t); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <HapticTouchable
                style={styles.eyeButton}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={fontSize.xl}
                  color={c.mutedForeground}
                />
              </HapticTouchable>
            </View>
            {errors.password ? <Text style={[styles.fieldError, { color: c.destructive }]}>{errors.password}</Text> : null}
          </View>

          {errors.general ? <Text style={[styles.error, { color: c.destructive }]}>{errors.general}</Text> : null}

          <DepthButton onPress={handleLogin} disabled={loading} size="lg" fullWidth>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </DepthButton>
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: c.mutedForeground }]}>Bạn chưa có tài khoản? </Text>
          <Link href="/(auth)/register" asChild>
            <HapticTouchable>
              <Text style={[styles.footerLink, { color: c.primary }]}>Đăng ký</Text>
            </HapticTouchable>
          </Link>
        </View>
        <Text style={[styles.version, { color: c.mutedForeground }]}>Phiên bản 1.0.0</Text>
      </BouncyScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  header: { alignItems: "center", marginBottom: spacing["2xl"] },
  heading: { fontSize: fontSize["2xl"], fontWeight: "700", marginTop: spacing.md, textAlign: "center" },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs, textAlign: "center" },
  form: { gap: spacing.base },
  field: { gap: spacing.xs },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: fontSize.sm, fontWeight: "500" },
  forgotText: { fontSize: fontSize.sm, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
  },
  passwordContainer: { position: "relative" },
  passwordInput: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    paddingRight: spacing["3xl"],
    fontSize: fontSize.base,
  },
  eyeButton: {
    position: "absolute",
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  fieldError: { fontSize: fontSize.xs, marginTop: 2 },
  error: { fontSize: fontSize.sm },
  button: {
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: { fontSize: fontSize.base, fontWeight: "600" },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
  },
  footerText: { fontSize: fontSize.sm },
  footerLink: { fontSize: fontSize.sm, fontWeight: "600" },
  version: { fontSize: fontSize.xs, textAlign: "center", marginTop: spacing["2xl"] },
});
