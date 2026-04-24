// Synced with backend-v2 GrammarController + frontend-v3 grammar/types.ts

export interface GrammarPoint {
  id: string;
  slug: string;
  name: string;
  vietnameseName: string | null;
  summary: string | null;
  category: string | null;
  displayOrder: number;
  levels: string[];
  tasks: string[];
  functions: string[];
}

export interface GrammarStructure { id: string; template: string; description: string | null; }
export interface GrammarExample { id: string; en: string; vi: string; note: string | null; }
export interface GrammarMistake { id: string; wrong: string; correct: string; explanation: string | null; }
export interface GrammarVstepTip { id: string; task: string; tip: string; example: string | null; }

export type GrammarExercise =
  | { id: string; kind: "mcq"; payload: { prompt: string; options: string[] }; displayOrder: number }
  | { id: string; kind: "error_correction"; payload: { sentence: string; errorStart: number; errorEnd: number }; displayOrder: number }
  | { id: string; kind: "fill_blank"; payload: { template: string }; displayOrder: number }
  | { id: string; kind: "rewrite"; payload: { instruction: string; original: string }; displayOrder: number };

export interface GrammarMastery {
  attempts: number;
  correct: number;
  accuracyPercent: number;
  computedLevel: string;
  lastPracticedAt: string | null;
}

export interface GrammarPointDetail {
  point: GrammarPoint;
  structures: GrammarStructure[];
  examples: GrammarExample[];
  commonMistakes: GrammarMistake[];
  vstepTips: GrammarVstepTip[];
  exercises: GrammarExercise[];
  mastery: GrammarMastery | null;
}

export interface GrammarAttemptResponse {
  attemptId: string;
  isCorrect: boolean;
  explanation: string;
  mastery: GrammarMastery;
}
