// BouncyScrollView — ScrollView with bouncy spring feel
import { ScrollView, type ScrollViewProps } from "react-native";

export function BouncyScrollView({ children, ...rest }: ScrollViewProps) {
  return (
    <ScrollView
      bounces
      alwaysBounceVertical
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
