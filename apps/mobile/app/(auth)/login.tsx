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
          <Text style={[styles.heading, { color: c.foreground }]}>Đăng nhập</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            Nhập email và mật khẩu để tiếp tục
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
            <Text style={[styles.label, { color: c.foreground }]}>Mật khẩu</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
              placeholder="••••••••"
              placeholderTextColor={c.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
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

        <View style={styles.footer}>
          <Text style={{ color: c.mutedForeground, fontSize: fontSize.sm }}>
            Chưa có tài khoản?{" "}
          </Text>
          <Link href="/(auth)/register" asChild>
            <HapticTouchable>
              <Text style={{ color: c.primary, fontSize: fontSize.sm, fontWeight: "600" }}>
                Đăng ký
              </Text>
            </HapticTouchable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  header: { marginBottom: spacing["2xl"] },
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
  error: { fontSize: fontSize.sm },
  button: {
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: { fontSize: fontSize.base, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing["2xl"] },
});
