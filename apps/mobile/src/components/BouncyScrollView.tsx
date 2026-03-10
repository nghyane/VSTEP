import { useCallback, useRef } from "react";
import {
  Animated,
  FlatList,
  Platform,
  ScrollView,
  type FlatListProps,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from "react-native";

const MAX_BOUNCE = 50;
const VELOCITY_SCALE = 20;

function useBounce(callerOnScrollEndDrag?: ScrollViewProps["onScrollEndDrag"]) {
  const translateY = useRef(new Animated.Value(0)).current;

  const bounce = useCallback(
    (distance: number) => {
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: distance,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
      ]).start();
    },
    [translateY],
  );

  const onScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      callerOnScrollEndDrag?.(e);

      const { contentOffset, velocity, contentSize, layoutMeasurement } =
        e.nativeEvent;
      if (!velocity) return;

      const maxScroll = contentSize.height - layoutMeasurement.height;
      const atTop = contentOffset.y <= 0;
      const atBottom = maxScroll <= 0 || contentOffset.y >= maxScroll - 1;

      if (atTop && velocity.y < 0) {
        bounce(Math.min(Math.abs(velocity.y) * VELOCITY_SCALE, MAX_BOUNCE));
      } else if (atBottom && velocity.y > 0) {
        bounce(-Math.min(Math.abs(velocity.y) * VELOCITY_SCALE, MAX_BOUNCE));
      }
    },
    [bounce, callerOnScrollEndDrag],
  );

  return { translateY, onScrollEndDrag };
}

/**
 * Drop-in ScrollView replacement with rubber-band overscroll on Android.
 * On iOS it delegates to the native bounce behavior.
 */
export function BouncyScrollView({
  children,
  onScrollEndDrag: callerOnScrollEndDrag,
  ...rest
}: ScrollViewProps) {
  const { translateY, onScrollEndDrag } = useBounce(callerOnScrollEndDrag);

  if (Platform.OS !== "android") {
    return (
      <ScrollView onScrollEndDrag={callerOnScrollEndDrag} bounces {...rest}>
        {children}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      overScrollMode="never"
      scrollEventThrottle={16}
      onScrollEndDrag={onScrollEndDrag}
      {...rest}
    >
      <Animated.View style={{ transform: [{ translateY }] }}>
        {children}
      </Animated.View>
    </ScrollView>
  );
}

/**
 * Drop-in FlatList replacement with rubber-band overscroll on Android.
 * Uses CellRendererComponent to animate all cells together.
 */
export function BouncyFlatList<T>({
  onScrollEndDrag: callerOnScrollEndDrag,
  ...rest
}: FlatListProps<T>) {
  const { translateY, onScrollEndDrag } = useBounce(callerOnScrollEndDrag);

  if (Platform.OS !== "android") {
    return (
      <FlatList onScrollEndDrag={callerOnScrollEndDrag} bounces {...rest} />
    );
  }

  return (
    <FlatList
      overScrollMode="never"
      scrollEventThrottle={16}
      onScrollEndDrag={onScrollEndDrag}
      CellRendererComponent={({ children: cell, style, ...cellRest }) => (
        <Animated.View
          style={[style, { transform: [{ translateY }] }]}
          {...cellRest}
        >
          {cell}
        </Animated.View>
      )}
      {...rest}
    />
  );
}
