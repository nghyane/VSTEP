---
name: mobile-audio-video
description: "Audio playback, recording, TTS, video handling with expo-av and expo-speech. VSTEP exam audio rules. Load when implementing audio/video features."
---

# Mobile Audio & Video Patterns

## Audio Playback (Listening Exam)

```tsx
import { Audio } from "expo-av";

// Load and play audio ONCE
const { sound } = await Audio.Sound.createAsync(
  { uri: audioUrl },
  { shouldPlay: true, isLooping: false }
);

// Track progress
sound.setOnPlaybackStatusUpdate((status) => {
  if (status.isLoaded) {
    const progress = status.positionMillis / status.durationMillis;
    setProgress(progress);
  }
});
```

**Key Rules:**
- **NO native controls** during exam — use custom UI
- **Play once only** — cannot replay, cannot seek
- Hidden audio element with custom progress bar
- 3-second countdown before auto-play starts
- Cleanup: `await sound.unloadAsync()` on unmount

## Audio Recording (Speaking Exam)

```tsx
import { Audio } from "expo-av";

// Start recording
const { recording } = await Audio.Recording.createAsync(
  Audio.RecordingOptionsPresets.HIGH_QUALITY
);

// Stop and get file
await recording.stopAndUnloadAsync();
const uri = recording.getURI();
```

**Key Rules:**
- Request permissions first: `Audio.requestPermissionsAsync()`
- Show countdown before recording starts (3, 2, 1)
- Playback for review before submit
- Max duration per part (configurable)
- Cleanup: `recording.unlinkAsync()` if user cancels
- **NO `as any`** — use proper FormData typing for upload

## Text-to-Speech (Shadowing Practice)

```tsx
import * as Speech from "expo-speech";

// Speak text
Speech.speak(text, {
  language: "en-US",
  pitch: 1.0,
  rate: 0.9,
});

// Stop
Speech.stop();

// Check if speaking
Speech.isSpeakingAsync().then((speaking) => {
  if (speaking) setSpeakingState(true);
});
```

**Key Rules:**
- Use for pronunciation practice (shadowing mode)
- Allow speed control: `rate: 0.7 | 0.8 | 0.9 | 1.0`
- Show highlighted word being spoken
- Cannot use during exam — practice mode only

## Permission Handling

```tsx
import { Audio } from "expo-av";

async function checkPermissions() {
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Microphone permission required",
      "Please grant microphone access in settings to use the speaking practice feature.",
      [{ text: "OK" }]
    );
    return false;
  }
  return true;
}
```

## Custom Audio Player UI

```tsx
// Progress bar
<Slider
  value={progress}
  onValueChange={(value) => {
    // Only allow seek during practice, not exam
    if (!isExam) sound.setPositionAsync(value * duration);
  }}
  disabled={isExam}
/>

// Play/Pause button
<HapticTouchable onPress={isPlaying ? pause : play}>
  <Ionicons name={isPlaying ? "pause" : "play"} size={24} />
</HapticTouchable>
```

## Audio States

```tsx
type AudioState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; duration: number }
  | { kind: "playing"; position: number; duration: number }
  | { kind: "paused"; position: number; duration: number }
  | { kind: "ended" };
```

Use discriminated union for audio state — no `as` casts, exhaustive switch.
