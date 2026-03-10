import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BouncyScrollView } from "@/components/BouncyScrollView";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors, useSkillColor, spacing, radius, fontSize, fontFamily } from "@/theme";
import { SKILL_ICONS, SKILL_LABELS } from "@/components/SkillIcon";
import type { Skill } from "@/types/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NodeStatus = "completed" | "current" | "locked";

export interface LevelNode {
  id: number;
  skill: Skill;
  title: string;
  status: NodeStatus;
}

interface LearningPathProps {
  levels: LevelNode[];
  onNodePress: (level: LevelNode) => void;
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const SCREEN_W = Dimensions.get("window").width;
const NODE_SIZE = 68;
const NODE_BORDER = 4;
const DEPTH_HEIGHT = 6;
const VERTICAL_GAP = 120;
const TOP_PADDING = 80;
const BOTTOM_PADDING = 100;
const CENTER_X = SCREEN_W / 2;

// Duolingo 8-step offset cycle: center → left → far-left → left → center → right → far-right → right
const OFFSETS = [0, -50, -80, -50, 0, 50, 80, 50];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNodeX(index: number): number {
  return CENTER_X + (OFFSETS[index % OFFSETS.length] ?? 0);
}

function getNodeY(index: number): number {
  return TOP_PADDING + index * VERTICAL_GAP;
}

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Build SVG path data connecting node centers with smooth cubic Bézier curves */
function buildTrailPath(count: number): string {
  if (count < 2) return "";
  let d = `M ${getNodeX(0)} ${getNodeY(0) + NODE_SIZE / 2}`;
  for (let i = 1; i < count; i++) {
    const px = getNodeX(i - 1);
    const py = getNodeY(i - 1) + NODE_SIZE / 2;
    const cx = getNodeX(i);
    const cy = getNodeY(i) + NODE_SIZE / 2;
    const midY = (py + cy) / 2;
    d += ` C ${px} ${midY}, ${cx} ${midY}, ${cx} ${cy}`;
  }
  return d;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LearningPath({ levels, onNodePress }: LearningPathProps) {
  const c = useThemeColors();
  const totalHeight = TOP_PADDING + levels.length * VERTICAL_GAP + BOTTOM_PADDING;

  const currentIdx = levels.findIndex((l) => l.status === "current");
  const completedCount = currentIdx >= 0 ? currentIdx + 1 : levels.filter((l) => l.status === "completed").length;

  const fullPath = buildTrailPath(levels.length);
  const completedPath = completedCount >= 2 ? buildTrailPath(completedCount) : "";

  return (
    <BouncyScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ height: totalHeight }}
      showsVerticalScrollIndicator={false}
    >
      {/* SVG trail layer */}
      <Svg width={SCREEN_W} height={totalHeight} style={StyleSheet.absoluteFillObject}>
        {/* Locked trail (dashed) */}
        <Path
          d={fullPath}
          stroke={c.border}
          strokeWidth={5}
          strokeDasharray="10,10"
          strokeLinecap="round"
          fill="none"
        />
        {/* Completed trail (solid) */}
        {completedPath !== "" && (
          <Path d={completedPath} stroke={c.primary} strokeWidth={5} strokeLinecap="round" fill="none" />
        )}
      </Svg>

      {/* Nodes */}
      {levels.map((level, idx) => (
        <PathNode
          key={level.id}
          level={level}
          index={idx}
          isMilestone={level.id === 5 || level.id === 10}
          onPress={() => onNodePress(level)}
        />
      ))}
    </BouncyScrollView>
  );
}

// ---------------------------------------------------------------------------
// Node component
// ---------------------------------------------------------------------------

