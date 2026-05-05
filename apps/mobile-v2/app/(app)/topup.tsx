import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { DepthButton } from "@/components/DepthButton";
import { DepthCard } from "@/components/DepthCard";
import { useWalletBalance, useTopupPackages } from "@/features/wallet/queries";
import { useThemeColors, spacing, fontSize, fontFamily, radius } from "@/theme";

export default function TopUpScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: balanceData } = useWalletBalance();
  const { data: packages, isLoading } = useTopupPackages();

  const balance = balanceData?.balance ?? 0;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing["3xl"] }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>Nạp xu</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backText, { color: c.primary }]}>Quay lại</Text>
        </Pressable>
      </View>

      <DepthCard style={styles.balanceCard}>
        <Text style={[styles.balanceLabel, { color: c.subtle }]}>Số dư hiện tại</Text>
        <Text style={[styles.balanceValue, { color: c.coinDark }]}>
          {balance.toLocaleString("vi-VN")} xu
        </Text>
      </DepthCard>

      <Text style={[styles.sectionTitle, { color: c.foreground }]}>Gói nạp</Text>

      {isLoading ? (
        <Text style={[styles.loading, { color: c.subtle }]}>Đang tải...</Text>
      ) : (
        packages?.map((pkg) => (
          <DepthCard key={pkg.id} style={styles.packageCard}>
            <View style={styles.pkgRow}>
              <View>
                <Text style={[styles.pkgLabel, { color: c.foreground }]}>{pkg.label}</Text>
                <Text style={[styles.pkgAmount, { color: c.subtle }]}>
                  {pkg.coinsBase.toLocaleString("vi-VN")} xu
                </Text>
                {pkg.bonusCoins > 0 && (
                  <View style={[styles.bonusBadge, { backgroundColor: c.coinTint }]}>
                    <Text style={[styles.bonusText, { color: c.coinDark }]}>
                      Thưởng +{pkg.bonusCoins.toLocaleString("vi-VN")} xu
                    </Text>
                  </View>
                )}
              </View>
              <DepthButton size="sm" onPress={() => {}}>
                {formatVnd(pkg.amountVnd)}
              </DepthButton>
            </View>
          </DepthCard>
        )) ?? <Text style={[styles.loading, { color: c.subtle }]}>Không có gói nạp nào</Text>
      )}
    </ScrollView>
  );
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.base },
  title: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold },
  balanceCard: { padding: spacing["2xl"], alignItems: "center", marginBottom: spacing.base },
  balanceLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  balanceValue: { fontSize: fontSize["3xl"], fontFamily: fontFamily.extraBold, marginTop: spacing.xs },
  sectionTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.extraBold, marginBottom: spacing.sm },
  loading: { fontSize: fontSize.sm, textAlign: "center", paddingVertical: spacing["3xl"] },
  packageCard: { padding: spacing.base, marginBottom: spacing.sm },
  pkgRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pkgLabel: { fontSize: fontSize.base, fontFamily: fontFamily.bold },
  pkgAmount: { fontSize: fontSize.sm, marginTop: 2 },
  bonusBadge: { marginTop: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.md, alignSelf: "flex-start" },
  bonusText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold },
  backText: { fontSize: fontSize.sm, fontFamily: fontFamily.bold },
});
