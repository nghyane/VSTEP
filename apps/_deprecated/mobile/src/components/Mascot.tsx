import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

type MascotName =
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

const SOURCES: Record<MascotName, ReturnType<typeof require>> = {
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

interface Props {
  name: MascotName;
  size?: number;
  // "float" = gentle up/down loop (idle states)
  // "bounce" = spring bounce on mount (result/complete screens)
  // "pop"    = scale pop on mount + float (celebration)
  // "none"   = static
  animation?: "float" | "bounce" | "pop" | "none";
}

export function Mascot({ name, size = 120, animation = "float" }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(animation === "bounce" || animation === "pop" ? 0 : 1)).current;
  const opacity = useRef(new Animated.Value(animation === "bounce" || animation === "pop" ? 0 : 1)).current;

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

    // float
    startFloat();
  }, []);

  function startFloat() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -8, duration: 1800, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
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

// Particle burst for celebration screens
export function ConfettiParticles({ count = 12 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((i) => (
        <Particle key={i} index={i} total={count} />
      ))}
    </View>
  );
}

function Particle({ index, total }: { index: number; total: number }) {
  const angle = (index / total) * Math.PI * 2;
  const distance = 60 + Math.random() * 40;
  const tx = Math.cos(angle) * distance;
  const ty = Math.sin(angle) * distance - 30;

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0)).current;

  const COLORS = ["#58CC02", "#1CB0F6", "#FF9600", "#FF4B4B", "#CE82FF", "#FFD900"];
  const color = COLORS[index % COLORS.length];
  const size = 6 + (index % 3) * 3;

  useEffect(() => {
    const delay = index * 30;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: tx, duration: 600, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: ty, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ translateX }, { translateY }, { scale }],
        opacity,
      }}
    />
  );
}

const styles = StyleSheet.create({
  image: { alignSelf: "center" },
});
