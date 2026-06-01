// Skill config — aligned with frontend-v3 lib/skills.ts
export type SkillKey = "listening" | "reading" | "writing" | "speaking";

export interface Skill {
  key: SkillKey;
  label: string;
  en: string;
  desc: string;
  color: string;
}

export const skills: readonly Skill[] = [
  { key: "listening", label: "Nghe", en: "Listening", desc: "3 phần · nghe hiểu", color: "#1CB0F6" },
  { key: "reading", label: "Đọc", en: "Reading", desc: "4 đoạn văn · đọc hiểu", color: "#7850C8" },
  { key: "writing", label: "Viết", en: "Writing", desc: "Thư + luận · AI chấm", color: "#58CC02" },
  { key: "speaking", label: "Nói", en: "Speaking", desc: "3 phần · ghi âm + AI", color: "#FFC800" },
];

export function skillByKey(key: string): Skill | undefined {
  return skills.find((s) => s.key === key);
}
