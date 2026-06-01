// Types synced with backend-v2 McqPracticeController responses

export interface ListeningExercise {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  part: number;
  audioUrl: string;
  transcript: string | null;
  vietnameseTranscript: string | null;
  keywords: string[];
  estimatedMinutes: number | null;
}

export interface ReadingExercise {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  part: number;
  passage: string;
  vietnameseTranslation: string | null;
  keywords: string[];
  estimatedMinutes: number | null;
}

export interface McqQuestion {
  id: string;
  displayOrder: number;
  question: string;
  options: string[];
  // correct_index only present after submit
  correctIndex?: number;
  explanation?: string;
}

export interface McqExerciseDetail<T> {
  exercise: T;
  questions: McqQuestion[];
}

export interface McqSession {
  id: string;
  module: string;
  startedAt: string;
}

export interface McqSubmitResult {
  score: number;
  total: number;
  items: {
    questionId: string;
    isCorrect: boolean;
    correctIndex: number;
    explanation: string;
  }[];
  session: McqSession;
}

export interface SupportResult {
  coinsSpent: number;
  balanceAfter: number;
}
