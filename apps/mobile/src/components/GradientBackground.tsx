import { StyleSheet, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { height: SCREEN_H } = Dimensions.get("window");

export function GradientBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      <LinearGradient
        colors={["#E8EEFF", "#F0F4FF", "#FAFBFF"]}
        locations={[0, 0.25, 0.35]}
        style={styles.gradient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  gradient: {
    flex: 1,
  },
});
