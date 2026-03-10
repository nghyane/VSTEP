import { TouchableOpacity, type TouchableOpacityProps } from "react-native";
import { useHaptics } from "@/contexts/HapticsContext";

export function HapticTouchable({ onPress, ...props }: TouchableOpacityProps) {
  const { trigger } = useHaptics();

  return (
    <TouchableOpacity
      {...props}
      onPress={(e) => {
        trigger();
        onPress?.(e);
      }}
    />
  );
}
