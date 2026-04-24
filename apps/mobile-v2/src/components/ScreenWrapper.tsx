// ScreenWrapper — safe area + background color wrapper
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/theme";

interface ScreenWrapperProps {
  children: ReactNode;
  noPadding?: boolean;
}

export function ScreenWrapper({ children, noPadding = false }: ScreenWrapperProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.background },
        !noPadding && { paddingTop: insets.top },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
