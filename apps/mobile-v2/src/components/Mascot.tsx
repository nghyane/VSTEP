// Mascot — "Lac" character with animation modes
import { useEffect, useRef } from "react";
import { Animated, Image, ImageSourcePropType, StyleSheet } from "react-native";

export type MascotName =
  | "happy"
  | "think"
  | "sad"
  | "wave"
  | "hero"
  | "listen"
  | "read"
  | "write"
  | "speak"
  | "vocabulary"
  | "levelup";

const SOURCES: Record<MascotName, ImageSourcePropType> = {
  happy:      require("../../assets/mascot/lac-happy.png"),
  think:      require("../../assets/mascot/lac-think.png"),
  sad:        require("../../assets/mascot/lac-sad.png"),
  wave:       require("../../assets/mascot/lac-wave.png"),
  hero:       require("../../assets/mascot/lac-hero.png"),
  listen:     require("../../assets/mascot/lac-listen.png"),
  read:       require("../../assets/mascot/lac-read.png"),
  write:      require("../../assets/mascot/lac-write.png"),
  speak:      require("../../assets/mascot/lac-speak.png"),
  vocabulary: require("../../assets/mascot/lac-vocabulary.png"),
  levelup:    require("../../assets/mascot/lac-levelup.png"),
};

interface MascotProps {
  name: MascotName;
  size?: number;
  animation?: "float" | "bounce" | "pop" | "none";
}

export function Mascot({ name, size = 120, animation = "float" }: MascotProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(
    new Animated.Value(animation === "bounce" || animation === "pop" ? 0 : 1),
  ).current;
  const opacity = useRef(
    new Animated.Value(animation === "bounce" || animation === "pop" ? 0 : 1),
  ).current;

  useEffect(() => {
    if (animation === "none") return;

    if (animation === "bounce") {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => startFloat());
      return;
    }

    if (animation === "pop") {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale, { toValue: 1.15, tension: 80, friction: 5, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]),
        Animated.spring(scale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
      ]).start(() => startFloat());
      return;
    }

    startFloat();
  }, []);

  function startFloat() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -8, duration: 1800, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    ).start();
  }

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale }], opacity }}>
      <Image
        source={SOURCES[name]}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: { alignSelf: "center" },
});
