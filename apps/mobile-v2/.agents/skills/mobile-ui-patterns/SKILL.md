---
name: mobile-ui-patterns
description: "Design tokens, components (DepthCard, DepthButton, HapticTouchable, Mascot), typography, spacing, safe area. Load when creating/editing UI components."
---

# Mobile UI Patterns

## Design Tokens

**Source of truth:** `src/theme/colors.ts` — synced with frontend-v3 `src/styles.css @theme`

```ts
import { colors, spacing, radius, fontSize, fontFamily } from "@/theme";
```

### Colors (never hardcode hex)

```ts
// Primary
colors.light.primary          // "#58CC02" - VSTEP green
colors.light.primaryForeground // "#FFFFFF"
colors.light.primaryDark      // "#478700"
colors.light.primaryTint      // "#E6F8D4"

// Semantic
colors.light.destructive      // "#EA4335"
colors.light.destructiveTint  // "#FFE6E4"
colors.light.warning          // "#FF9B00"
colors.light.warningTint      // "#FFF0DC"
colors.light.success          // "#58CC02"
colors.light.info             // "#1CB0F6"
colors.light.infoTint         // "#DDF4FF"

// Skills
colors.light.skillListening   // "#1CB0F6"
colors.light.skillReading     // "#7850C8"
colors.light.skillWriting     // "#58CC02"
colors.light.skillSpeaking    // "#FFC800"

// Neutrals
colors.light.background       // "#F7F7FA"
colors.light.surface          // "#FFFFFF"
colors.light.muted            // "#F3F4F6"
colors.light.foreground       // "#1E1E28"
colors.light.subtle           // "#8C8C9B"
colors.light.border           // "#E5E5E5"
colors.light.placeholder      // "#AFAFAF"

// Gamification
colors.light.streak           // "#FF7800"
colors.light.streakTint       // "#FFF0DC"
colors.light.coin             // "#FFC800"
colors.light.coinDark         // "#DCAA00"
colors.light.coinTint         // "#FFF5D2"
```

### Spacing

```ts
spacing.xs     // 4
spacing.sm     // 8
spacing.md     // 12
spacing.base   // 16
spacing.lg     // 20
spacing.xl     // 24
spacing["2xl"] // 32
spacing["3xl"] // 48
```

### Radius

```ts
radius.sm      // 8
radius.md      // 12
radius.button  // 13
radius.lg      // 16
radius.xl      // 20
radius["2xl"]  // 24
radius.full    // 9999
```

### Typography

```ts
fontSize.xs      // 12
fontSize.sm      // 14
fontSize.base    // 16
fontSize.lg      // 18
fontSize.xl      // 20
fontSize["2xl"]  // 24
fontSize["3xl"]  // 32

fontFamily.regular    // "Nunito-Regular"
fontFamily.medium     // "Nunito-Medium"
fontFamily.semiBold   // "Nunito-SemiBold"
fontFamily.bold       // "Nunito-Bold"
fontFamily.extraBold  // "Nunito-ExtraBold"
```

## Components

### DepthCard

3D card effect — border-2 border-b-4 synced with FE v3 `.card`

```tsx
import { DepthCard } from "@/components/DepthCard";

<DepthCard variant="neutral" padding={spacing.lg}>
  {/* content */}
</DepthCard>

// Skill-colored card
<DepthCard variant="skill" skillColor={colors.light.skillListening}>
  <Text>Listening Practice</Text>
</DepthCard>

// Semantic variants
<DepthCard variant="primary">     // Green tint
<DepthCard variant="success">     // Same as primary
<DepthCard variant="destructive"> // Red tint
```

### DepthButton

3D press effect — synced with FE v3 `.btn-primary`

```tsx
import { DepthButton } from "@/components/DepthButton";

<DepthButton variant="primary" size="lg" fullWidth onPress={handleStart}>
  Begin
</DepthButton>

// Variants
<DepthButton variant="secondary">   // White bg
<DepthButton variant="destructive"> // Red bg
<DepthButton variant="coin">        // Gold bg
<DepthButton variant="info">        // Blue bg

// Sizes
<DepthButton size="sm">  // height: 36
<DepthButton size="md">  // height: 44
<DepthButton size="lg">  // height: 52
```

### HapticTouchable

Replaces TouchableOpacity with haptic feedback

```tsx
import { HapticTouchable } from "@/components/HapticTouchable";

<HapticTouchable onPress={handleTap}>
  <View>
    <Text>Tap me</Text>
  </View>
</HapticTouchable>

// With scale animation
<HapticTouchable scalePress onPress={handleTap}>
  <Animated.View>
    <Text>Bouncy button</Text>
  </Animated.View>
</HapticTouchable>

// Disable haptic
<HapticTouchable haptic={false} onPress={handleTap}>
```

### Mascot

"Lạc" character — use sparingly, appropriate expression

