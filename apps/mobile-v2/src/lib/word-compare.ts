// Word comparison for Shadowing — alignment-based scoring.
// Ported from apps/frontend-v3/src/lib/utils.ts (compareWords + levenshtein +
// matchScore). Used to grade each shadowing attempt against the target
// segment text.

export type WordAccuracy = "correct" | "wrong" | "close";

export interface WordCompareResult {
  word: string;
  accuracy: WordAccuracy;
  userSaid?: string;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function matchScore(a: string, b: string): number {
  if (a === b) return 3;
  if (a.length > 3 && levenshtein(a, b) <= 2) return 2;
  if (b.includes(a) || a.includes(b)) return 1;
  return 0;
}

export function compareWords(
  original: string,
  transcript: string,
): { results: WordCompareResult[]; correct: number } {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[.,!?;:'"]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  const origWords = clean(original);
  const userWords = clean(transcript);

  const m = origWords.length;
  const n = userWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const s = matchScore(origWords[i - 1], userWords[j - 1]);
      dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1] + s);
    }
  }

  const alignment: (number | null)[] = new Array<number | null>(m).fill(null);
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    const s = matchScore(origWords[i - 1], userWords[j - 1]);
    if (dp[i][j] === dp[i - 1][j - 1] + s && s > 0) {
      alignment[i - 1] = j - 1;
      i--;
      j--;
    } else if (dp[i][j] === dp[i - 1][j]) {
      i--;
    } else {
      j--;
    }
  }

  let correct = 0;
  const results: WordCompareResult[] = origWords.map((w, idx) => {
    const uIdx = alignment[idx];
    if (uIdx === null) {
      const merged = userWords.find((uw) => uw.includes(w) && uw !== w);
      return { word: w, accuracy: "wrong", userSaid: merged };
    }
    const uw = userWords[uIdx];
    if (uw === w) {
      correct++;
      return { word: w, accuracy: "correct", userSaid: uw };
    }
    if (w.length > 3 && levenshtein(w, uw) <= 2) {
      correct++;
      return { word: w, accuracy: "close", userSaid: uw };
    }
    if (uw.includes(w) || w.includes(uw)) {
      correct++;
      return { word: w, accuracy: "close", userSaid: uw };
    }
    return { word: w, accuracy: "wrong", userSaid: uw };
  });
  return { results, correct };
}
