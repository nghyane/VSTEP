import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/theme";

interface ScreenWrapperProps {
  children: ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

/**
 * Wraps screen content with proper safe area padding to avoid
 * content bleeding under the status bar when headerShown is false.
 */
export function ScreenWrapper({ children, style, noPadding }: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.background,
          paddingTop: noPadding ? 0 : insets.top,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
