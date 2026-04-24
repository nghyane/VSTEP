// HapticTouchable — TouchableOpacity with haptic feedback + subtle press scale
import { useRef, type ReactNode } from "react";
import { Animated, TouchableOpacity, type TouchableOpacityProps } from "react-native";
import { useHaptics } from "@/contexts/HapticsContext";

interface Props extends TouchableOpacityProps {
  haptic?: boolean;
  scalePress?: boolean;
  children?: ReactNode;
}

export function HapticTouchable({ onPress, haptic = true, scalePress = false, children, style, ...rest }: Props) {
  const { trigger } = useHaptics();
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    if (scalePress) {
      Animated.timing(scale, { toValue: 0.97, duration: 60, useNativeDriver: true }).start();
    }
  }

  function handlePressOut() {
    if (scalePress) {
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
    }
  }

  function handlePress(e: Parameters<NonNullable<TouchableOpacityProps["onPress"]>>[0]) {
    if (haptic) trigger();
    onPress?.(e);
  }

  const content = (
    <TouchableOpacity
      {...rest}
      onPress={handlePress}
      onPressIn={scalePress ? handlePressIn : undefined}
      onPressOut={scalePress ? handlePressOut : undefined}
    >
      {children}
    </TouchableOpacity>
  );

  if (scalePress) {
    return <Animated.View style={[{ transform: [{ scale }] }, style]}>{content}</Animated.View>;
  }

  return content;
}
