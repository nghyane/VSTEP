# Mobile Practice Implementation Guide

## Overview

Practice flows for 4 VSTEP skills: Listening, Reading, Writing, Speaking.
Source of truth: `apps/frontend-v3/src/routes/_focused/` and `apps/frontend-v3/src/features/practice/`

## Practice Hub Structure

```
app/(app)/(tabs)/practice.tsx          → Practice Hub (select skill)
app/(app)/practice/listening/index.tsx → Listening exercises list
app/(app)/practice/reading/index.tsx   → Reading exercises list
app/(app)/practice/writing/index.tsx   → Writing prompts list
app/(app)/practice/speaking/index.tsx  → Speaking tasks list
```

## Listening Practice

### Flow
1. Exercise list → select exercise → do MCQ → submit → view result
2. Audio plays once, no seek/replay
3. Custom audio player (no native controls)

### API
```
GET /api/v1/practice/listening/exercises
GET /api/v1/practice/listening/exercises/{id}
POST /api/v1/practice/listening/exercises/{id}/submit
```

### Components
```tsx
// ListeningExerciseScreen
- Audio player (custom, play once)
- MCQ questions (4 options each)
- Submit button
- Result display (correct/incorrect)
```

### State
```ts
type ListeningState = {
  currentIndex: number;
  answers: Map<string, number>;
  revealed: Set<string>;
  audioPlayed: boolean;
  status: "idle" | "active" | "completed";
};
```

### Key Rules
- ❌ Do NOT use `<audio controls />` — use custom player
- ❌ Do NOT allow seek/replay in exam mode
- ✅ 3s countdown before audio play
- ✅ Progress bar shows listening time
- ✅ Auto-submit when time expires

## Reading Practice

### Flow
1. Exercise list → select exercise → read passage → do MCQ → submit → result
2. Passage scrollable independently from questions
3. Can navigate between questions

### API
```
GET /api/v1/practice/reading/exercises
GET /api/v1/practice/reading/exercises/{id}
POST /api/v1/practice/reading/exercises/{id}/submit
```

### Components
```tsx
// ReadingExerciseScreen
- Scrollable passage
- MCQ questions below passage
- Navigation (prev/next question)
- Submit button
- Result display
```

### State
```ts
type ReadingState = {
  currentIndex: number;
  answers: Map<string, number>;
  revealed: Set<string>;
  status: "idle" | "active" | "completed";
};
```

### Key Rules
- ✅ Passage scrollable independently
- ✅ Questions navigation
- ✅ Highlight passage references on question tap (optional)
- ✅ Auto-scroll to question when tapping answer

## Writing Practice

### Flow
1. Prompt list → select prompt → write essay → submit → AI grading
2. Text input with word counter
3. Grading result: strengths → improvements → rewrites

### API
```
GET /api/v1/practice/writing/prompts
GET /api/v1/practice/writing/prompts/{id}
POST /api/v1/practice/writing/prompts/{id}/submit
GET /api/v1/grading/writing/{submissionId}
```

### Components
```tsx
// WritingPromptScreen
- Prompt display
- Text input (multiline)
- Word counter
- Submit button
- Grading result screen
```

### State
```ts
type WritingState = {
  text: string;
  wordCount: number;
  status: "idle" | "writing" | "submitting" | "submitted";
};
```

### Key Rules
- ✅ Real-time word counter
- ✅ Auto-save draft every 30s (optional)
- ✅ Min/max word validation before submit
- ✅ Grading result format: Strengths → Improvements → Rewrites
- ❌ Do NOT change grading result order

## Speaking Practice

### Flow
1. Task list → select task → record audio → review → submit → AI grading
2. Recording with countdown (3, 2, 1)
3. Playback before submit

### API
```
GET /api/v1/practice/speaking/tasks
GET /api/v1/practice/speaking/tasks/{id}
POST /api/v1/practice/speaking/tasks/{id}/submit
GET /api/v1/grading/speaking/{submissionId}
```

### Components
```tsx
// SpeakingTaskScreen
- Task prompt display
- Record button with countdown
- Playback controls
- Submit button
- Grading result screen
```

### State
```ts
type SpeakingState = {
  isRecording: boolean;
  recordingDuration: number;
  audioUri: string | null;
  status: "idle" | "recording" | "review" | "submitting" | "submitted";
};
```

### Key Rules
- ✅ Countdown 3, 2, 1 before recording
- ✅ Playback for review before submit
- ✅ Max duration warning
- ✅ Permission check before recording
- ❌ Do NOT use native recording controls

## Grammar Practice

### Flow
1. Grammar point list → select point → do exercises → result
2. Exercise types: fill-in-blank, MCQ, error identification
3. FSRS adaptive difficulty

### API
```
GET /api/v1/practice/grammar/points
GET /api/v1/practice/grammar/points/{id}
POST /api/v1/practice/grammar/points/{id}/submit
```

### Key Rules
- ✅ Explanation before exercises
- ✅ Immediate feedback per exercise
- ✅ Progress tracking
- ✅ FSRS adaptive (if available)

## Vocabulary Practice

### Flow
1. Topic list → select topic → flashcard review → exercises
2. FSRS spaced repetition
3. Flashcard: show word → reveal definition → rate difficulty

### API
```
GET /api/v1/vocab/topics
GET /api/v1/vocab/topics/{id}/cards
POST /api/v1/vocab/review
```

### Key Rules
- ✅ FSRS algorithm for review timing
- ✅ Flashcard animation (flip)
- ✅ Rating: again/hard/good/easy
- ✅ Progress tracking per topic

## Shared Components

### MCQ Question
```tsx
interface MCQQuestionProps {
  question: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number | null;
  revealed: boolean;
  onSelect: (index: number) => void;
}
```

### Practice Progress Bar
```tsx
interface PracticeProgressProps {
  current: number;
  total: number;
  progress: number; // 0-1
}
```

### Result Display
```tsx
interface ResultDisplayProps {
  score: number;
  total: number;
  details: { question: string; correct: boolean }[];
  onNext: () => void;
}
```

## Anti-patterns

❌ **WRONG:** Inline audio controls
```tsx
<audio src={url} controls />
```

✅ **RIGHT:** Custom player
```tsx
<CustomAudioPlayer src={url} onProgress={handleProgress} />
```

❌ **WRONG:** Mock data in components
```tsx
const questions = [
  { id: 1, text: "Sample question", options: ["A", "B", "C", "D"] }
];
```

✅ **RIGHT:** API data
```tsx
const { data } = useQuery({ queryKey: ["exercises", id], queryFn: fetchExercise });
```

❌ **WRONG:** Scattered state
```tsx
const [currentIndex, setCurrentIndex] = useState(0);
const [answers, setAnswers] = useState({});
const [revealed, setRevealed] = useState(new Set());
```

✅ **RIGHT:** useReducer
```tsx
const [state, dispatch] = useReducer(practiceReducer, initialState);
```
