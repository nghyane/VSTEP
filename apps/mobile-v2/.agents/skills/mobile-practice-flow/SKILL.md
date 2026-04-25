---
name: mobile-practice-flow
description: "Practice session flows for all 4 skills: Listening, Reading, Writing, Speaking. Audio, voice, MCQ, exercise patterns. Load when implementing practice features."
---

# Mobile Practice Flow

## Session Architecture

```
Practice Hub → Skill Selection → Exercise List → Exercise Detail → Result
```

- Each skill: `practice/{skill}/index.tsx` → `practice/{skill}/{exerciseId}.tsx`
- Result screen: `practice/result/{id}.tsx`
- Session state: `useReducer` for index + answers + revealed state

## Listening Practice

```tsx
// app/(app)/practice/listening/[exerciseId].tsx
import { Audio } from "expo-av";

// Audio: play once only, no native controls
const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
await sound.playAsync();

// MCQ with immediate feedback
<MCQQuestion
  options={item.options}
  selectedIndex={selected}
  onSelect={(idx) => {
    dispatch({ type: "answer", questionId: item.id, selectedIndex: idx });
  }}
  revealed={showResult}
/>
```

**Key rules:**
- Audio plays ONCE only — no seek, no replay during exam
- Hidden `<audio>` + custom progress bar
- Listening readiness modal with 3s countdown before audio start
- MCQ options: 4 choices, color-coded on select

## Reading Practice

```tsx
// app/(app)/practice/reading/[exerciseId].tsx
import { ScrollView, Text, View } from "react-native";

// Passage scrollable, MCQ below
<ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
  <Text style={{ fontFamily: fontFamily.regular, fontSize: fontSize.base, lineHeight: 24 }}>
    {passage}
  </Text>
  {questions.map((q, i) => (
    <MCQQuestion key={q.id} {...q} revealed={showResult} />
  ))}
</ScrollView>
```

**Key rules:**
- Passage scrollable independently
- Questions visible below passage
- MCQ with immediate feedback (same as listening)
- Highlight passage references on question tap

## Writing Practice

```tsx
// app/(app)/practice/writing/[promptId].tsx
import { TextInput } from "react-native";

// Text area with word counter
<TextInput
  multiline
  value={text}
  onChangeText={setText}
  style={{ minHeight: 200, padding: spacing.lg }}
/>
<Text style={{ color: colors.light.subtle }}>
  {wordCount(text)} / {minWords} words
</Text>
```

**Key rules:**
- `expo-image-picker` for photo upload (if needed)
- Word counter real-time
- Submit → AI grading endpoint
- Grading result: `practice/writing/[submissionId].tsx`
- Show: strengths → improvements → rewrites

## Speaking Practice

```tsx
// app/(app)/practice/speaking/[taskId].tsx
import { Audio } from "expo-av";

// Record audio
const { recording } = await Audio.Recording.createAsync(
  Audio.RecordingOptionsPresets.HIGH_QUALITY
);
await recording.stopAndUnloadAsync();
const uri = recording.getURI();
```

**Key rules:**
- Record → stop → review → submit flow
- Playback before submit for user review
- `expo-speech` for TTS practice (shadowing)
- Grading result: `practice/speaking/[submissionId].tsx`
- Show: pronunciation → fluency → feedback

## Practice Hub

```tsx
// app/(app)/practice/index.tsx
const SKILLS = [
  { key: "listening", label: "Listening", color: "#1CB0F6", icon: "headphones" },
  { key: "reading", label: "Reading", color: "#7850C8", icon: "book" },
  { key: "writing", label: "Writing", color: "#58CC02", icon: "pencil" },
  { key: "speaking", label: "Speaking", color: "#FFC800", icon: "microphone" },
] as const;
```

- Grid of skill cards with mascot per skill
- Show progress per skill (if available)
- Tap → skill-specific practice screen

## Grammar & Vocabulary

- Grammar: `practice/grammar/[pointId]/exercise.tsx` — fill-in-blank, MCQ
- Vocabulary: `vocabulary/[id]/flashcard.tsx` — FSRS flashcard review
- Both follow same session pattern: index → exercise → result
