// Shared depth border styles — Duolingo 3D card (frontend-v3 .card class)
// .card { border: 2px solid border; border-bottom-width: 4px }
import { StyleSheet } from "react-native";

/** Neutral depth — synced with frontend-v3 .card */
export const depthNeutral = {
  borderWidth: 2,
  borderBottomWidth: 4,
  borderColor: "#E5E5E5",
  borderBottomColor: "#CACACA",
} as const;

/** Semantic depth — for skill/status accent cards */
export function depthSemantic(color: string) {
  return {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: color + "40",
    borderBottomColor: color + "80",
  };
}

export const depth = StyleSheet.create({
  card: { ...depthNeutral, backgroundColor: "#FFFFFF" },
});
