// HapticTouchable — TouchableOpacity with haptic feedback
import { TouchableOpacity, type TouchableOpacityProps } from "react-native";
import { useHaptics } from "@/contexts/HapticsContext";

interface Props extends TouchableOpacityProps {
  haptic?: boolean;
}

export function HapticTouchable({ onPress, haptic = true, ...rest }: Props) {
  const { trigger } = useHaptics();

  function handlePress(e: Parameters<NonNullable<TouchableOpacityProps["onPress"]>>[0]) {
    if (haptic) trigger();
    onPress?.(e);
  }

  return <TouchableOpacity {...rest} onPress={handlePress} />;
}
