---
name: mobile-learner-flow
description: "Complete learner flow: auth → onboarding → dashboard → practice → exam → grading → result. Mirrors FE v3 and BE v2. Load BEFORE coding any learner feature."
---

# Mobile Learner Flow

## Immutable Principles

1. **Learner flow = source of truth** for all mobile features
2. **Mirror FE v3** for design, naming, flow
3. **Mirror BE v2** for API contract, response shape
4. **Do NOT invent new flows** — if FE v3 doesn't have it, ask first

## Complete Flow

```
Launch → Auth → Onboarding → Dashboard → Practice/Exam → Result
```

### 1. Launch & Auth

**Flow:**
- App opens → `_layout.tsx` restores session from SecureStore
- If no token → `/(auth)/login`
- If token but no profile → `/(app)/onboarding`
- If token + profile → tabs

**Files:**
- `app/_layout.tsx` — root provider, auth guard
- `app/(auth)/login.tsx` — login screen
- `app/(auth)/register.tsx` — register screen
- `app/(app)/onboarding.tsx` — goal setting
- `src/lib/auth.ts` — token storage (SecureStore)
- `src/hooks/use-auth.ts` — auth context

**API endpoints:**
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/complete-onboarding`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

**Rules:**
- Register: 2-step UI, 1 API call (email+password+nickname+target)
- Onboarding: select target band (B1/B2/C1) + daily study time + deadline
- Token refresh: automatic in `api.ts`, no manual handling in components
- 401 → logout → redirect to login

### 2. Dashboard

**Flow:**
- Tab "Overview" → stats, spider chart, next action
- Displays: streak, coins, progress, skill scores

**Files:**
- `app/(app)/(tabs)/index.tsx` — dashboard screen
- `src/hooks/use-progress.ts` — overview, streak data
- `src/components/SpiderChart.tsx` — radar chart
- `src/features/coin/` — coin store
- `src/features/streak/` — streak store

**API endpoints:**
- `GET /api/v1/overview` — dashboard stats
- `GET /api/v1/streak` — streak data

**Rules:**
- Spider chart only shows when ≥ 5 exams completed
- Chart = exam scores only, excludes drill scores
- Study time + streak = drill only, exam does not count

### 3. Practice Hub

**Flow:**
- Tab "Practice" → select skill → exercise list → do exercise → result
- 4 skills: Listening, Reading, Writing, Speaking
- Additional: Grammar, Vocabulary

**Files:**
- `app/(app)/(tabs)/practice.tsx` — practice hub
- `app/(app)/practice/[skill].tsx` — skill detail
- `app/(app)/practice/listening/[exerciseId].tsx`
- `app/(app)/practice/reading/[exerciseId].tsx`
- `app/(app)/practice/writing/[promptId].tsx`
- `app/(app)/practice/speaking/[taskId].tsx`
- `app/(app)/practice/grammar/[pointId]/exercise.tsx`
- `app/(app)/vocabulary/[id]/flashcard.tsx`
- `app/(app)/vocabulary/[id]/exercise.tsx`

**API endpoints:**
- `GET /api/v1/practice/exercises` — exercise list
- `POST /api/v1/practice/exercises/{id}/submit` — submit exercise
- `GET /api/v1/vocab/topics` — vocab topic list
- `GET /api/v1/vocab/topics/{id}/cards` — flashcards
- `POST /api/v1/vocab/review` — FSRS review

**Rules:**
- Listening: audio plays once, no seek/replay
- Reading: scrollable passage, MCQ below
- Writing: text input + word counter, submit → AI grading
- Speaking: record → review → submit, AI grading
- Grammar/Vocab: FSRS adaptive, not included in chart

### 4. Exam Flow

**Flow:**
- Tab "Exams" → select exam → device check → take exam → submit → result
- Phases: device-check → active → submitting → submitted

**Files:**
- `app/(app)/(tabs)/exams.tsx` — exam list
- `app/(app)/exam/[id].tsx` — exam detail
- `app/(app)/session/[id].tsx` — exam room
- `app/(app)/exam-result/[id].tsx` — exam result
- `app/(app)/grading/writing/[submissionId].tsx`
- `app/(app)/grading/speaking/[submissionId].tsx`

**API endpoints:**
- `GET /api/v1/exams` — exam list
- `GET /api/v1/exams/{id}` — exam detail
- `POST /api/v1/exams/{id}/start` — start exam
- `POST /api/v1/exam-sessions/{id}/submit` — submit exam
- `GET /api/v1/exam-sessions/{id}/result` — result

**Rules:**
- Device check mandatory before entering exam room
- Timer always visible, warning at 5 min (yellow), 1 min (red)
- Auto-submit when time expires
- Grading: Writing/Speaking → AI, async results
- Listening: audio once, no controls

### 5. Result & Grading

**Flow:**
- MCQ: instant result after submit
- Writing/Speaking: pending → AI grading → available
- Display: score, strengths, improvements, rewrites

**Files:**
- `app/(app)/practice/result/[id].tsx` — practice result
- `app/(app)/exam-result/[id].tsx` — exam result
- `app/(app)/grading/writing/[submissionId].tsx`
- `app/(app)/grading/speaking/[submissionId].tsx`

**API endpoints:**
- `GET /api/v1/submissions/{id}` — submission detail
- `GET /api/v1/grading/{id}` — grading result

**Rules:**
- Grading result format: Strengths → Improvements → Rewrites
- Do NOT change this order
- Pending state shows loading, never hidden

## State Management

- **Server state**: TanStack Query (`useQuery` + `select`)
- **Auth state**: React Context + SecureStore
- **Local state**: Zustand (coin, streak, notification)
- **Session state**: useReducer for practice/exam flow

## Anti-patterns (never do)

- ❌ Navigate in render body — use useEffect
- ❌ Direct API call in component — use useMutation
- ❌ `as` casts in business logic — discriminated union + switch
- ❌ `!` non-null assertions — early return or null check
- ❌ Mock data in components — data from API
- ❌ Hardcoded hex colors — use theme tokens
- ❌ Token manipulation outside auth store
- ❌ Optional chaining on guaranteed data

## Checklist before coding new feature

1. Read `learner-flow-parity.ts` — check feature status
2. Grep FE v3 — find similar pattern
3. Grep BE v2 routes — find API endpoint
4. Plan flow: screens → components → hooks → API
5. Confirm with team before coding > 3 files
