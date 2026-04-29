# Web Speech API — Voice quality on Chromium

## Triệu chứng

Trên desktop Chrome/Edge, voice mặc định là **Microsoft David** (en-US) sẽ clip ~500-800ms đầu của mọi utterance, kể cả lần play đầu tiên (chưa có gì để cancel). Lý do là TTS engine có "cold start" — buffer chưa kịp ramp up. Trên iOS/Android, OS voice (Apple Siri / Google Speech Services) phát instant nên không gặp.

## Fix

Pick voice theo priority list ưu tiên Microsoft Online voices (Azure Neural TTS):

```ts
const VOICE_PREFERENCE = [
  "Microsoft Aria Online",       // 1. Natural, clean start
  "Microsoft Jenny Online",
  "Microsoft Guy Online",
  "Microsoft Ana Online",
  "Microsoft AvaMultilingual Online",
  "Microsoft AndrewMultilingual Online",
  "Google US English",            // 5. Remote nhưng giọng tự nhiên
  "Microsoft Zira",               // 6. Local backup, ổn hơn David
  "Microsoft Mark",
  "Samantha",                     // 8. macOS
  "Alex",
] as const
```

Browser pick voice theo thứ tự: rank match trong list → en-US match → localService preference. Microsoft David **không có trong list** vì hay clip — nếu OS chỉ có David thì engine vẫn fallback về cuối list, nhưng trường hợp này hiếm vì Edge có sẵn voice Online.

## Đã thử và không hiệu quả

- `setTimeout(150ms)` sau `cancel()` trước `speak()` → race window vẫn còn
- `queueMicrotask` defer → quá ngắn, vẫn race
- Primer utterance `volume=0` `text=" "` → primer cũng phải qua engine → vẫn clip
- Prefix `". . . "` (silence syllables) → workable nhưng nghe pause khó chịu
- `synth.paused` recovery → không liên quan; paused state chỉ xảy ra khi unmount mid-speech, không ảnh hưởng cold start

## Caller pattern

`speak(text, { rate?, onEnd? })` shared trong `lib/utils.ts`. Nếu cần await (drill phát âm) → wrap promise:
```ts
function speakText(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => speak(text, { rate, onEnd: resolve }))
}
```

`stopSpeaking()` chỉ cần khi route unmount **giữa lúc utterance dài đang phát** (drill phát âm). Phần vocab (từ ngắn) không cần — utterance phát xong tự nhiên.

KHÔNG dùng `useEffect(() => stopSpeaking, [])` vì StrictMode dev mount→unmount→mount sẽ fire `cancel()` ngay sau `speak()` → trigger error `interrupted`.

---
See also: [[anti-patterns]]