function PathNode({
  level,
  index,
  isMilestone,
  onPress,
}: {
  level: LevelNode;
  index: number;
  isMilestone: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const skillColor = useSkillColor(level.skill);

  const isLocked = level.status === "locked";
  const isCompleted = level.status === "completed";
  const isCurrent = level.status === "current";

  const bgColor = isLocked ? "#E0E0E0" : skillColor;
  const borderBottom = isLocked ? "#B0B0B0" : darken(skillColor, 40);

  // Pulse animation for current node
  const pulse = useRef(new Animated.Value(1)).current;
  const tooltipBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isCurrent) return;
    const scalePulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(tooltipBounce, { toValue: -8, duration: 600, useNativeDriver: true }),
        Animated.timing(tooltipBounce, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    );
    scalePulse.start();
    bounce.start();
    return () => {
      scalePulse.stop();
      bounce.stop();
    };
  }, [isCurrent, pulse, tooltipBounce]);

  const nodeX = getNodeX(index);
  const nodeY = getNodeY(index);
  const nodeOuterSize = NODE_SIZE + NODE_BORDER * 2;

  return (
    <View
      style={[
        styles.nodeWrapper,
        {
          left: nodeX - nodeOuterSize / 2,
          top: nodeY,
          width: nodeOuterSize,
        },
      ]}
    >
      {/* "BẮT ĐẦU" tooltip above current node */}
      {isCurrent && (
        <Animated.View
          style={[styles.tooltip, { backgroundColor: bgColor, transform: [{ translateY: tooltipBounce }] }]}
        >
          <Text style={styles.tooltipText}>BẮT ĐẦU</Text>
          {/* Arrow */}
          <View style={[styles.tooltipArrow, { borderTopColor: bgColor }]} />
        </Animated.View>
      )}

      {/* Node circle */}
      <Animated.View style={isCurrent ? { transform: [{ scale: pulse }] } : undefined}>
        <TouchableOpacity
          activeOpacity={isLocked ? 1 : 0.75}
          onPress={isLocked ? undefined : onPress}
          disabled={isLocked}
        >
          {/* 3D depth layer */}
          <View
            style={[
              styles.nodeDepth,
              {
                width: nodeOuterSize,
                height: nodeOuterSize,
                borderRadius: nodeOuterSize / 2,
                backgroundColor: borderBottom,
              },
            ]}
          />
          {/* Main circle */}
          <View
            style={[
              styles.nodeCircle,
              {
                width: nodeOuterSize,
                height: nodeOuterSize,
                borderRadius: nodeOuterSize / 2,
                backgroundColor: bgColor,
                borderWidth: NODE_BORDER,
                borderColor: borderBottom,
                marginTop: -nodeOuterSize - DEPTH_HEIGHT + 2,
              },
            ]}
          >
            {isCompleted ? (
              <Ionicons name="checkmark-sharp" size={30} color="#FFFFFF" />
            ) : isLocked ? (
              <Ionicons name="lock-closed" size={24} color="#9E9E9E" />
            ) : (
              <Ionicons name={SKILL_ICONS[level.skill]} size={28} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Milestone star */}
      {isMilestone && isCompleted && (
        <View style={styles.starBadge}>
          <Ionicons name="star" size={18} color="#FFB800" />
        </View>
      )}

      {/* Level label */}
      <Text
        style={[
          styles.nodeLabel,
          { color: isLocked ? c.mutedForeground : c.foreground },
        ]}
        numberOfLines={1}
      >
        {level.title}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  nodeWrapper: {
    position: "absolute",
    alignItems: "center",
  },
  // 3D effect: a slightly taller background behind the main circle
  nodeDepth: {
    position: "relative",
    top: DEPTH_HEIGHT,
  },
  nodeCircle: {
    justifyContent: "center",
    alignItems: "center",
  },
  tooltip: {
    position: "absolute",
    top: -(36 + 12),
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    zIndex: 10,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  tooltipText: {
    color: "#FFFFFF",
    fontSize: fontSize.xs,
    fontFamily: fontFamily.extraBold,
    letterSpacing: 1.2,
  },
  tooltipArrow: {
    position: "absolute",
    bottom: -7,
    alignSelf: "center",
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  starBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFB800",
  },
  nodeLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semiBold,
    marginTop: spacing.sm,
    textAlign: "center",
    width: NODE_SIZE + 60,
  },
});
