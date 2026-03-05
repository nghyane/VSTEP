import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticTouchable } from "@/components/HapticTouchable";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { loginApi } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { useThemeColors, spacing, radius, fontSize } from "@/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const c = useThemeColors();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email || !password) return;
    setError("");
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      await signIn(res.accessToken, res.refreshToken, res.user);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Logo size="lg" />
          <Text style={[styles.heading, { color: c.foreground }]}>
            Đăng nhập vào VSTEP
          </Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            Nền tảng luyện thi VSTEP thông minh
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.foreground }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
              placeholder="you@example.com"
              placeholderTextColor={c.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
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
                style={[styles.passwordInput, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
                placeholder="••••••••"
                placeholderTextColor={c.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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
          </View>

          {error ? <Text style={[styles.error, { color: c.destructive }]}>{error}</Text> : null}

          <HapticTouchable
            style={[styles.button, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: c.primaryForeground }]}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Text>
          </HapticTouchable>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          <Text style={[styles.dividerText, { color: c.mutedForeground }]}>hoặc</Text>
          <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
        </View>

        <Link href="/(auth)/register" asChild>
          <HapticTouchable style={[styles.outlineButton, { borderColor: c.border }]}>
            <Text style={[styles.outlineButtonText, { color: c.foreground }]}>
              Đăng ký tài khoản
            </Text>
          </HapticTouchable>
        </Link>

        <Text style={[styles.version, { color: c.mutedForeground }]}>Phiên bản 1.0.0</Text>
      </ScrollView>
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
  error: { fontSize: fontSize.sm },
  button: {
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: { fontSize: fontSize.base, fontWeight: "600" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xl,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: fontSize.sm, marginHorizontal: spacing.md },
  outlineButton: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: "center",
  },
  outlineButtonText: { fontSize: fontSize.base, fontWeight: "600" },
  version: { fontSize: fontSize.xs, textAlign: "center", marginTop: spacing["2xl"] },
});
