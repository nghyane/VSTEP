// LoadingScreen — full-screen loading with Mascot
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useThemeColors } from "@/theme";

export function LoadingScreen() {
  const c = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ActivityIndicator size="large" color={c.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
