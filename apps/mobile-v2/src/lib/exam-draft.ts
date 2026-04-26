import { Directory, File } from "expo-file-system";

const DRAFT_DIR = new Directory("file:///drafts/");

export interface ExamDraft {
  sessionId: string;
  examId: string;
  skillIdx: number;
  mcqAnswers: Record<string, number>;
  writingAnswers: Record<string, string>;
  speakingMarks: Record<string, string>;
  savedAt: string;
}

async function ensureDir(): Promise<void> {
  if (!DRAFT_DIR.exists) {
    try { DRAFT_DIR.create({ intermediates: true, idempotent: true }); } catch { /* ignore */ }
  }
}

function fileFor(sessionId: string): File {
  return DRAFT_DIR.createFile(`${sessionId}.json`, "application/json");
}

export async function saveDraft(draft: ExamDraft): Promise<void> {
  try {
    await ensureDir();
    const f = fileFor(draft.sessionId);
    f.write(JSON.stringify(draft));
  } catch {
    // silent fail — draft is non-critical
  }
}

export async function loadDraft(sessionId: string): Promise<ExamDraft | null> {
  try {
    await ensureDir();
    const f = fileFor(sessionId);
    if (!f.exists) return null;
    const raw = await f.text();
    return JSON.parse(raw) as ExamDraft;
  } catch {
    return null;
  }
}

export async function clearDraft(sessionId: string): Promise<void> {
  try {
    const f = fileFor(sessionId);
    if (f.exists) f.delete();
  } catch {
    // silent
  }
}
