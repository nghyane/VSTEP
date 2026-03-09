import { useState, useCallback } from "react";
import {
  ActivityIndicator,
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
import { loginApi, registerApi } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";
export default function RegisterScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const c = useThemeColors();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string; general?: string }>({});

  const validate = useCallback(() => {
    const e: typeof errors = {};
    if (fullName.trim() && fullName.trim().length > 100) {
      e.fullName = "Họ và tên tối đa 100 ký tự";
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      e.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      e.email = "Email không hợp lệ";
    }
    if (!password) {
      e.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 8) {
      e.password = "Mật khẩu phải có ít nhất 8 ký tự";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [fullName, email, password]);

  async function handleRegister() {
    if (!validate()) return;
    setErrors({});
    setLoading(true);
    try {
      await registerApi(email.trim(), password, fullName.trim() || undefined);
      const res = await loginApi(email.trim(), password);
      await signIn(res.accessToken, res.refreshToken, res.user);
      router.replace("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      if (message.toLowerCase().includes("email already registered")) {
        setErrors({ email: "Email này đã được sử dụng" });
      } else {
        setErrors({ general: message });
      }
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
          <Logo size="lg" />
          <Text style={[styles.heading, { color: c.foreground }]}>Tạo tài khoản mới</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            Bắt đầu hành trình chinh phục Aptis
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.foreground }]}>Họ và tên</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.card, borderColor: errors.fullName ? c.destructive : c.border, color: c.foreground }]}
              placeholder="Nguyễn Văn A"
              placeholderTextColor={c.mutedForeground}
              value={fullName}
              onChangeText={(t) => { setFullName(t); if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined })); }}
              autoComplete="name"
            />
            {errors.fullName ? <Text style={[styles.fieldError, { color: c.destructive }]}>{errors.fullName}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.foreground }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.card, borderColor: errors.email ? c.destructive : c.border, color: c.foreground }]}
              placeholder="you@example.com"
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
            <Text style={[styles.label, { color: c.foreground }]}>Mật khẩu</Text>
            <View style={[styles.inputRow, { backgroundColor: c.card, borderColor: errors.password ? c.destructive : c.border }]}>
              <TextInput
                style={[styles.inputFlex, { color: c.foreground }]}
                placeholder="Tối thiểu 8 ký tự"
                placeholderTextColor={c.mutedForeground}
                value={password}
                onChangeText={(t) => { setPassword(t); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                secureTextEntry={!showPassword}
              />
              <HapticTouchable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={c.mutedForeground}
                />
              </HapticTouchable>
            </View>
            {errors.password ? <Text style={[styles.fieldError, { color: c.destructive }]}>{errors.password}</Text> : null}
          </View>

          {errors.general ? <Text style={[styles.error, { color: c.destructive }]}>{errors.general}</Text> : null}

          <HapticTouchable
            style={[styles.button, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={c.primaryForeground} />
            ) : (
              <Text style={[styles.buttonText, { color: c.primaryForeground }]}>
                Tạo tài khoản
              </Text>
            )}
          </HapticTouchable>
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: c.mutedForeground }]}>Đã có tài khoản? </Text>
          <Link href="/(auth)/login" asChild>
            <HapticTouchable>
              <Text style={[styles.footerLink, { color: c.primary }]}>Đăng nhập</Text>
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
  heading: { fontSize: fontSize["2xl"], fontWeight: "700", marginTop: spacing.sm },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs },
  form: { gap: spacing.base },
  field: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
  },
  inputFlex: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
  },
  eyeBtn: { padding: spacing.xs },
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
  version: {
    fontSize: fontSize.xs,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
