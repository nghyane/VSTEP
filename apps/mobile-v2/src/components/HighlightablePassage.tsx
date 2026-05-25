import { StyleSheet, Text, View } from "react-native";
import { useThemeColors, spacing, fontSize, fontFamily } from "@/theme";

interface Props {
  text: string;
  passageId: string;
  style?: object;
}

export function HighlightablePassage({ text, passageId, style }: Props) {
  const c = useThemeColors();

  return (
    <View style={s.container}>
      <Text nativeID={`passage-${passageId}`} selectable style={[s.passageText, style, { color: c.foreground }]}>
        {text}
      </Text>
      <Text style={[s.hint, { color: c.subtle }]}>Giữ ngón tay lên chữ để chọn/copy đoạn cần ghi chú.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: spacing.sm },
  passageText: { fontSize: fontSize.base, fontFamily: fontFamily.regular, lineHeight: 24 },
  hint: { fontSize: fontSize.xs, textAlign: "center", marginTop: spacing.xs },
});
