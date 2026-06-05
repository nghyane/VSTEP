import { useWindowDimensions } from "react-native";

export interface ResponsiveLayout {
  width: number;
  height: number;
  isLandscape: boolean;
  isCompactPhone: boolean;
  isPhone: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  isTabletLandscape: boolean;
  horizontalPadding: number;
  contentMaxWidth: number;
  navRailWidth: number;
  contentInsetStart: number;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  const shortestSide = Math.min(width, height);
  const isLandscape = width > height;
  const isLargeTablet = shortestSide >= 1024;
  const isTablet = shortestSide >= 768;
  const isPhone = !isTablet;
  const isCompactPhone = width < 390;
  const isTabletLandscape = isTablet && isLandscape;
  const navRailWidth = isTabletLandscape ? (isLargeTablet ? 120 : 108) : 0;
  const horizontalPadding = isLargeTablet ? 32 : isTablet ? 24 : 16;

  return {
    width,
    height,
    isLandscape,
    isCompactPhone,
    isPhone,
    isTablet,
    isLargeTablet,
    isTabletLandscape,
    horizontalPadding,
    contentMaxWidth: isLargeTablet ? 1180 : isTablet ? 960 : 720,
    navRailWidth,
    contentInsetStart: navRailWidth + horizontalPadding,
  };
}
