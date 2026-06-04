// Translate utility — wraps the free Google Translate web endpoint used by
// frontend-v3 (apps/frontend-v3/src/lib/utils.ts `translateText`). No API key.
// Returns the original text on any failure so callers can render safely.
//
// Used by ConversationTurnView and ShadowingSegmentCard for inline Vietnamese
// translation of English content.

const TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";

interface RawSegment {
  0?: string;
}

export async function translateText(
  text: string,
  from = "en",
  to = "vi",
): Promise<string> {
  if (!text.trim()) return text;
  try {
    return await translateTextStrict(text, from, to);
  } catch {
    return text;
  }
}

export async function translateTextStrict(
  text: string,
  from = "en",
  to = "vi",
): Promise<string> {
  if (!text.trim()) return text;
  const url = `${TRANSLATE_URL}?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translate failed: ${res.status}`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error("Translate response is not an array");
  const segments = data[0];
  if (!Array.isArray(segments)) throw new Error("Translate response has no segments");
  return segments
    .map((seg) => (Array.isArray(seg) ? (seg as RawSegment)[0] ?? "" : ""))
    .join("");
}
