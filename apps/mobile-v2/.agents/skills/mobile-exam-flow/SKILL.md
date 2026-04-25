---
name: mobile-exam-flow
description: "Exam session flow: device check, timed sections, audio listening, submission, results. Matches VSTEP exam format. Load when implementing exam features."
---

# Mobile Exam Flow

## Exam Session Lifecycle

```
Exam Detail → Device Check → Exam Active → Submit → Result
```

**Phases:**
1. `device-check` — verify microphone, camera, audio before exam
2. `active` — exam in progress with timer
3. `submitting` — API call to submit
4. `submitted` — exam result page

**Phase transitions are strict:** cannot skip device-check.

## Exam Room Screen

```tsx
// app/(app)/session/[id].tsx
import { useExamSession } from "@/hooks/use-exam-session";

function ExamRoom({ sessionId }: { sessionId: string }) {
  const { session, dispatch, phase } = useExamSession(sessionId);

  if (phase === "device-check") return <DeviceCheckScreen />;
  if (phase === "active") return <ExamContent session={session} />;
  if (phase === "submitting") return <SubmittingOverlay />;
  return <ExamResult sessionId={sessionId} />;
}
```

**Key rules:**
- `gestureEnabled: false` — prevent swipe away during exam
- Timer visible at top
- Sections navigable via tabs
- Auto-submit on time expiration

## Device Check

```tsx
// Components: microphone test, camera test, audio test
<DepthCard>
  <Text style={{ fontFamily: fontFamily.bold }}>Device Check</Text>
  <MicrophoneTest />
  <CameraTest />
  <AudioTest />
  <DepthButton onPress={() => dispatch({ type: "START_EXAM" })}>
    Start Exam
  </DepthButton>
</DepthCard>
```

## Exam Content by Skill

### Listening Section
- Audio plays ONCE — custom player, no native controls
- Questions MCQ (4 options)
- 30s countdown before audio auto-play
- Progress bar at bottom
- **Cannot pause/rewind** during exam

### Reading Section
- Passage displayed scrollable
- MCQ questions below
- Timer at top
- Navigation between questions

### Writing Section
- Text input with word counter
- Timer visible
- Auto-save draft every 30s
- Submit button with confirmation modal

### Speaking Section
- Record button with countdown
- Playback before submit
- Timer per part
- Submit all parts at end

## Timer

```tsx
// Countdown timer
const [timeLeft, setTimeLeft] = useState(session.durationMinutes * 60);

useEffect(() => {
  if (timeLeft <= 0) {
    handleSubmit();
    return;
  }
  const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
  return () => clearInterval(timer);
}, [timeLeft]);
```

**Rules:**
- Timer always visible during exam
- Warning at 5 minutes remaining (yellow)
- Warning at 1 minute remaining (red)
- Auto-submit at 0

## Submission

```tsx
// Submit flow
const mutation = useMutation({
  mutationFn: () => api.post(`/api/v1/exam-sessions/${sessionId}/submit`),
  onSuccess: () => router.replace(`/exam-result/${sessionId}`),
});

// Confirmation modal
<Modal visible={showConfirm}>
  <Text>Confirm submission?</Text>
  <DepthButton variant="destructive" onPress={() => mutation.mutate()}>
    Submit
  </DepthButton>
</Modal>
```

## Exam Result

```tsx
// app/(app)/exam-result/[id].tsx
// Show: overall score, per-skill scores, correct/incorrect breakdown
<SpiderChart data={currentScores} target={targetScores} />
<DepthCard>
  <Text>Overall Score: {score}/10</Text>
  {skills.map((skill) => (
    <SkillScore key={skill} {...skill} />
  ))}
</DepthCard>
```

**Grading flow:**
- MCQ: instant score
- Writing/Speaking: pending → AI grading → result
- Show grading status: `pending | processing | completed`
