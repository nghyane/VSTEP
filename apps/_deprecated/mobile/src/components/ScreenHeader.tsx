import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTouchable } from "./HapticTouchable";
import { useThemeColors, spacing, fontSize, fontFamily } from "@/theme";

interface Props {
  title: string;
}

export function ScreenHeader({ title }: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.header, { paddingTop: insets.top, backgroundColor: c.surface, borderBottomColor: c.border }]}>
      <HapticTouchable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={c.foreground} />
      </HapticTouchable>
      <Text style={[styles.title, { color: c.foreground }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semiBold,
    textAlign: "center",
    marginHorizontal: spacing.xs,
  },
  spacer: {
    width: 40,
  },
});
