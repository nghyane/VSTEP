import { useState } from "react";
import {
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
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister() {
    if (!email || !password) return;
    setError("");
    setLoading(true);
    try {
      await registerApi(email, password, fullName || undefined);
      const res = await loginApi(email, password);
      await signIn(res.accessToken, res.refreshToken, res.user);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
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
          <Text style={[styles.heading, { color: c.foreground }]}>Tạo tài khoản mới</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            Bắt đầu hành trình chinh phục VSTEP
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.foreground }]}>Họ và tên</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
              placeholder="Nguyễn Văn A"
              placeholderTextColor={c.mutedForeground}
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
            />
          </View>

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
            <Text style={[styles.label, { color: c.foreground }]}>Mật khẩu</Text>
            <View style={[styles.inputRow, { backgroundColor: c.card, borderColor: c.border }]}>
              <TextInput
                style={[styles.inputFlex, { color: c.foreground }]}
                placeholder="Tối thiểu 8 ký tự"
                placeholderTextColor={c.mutedForeground}
                value={password}
                onChangeText={setPassword}
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
          </View>

          {error ? <Text style={[styles.error, { color: c.destructive }]}>{error}</Text> : null}

          <HapticTouchable
            style={[styles.button, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: c.primaryForeground }]}>
              {loading ? "Đang xử lý..." : "Tạo tài khoản"}
            </Text>
          </HapticTouchable>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          <Text style={[styles.dividerText, { color: c.mutedForeground }]}>hoặc</Text>
          <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
        </View>

        <Link href="/(auth)/login" asChild>
          <HapticTouchable style={[styles.outlineButton, { borderColor: c.border }]}>
            <Text style={[styles.outlineButtonText, { color: c.foreground }]}>
              Đã có tài khoản? Đăng nhập
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
  dividerText: { marginHorizontal: spacing.md, fontSize: fontSize.sm },
  outlineButton: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: "center",
  },
  outlineButtonText: { fontSize: fontSize.base, fontWeight: "600" },
  version: {
    fontSize: fontSize.xs,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
