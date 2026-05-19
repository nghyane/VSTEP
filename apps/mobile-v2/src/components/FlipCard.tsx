// FlipCard — 3D flip card primitive (rotateY 0deg <-> 180deg).
// Mirrors apps/frontend-v3/src/features/vocab/components/FlipCard.tsx using
// React Native Animated API (no Reanimated dependency).
//
// Implementation notes:
// - Front face is the layout anchor (defines container size).
// - Back face is absolutely positioned overlay on top of the front.
// - Opacity gates at 90deg so the rotated front does not bleed through the
//   back (React Native does not support `backfaceVisibility` reliably on
//   Android together with Animated transforms).
// - `flipped` is a controlled prop. Parent owns flipped state so multiple
//   cards can be sequenced (reset to false when item changes).
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, type ViewStyle } from "react-native";

interface Props {
  flipped: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
}

export function FlipCard({ flipped, front, back, style, duration = 450 }: Props) {
  const value = useRef(new Animated.Value(flipped ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(value, {
      toValue: flipped ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [flipped, duration, value]);

  const frontRotate = value.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotate = value.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });
  const frontOpacity = value.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = value.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <Animated.View style={[s.scene, style]}>
      <Animated.View
        style={[
          s.face,
          {
            opacity: frontOpacity,
            transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
          },
        ]}
      >
        {front}
      </Animated.View>
      <Animated.View
        style={[
          s.face,
          s.back,
          {
            opacity: backOpacity,
            transform: [{ perspective: 1000 }, { rotateY: backRotate }],
          },
        ]}
      >
        {back}
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  scene: { width: "100%" },
  face: { width: "100%" },
  back: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});
