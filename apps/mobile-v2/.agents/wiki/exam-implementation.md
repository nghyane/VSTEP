# Mobile Exam Implementation Guide

## Overview

Exam flows matching VSTEP format: device check → timed exam → submission → results.
Source of truth: `apps/frontend-v3/src/routes/_focused/phong-thi/` and `apps/frontend-v3/src/features/exam/`

## Exam Flow

```
Exam List → Exam Detail → Device Check → Exam Room → Submit → Result → Grading
```

## Exam List Screen

### API
```
GET /api/v1/exams
```

### Components
```tsx
// ExamListScreen
- List of available exams
- Filter by type (practice/mock/placement)
- Show best score, attempt count
- Tap → exam detail
```

### Data
```ts
interface Exam {
  id: string;
  title: string;
  description: string | null;
  type: "practice" | "mock" | "placement";
  skill: "listening" | "reading" | "writing" | "speaking" | "mixed";
  totalDurationMinutes: number;
  bestScore?: number | null;
  attemptCount?: number;
}
```

## Exam Detail Screen

### API
```
GET /api/v1/exams/{id}
POST /api/v1/exams/{id}/start
```

### Components
```tsx
// ExamDetailScreen
- Exam title, description
- Duration, type, skill info
- Previous attempts (if any)
- "Start Exam" button → device check
```

### Flow
1. Load exam details
2. Check if user has active session
3. If yes → resume session
4. If no → show "Start Exam"
5. Button click → navigate to device check

## Device Check Screen

### Components
```tsx
// DeviceCheckScreen
- Microphone test
- Camera test (if needed)
- Audio test (play sample)
- Instructions/notes
- "Start Exam" button
```

### Flow
1. Test microphone (record 3s → playback)
2. Test audio (play sample → confirm heard)
3. Show exam instructions
4. "Start Exam" → create session → exam room

### API
```
POST /api/v1/exam-sessions  // Create new session
```

## Exam Room Screen

### API
```
GET /api/v1/exam-sessions/{id}  // Session data
POST /api/v1/exam-sessions/{id}/submit  // Submit exam
```

### Components
```tsx
// ExamRoomScreen
- Timer (top bar)
- Section tabs (Listening/Reading/Writing/Speaking)
- Content area (depends on section)
- Navigation (prev/next question)
- Submit button (confirmation modal)
```

### Phase Machine
```ts
type ExamPhase = 
  | { kind: "device-check" }
  | { kind: "active"; section: number }
  | { kind: "submitting" }
  | { kind: "submitted"; sessionId: string };
```

### State
```ts
type ExamState = {
  phase: ExamPhase;
  currentSection: number;
  answers: Record<string, string>;
  timeLeft: number;
  sessionId: string;
};

type ExamAction =
  | { type: "START_EXAM" }
  | { type: "ANSWER"; questionId: string; value: string }
  | { type: "NEXT_SECTION" }
  | { type: "PREV_SECTION" }
  | { type: "SUBMIT" }
  | { type: "TICK"; seconds: number };
```

### Timer Rules
- ⏱️ Countdown from `totalDurationMinutes * 60`
- 🟡 Warning at 5 minutes remaining
- 🔴 Warning at 1 minute remaining
- ⏹️ Auto-submit when time expires
- ⏸️ Do NOT pause timer

### Navigation Rules
- ❌ Disable swipe back gesture
- ❌ Disable hardware back button (Android)
- ✅ Tab navigation between sections
- ✅ Navigate between questions within section
- ⚠️ Confirmation modal when switching section (if not all answered)

## Exam Sections

### Listening Section
```tsx
// ListeningExamSection
- Audio player (play once, no controls)
- 3s countdown before play
- MCQ questions (4 options each)
- Progress bar
- Navigation (prev/next question)
```

**API:**
```
GET /api/v1/exam-sessions/{id}/listening  // Section data
POST /api/v1/exam-sessions/{id}/listening/submit  // Submit section
```

**Rules:**
- ❌ Do NOT seek/replay audio
- ❌ Do NOT pause audio
- ✅ 3s countdown before play
- ✅ Auto-play audio after countdown
- ✅ Progress bar shows listening time
- ✅ Submit section → move to Reading

### Reading Section
```tsx
// ReadingExamSection
- Scrollable passage
- MCQ questions below passage
- Timer
- Navigation (prev/next question)
```

**API:**
```
GET /api/v1/exam-sessions/{id}/reading  // Section data
POST /api/v1/exam-sessions/{id}/reading/submit  // Submit section
```

**Rules:**
- ✅ Passage scrollable independently
- ✅ Questions navigation
- ✅ Highlight passage references (optional)
- ✅ Submit section → move to Writing