```tsx
import { Mascot } from "@/components/Mascot";

// Names
<Mascot name="hero" size={120} animation="float" />
<Mascot name="happy" size={80} animation="bounce" />
<Mascot name="think" size={60} animation="pop" />
<Mascot name="listen" size={100} animation="float" />
<Mascot name="read" size={100} animation="float" />
<Mascot name="write" size={100} animation="float" />
<Mascot name="speak" size={100} animation="float" />
<Mascot name="vocabulary" size={100} animation="float" />
<Mascot name="levelup" size={140} animation="bounce" />
<Mascot name="sad" size={80} animation="none" />

// Animations
animation="float"  // Gentle up/down loop
animation="bounce" // Spring bounce in
animation="pop"    // Scale pop in (1.15 → 1.0)
animation="none"   // Static
```

**Rules:**
- ✅ Onboarding screens
- ✅ Empty states
- ✅ Celebrations (complete exam, streak milestone)
- ❌ Do NOT loop animation on every interaction
- ❌ Do NOT use mascot as background
- ❌ Do NOT overlap mascot with important content

### SpiderChart

Radar chart for skill scores

```tsx
import { SpiderChart } from "@/components/SpiderChart";

<SpiderChart
  data={[listening, reading, writing, speaking]}
  target={[targetL, targetR, targetW, targetS]}
  size={200}
/>
```

- 4 axes: Listening, Reading, Writing, Speaking
- Scale: 0-10
- Current: primary color polygon
- Target: destructive dashed polygon
- Only shows when ≥ 5 exams completed

### GameIcon & SkillIcon

System icons — from `assets/icons/*.png`

```tsx
import { GameIcon } from "@/components/GameIcon";
import { SkillIcon } from "@/components/SkillIcon";

<GameIcon name="trophy" size={24} />
<GameIcon name="fire" size={24} />
<GameIcon name="gem" size={24} />

<SkillIcon name="listening" size={32} />
<SkillIcon name="reading" size={32} />
<SkillIcon name="writing" size={32} />
<SkillIcon name="speaking" size={32} />
<SkillIcon name="vocabulary" size={32} />
```

## Safe Area

**MANDATORY** for all scrollable content

```tsx
import { useSafeAreaInsets } from "react-native-safe-area-context";

const insets = useSafeAreaInsets();

<ScrollView 
  contentContainerStyle={{ 
    paddingBottom: insets.bottom + spacing["2xl"] 
  }}
>
  {/* content */}
</ScrollView>

// Fixed bottom elements
<View style={{ paddingBottom: insets.bottom + spacing.lg }}>
  <DepthButton>Begin</DepthButton>
</View>
```

## Layout Patterns

### Scrollable Screen

```tsx
export default function Screen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView 
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={{ 
        padding: spacing.lg,
        paddingBottom: insets.bottom + spacing["2xl"]
      }}
    >
      <DepthCard>
        <Text style={{ fontFamily: fontFamily.bold, fontSize: fontSize.xl }}>
          Title
        </Text>
      </DepthCard>
    </ScrollView>
  );
}
```

### Fixed Bottom CTA

```tsx
export default function Screen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing["3xl"] }}>
        {/* content */}
      </ScrollView>
      
      <View style={{ 
        position: "absolute", 
        bottom: 0, 
        left: 0, 
        right: 0,
        padding: spacing.lg,
        paddingBottom: insets.bottom + spacing.lg,
        backgroundColor: c.surface,
        borderTopWidth: 1,
        borderTopColor: c.border
      }}>
        <DepthButton fullWidth size="lg" onPress={handleAction}>
          Action
        </DepthButton>
      </View>
    </View>
  );
}
```

### Fade In Animation

```tsx
const fadeAnims = useRef(
  Array.from({ length: count }, () => new Animated.Value(0))
).current;

useEffect(() => {
  fadeAnims.forEach((anim, i) => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay: i * 80,
      useNativeDriver: true,
    }).start();
  });
}, []);

// Usage
<Animated.View style={{ opacity: fadeAnims[i] }}>
  <DepthCard>...</DepthCard>
</Animated.View>
```

## Anti-patterns

❌ **WRONG:** Hardcoded colors
```tsx
<View style={{ backgroundColor: "#58CC02" }}>
```

✅ **RIGHT:** Use theme tokens
```tsx
<View style={{ backgroundColor: colors.light.primary }}>
```

❌ **WRONG:** Inline styles without tokens
```tsx
<View style={{ padding: 16, borderRadius: 12, fontSize: 16 }}>
```

✅ **RIGHT:** Use spacing/radius/fontSize
```tsx
<View style={{ padding: spacing.base, borderRadius: radius.lg }}>
<Text style={{ fontSize: fontSize.base }}>
```

❌ **WRONG:** Map for fixed UI sets
```tsx
{SKILLS.map(s => <DepthCard key={s}>{s.label}</DepthCard>)}
```

✅ **RIGHT:** Write explicitly
```tsx
<DepthCard skillColor={colors.light.skillListening}>Listening</DepthCard>
<DepthCard skillColor={colors.light.skillReading}>Reading</DepthCard>
<DepthCard skillColor={colors.light.skillWriting}>Writing</DepthCard>
<DepthCard skillColor={colors.light.skillSpeaking}>Speaking</DepthCard>
```
