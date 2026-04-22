import { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { LoadingScreen } from "@/components/LoadingScreen";
import { DepthButton } from "@/components/DepthButton";
import { GameIcon } from "@/components/GameIcon";
import { Mascot } from "@/components/Mascot";
import { useAuth } from "@/hooks/use-auth";
import { useHaptics } from "@/contexts/HapticsContext";
import { useThemeColors, spacing, radius, fontSize, fontFamily } from "@/theme";

export default function ProfileScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { enabled: hapticsEnabled, setEnabled: setHapticsEnabled } = useHaptics();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!user) return <LoadingScreen />;

  const displayName = profile?.nickname ?? user.fullName ?? user.email ?? "Người dùng";
  const initial = displayName.charAt(0).toUpperCase();
  const targetLevel = profile?.targetLevel ?? "B2";

  function handleSignOut() {
    Alert.alert("Đăng xuất", "Bạn chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <LinearGradient
          colors={[c.primary + "20", c.primaryTint, c.background]}
          locations={[0, 0.5, 1]}
          style={styles.hero}
        >
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: c.primary }]}> 
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: c.coin, borderColor: c.surface }]}> 
              <Text style={styles.levelBadgeText}>{targetLevel}</Text>
            </View>
          </View>

          <Text style={[styles.displayName, { color: c.foreground }]}>{displayName}</Text>
          <Text style={[styles.email, { color: c.mutedForeground }]}>{user.email}</Text>

          <View style={styles.mascotDecor}>
            <Mascot name="wave" size={76} animation="none" />
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}> 
        <StatPill icon="target" label="Mục tiêu" value={targetLevel} />
        <StatPill icon="rocket" label="Bỏ học" value="0 ngày" />
        <StatPill icon="trophy" label="Thành tích" value="0" />
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={[styles.sectionLabel, { color: c.subtle }]}>CÀI ĐẶT</Text>

        <View style={[styles.menuGroup, { backgroundColor: c.surface, borderColor: c.border }]}> 
          <MenuRow icon="person-outline" label="Thông tin cá nhân" onPress={() => Alert.alert("Thông báo", "Tính năng đang phát triển")} />
          <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
          <MenuRow icon="flag-outline" label="Mục tiêu học tập" onPress={() => router.push("/(app)/goal" as any)} />
          <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
          <MenuRow icon="shield-checkmark-outline" label="Tài khoản & Bảo mật" onPress={() => router.push("/(app)/account" as any)} />
        </View>

        <Text style={[styles.sectionLabel, { color: c.subtle }]}>ỨNG DỤNG</Text>

        <View style={[styles.menuGroup, { backgroundColor: c.surface, borderColor: c.border }]}> 
          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: c.warningTint }]}> 
                <Ionicons name="volume-medium-outline" size={17} color={c.warning} />
              </View>
              <Text style={[styles.menuLabel, { color: c.foreground }]}>Rung haptic</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: c.border, true: c.primaryLight }}
              thumbColor={hapticsEnabled ? c.primary : c.subtle}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: c.subtle }]}>HỖ TRỢ</Text>

        <View style={[styles.menuGroup, { backgroundColor: c.surface, borderColor: c.border }]}> 
          <MenuRow icon="help-circle-outline" label="Trung tâm hỗ trợ" onPress={() => Alert.alert("Thông báo", "Tính năng đang phát triển")} />
          <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
          <MenuRow icon="star-outline" label="Đánh giá ứng dụng" onPress={() => Alert.alert("Cảm ơn!", "Tính năng đang phát triển")} />
        </View>

        <DepthButton variant="destructive" fullWidth onPress={handleSignOut} style={{ marginTop: spacing.md }}>
          Đăng xuất
        </DepthButton>

        <Text style={[styles.version, { color: c.placeholder }]}>VSTEP Mobile v2.0.0</Text>
      </Animated.View>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof GameIcon>[0]["name"];
  label: string;
  value: string;
}) {
  const c = useThemeColors();
  return (
    <View style={[styles.statPill, { backgroundColor: c.surface, borderColor: c.border }]}> 
      <GameIcon name={icon} size={22} />
      <Text style={[styles.statValue, { color: c.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.subtle }]}>{label}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <View style={[styles.menuIconWrap, { backgroundColor: c.muted }]}> 
          <Ionicons name={icon} size={17} color={c.mutedForeground} />
        </View>
        <Text style={[styles.menuLabel, { color: c.foreground }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.subtle} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  hero: { alignItems: "center", paddingTop: spacing["2xl"], paddingBottom: spacing.xl, position: "relative", marginHorizontal: -spacing.xl, paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  avatarWrap: { position: "relative", marginBottom: spacing.md },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: 40, fontFamily: fontFamily.extraBold },
  levelBadge: { position: "absolute", bottom: -4, right: -4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, borderWidth: 2 },
  levelBadgeText: { color: "#FFF", fontSize: 10, fontFamily: fontFamily.extraBold },
  displayName: { fontSize: fontSize["2xl"], fontFamily: fontFamily.extraBold, textAlign: "center" },
  email: { fontSize: fontSize.sm, marginTop: 4, textAlign: "center" },
  mascotDecor: { position: "absolute", right: spacing.xl, bottom: 8, opacity: 0.9 },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statPill: { flex: 1, alignItems: "center", gap: 2, borderWidth: 2, borderBottomWidth: 3, borderRadius: radius.lg, paddingVertical: spacing.md, borderBottomColor: "#CACACA" },
  statValue: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  statLabel: { fontSize: 10 },
  sectionLabel: { fontSize: 10, fontFamily: fontFamily.bold, letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.base },
  menuGroup: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, overflow: "hidden", marginBottom: spacing.md, borderColor: "#E5E5E5", borderBottomColor: "#CACACA" },
  menuRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  menuIconWrap: { width: 32, height: 32, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  divider: { height: 1, marginHorizontal: spacing.base },
  version: { fontSize: 11, textAlign: "center", marginTop: spacing.xl },
});