### Writing Section
```tsx
// WritingExamSection
- Prompt display
- Text input (multiline)
- Word counter
- Timer
- Submit button
```

**API:**
```
POST /api/v1/exam-sessions/{id}/writing/submit  // Submit section
```

**Rules:**
- ✅ Min/max word validation
- ✅ Auto-save draft every 30s
- ✅ Submit section → move to Speaking
- ❌ Do NOT paste text from clipboard (exam mode)

### Speaking Section
```tsx
// SpeakingExamSection
- Task prompt display
- Record button with countdown
- Playback controls
- Timer
- Submit all button
```

**API:**
```
POST /api/v1/exam-sessions/{id}/speaking/submit  // Submit section
```

**Rules:**
- ✅ Countdown 3, 2, 1 before recording
- ✅ Playback for review
- ✅ Max duration warning
- ✅ Submit all → exam complete

## Exam Submission

### Flow
1. User clicks "Submit Exam"
2. Confirmation modal appears
3. User confirms → API call
4. Loading overlay during submit
5. Success → navigate to exam result
6. Fail → show error, stay in exam room

### API
```
POST /api/v1/exam-sessions/{id}/submit
```

### Response
```ts
interface SubmitResponse {
  sessionId: string;
  status: "submitted" | "processing";
  message?: string;
}
```

## Exam Result Screen

### API
```
GET /api/v1/exam-sessions/{id}/result
```

### Components
```tsx
// ExamResultScreen
- Overall score
- Per-skill scores
- Correct/incorrect breakdown
- Spider chart (vs target)
- Strengths/Improvements
- "Retake" button (if practice exam)
```

### Data
```ts
interface ExamResult {
  sessionId: string;
  overallScore: number;
  skillScores: {
    listening: number | null;
    reading: number | null;
    writing: number | null;
    speaking: number | null;
  };
  band: "B1" | "B2" | "C1" | null;
  details: {
    section: string;
    score: number;
    total: number;
    correct: number;
  }[];
}
```

## Grading Flow (Writing/Speaking)

### Status Machine
```ts
type GradingStatus = 
  | { kind: "pending" }
  | { kind: "processing" }
  | { kind: "completed"; result: GradingResult }
  | { kind: "failed"; error: string };
```

### API
```
GET /api/v1/grading/writing/{submissionId}
GET /api/v1/grading/speaking/{submissionId}
```

### Response
```ts
interface GradingResult {
  submissionId: string;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  rewrites: {
    original: string;
    improved: string;
    explanation: string;
  }[];
}
```

### Rules
- ✅ Grading result format: Strengths → Improvements → Rewrites
- ❌ Do NOT change this order
- ✅ Poll status every 30s when pending/processing
- ✅ Show loading state, do NOT hide screen
- ✅ Auto-redirect when completed

## Anti-patterns

❌ **WRONG:** Allow swipe back during exam
```tsx
<Stack.Screen name="session/[id]" options={{ gestureEnabled: true }} />
```

✅ **RIGHT:** Disable gesture
```tsx
<Stack.Screen name="session/[id]" options={{ gestureEnabled: false }} />
```

❌ **WRONG:** Audio controls in exam
```tsx
<audio src={url} controls />
```

✅ **RIGHT:** Custom player
```tsx
<CustomAudioPlayer 
  src={url} 
  onProgress={handleProgress}
  disabled={isExam}
/>
```

❌ **WRONG:** Auto-advance questions without confirmation
```tsx
const handleNext = () => setCurrentIndex(i + 1);
```

✅ **RIGHT:** Check answered first
```tsx
const handleNext = () => {
  if (!answers[currentId]) {
    Alert.alert("Unanswered", "Are you sure you want to skip this question?");
  }
  setCurrentIndex(i + 1);
};
```

❌ **WRONG:** Submit exam without confirmation
```tsx
const handleSubmit = () => api.post(`/exam-sessions/${id}/submit`);
```

✅ **RIGHT:** Confirmation modal
```tsx
const handleSubmit = () => {
  Alert.alert(
    "Confirm submission?",
    "You cannot edit after submitting.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Submit", onPress: () => mutation.mutate(id) }
    ]
  );
};
```

## Checklist before coding exam feature

1. [ ] Read `learner-flow-parity.ts` — check exam status
2. [ ] Grep FE v3 `src/features/exam/` — find similar pattern
3. [ ] Grep BE v2 routes — find API endpoints
4. [ ] Plan phases: device-check → active → submitting → submitted
5. [ ] Setup timer with auto-submit
6. [ ] Disable gestures for exam screens
7. [ ] Test audio playback (once only)
8. [ ] Test submission flow
9. [ ] Test result display
10. [ ] Test grading poll (if writing/speaking)
