// Kiểu dữ liệu và storage helpers cho kết quả phòng thi.
// Lưu qua sessionStorage (mất khi đóng tab) — giống result-storage.ts.

import type {
	MCQAnswerMap,
	MockExamSession,
	SpeakingDoneSet,
	WritingAnswerMap,
} from "#/lib/mock/exam-session"

export interface QuestionTypeResult {
	readonly label: string
	readonly total: number
	readonly correct: number
	readonly wrong: number
	readonly accuracyPct: number
}

export interface PhongThiResult {
	readonly examId: string
	readonly examTitle: string
	readonly userName: string
	readonly score: number
	readonly maxScore: number
	readonly totalCorrect: number
	readonly totalAnswered: number
	readonly totalQuestions: number
	readonly questionTypes: readonly QuestionTypeResult[]
	readonly submittedAt: number
}

const RESULT_KEY = (examId: string) => `vstep:phong-thi:result:${examId}`

export function savePhongThiResult(result: PhongThiResult): void {
	try {
		sessionStorage.setItem(RESULT_KEY(result.examId), JSON.stringify(result))
	} catch {
		// ignore storage errors
	}
}

export function loadPhongThiResult(examId: string): PhongThiResult | null {
	try {
		const raw = sessionStorage.getItem(RESULT_KEY(examId))
		return raw ? (JSON.parse(raw) as PhongThiResult) : null
	} catch {
		return null
	}
}

function makeQT(label: string, total: number, correct: number): QuestionTypeResult {
	const c = Math.min(correct, total)
	return {
		label,
		total,
		correct: c,
		wrong: total - c,
		accuracyPct: total > 0 ? Math.round((c / total) * 100) : 0,
	}
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const

/**
 * Tạo "đáp án chuẩn" giả lập cho một section dựa trên sectionId.
 * Deterministic: cùng sectionId + questionIndex luôn cho cùng đáp án đúng.
 * Đảm bảo điểm thay đổi thật sự khi thí sinh chọn đáp án khác nhau.
 */
function mockCorrectLetter(sectionId: string, questionIndex: number): string {
	let seed = 0
	for (let i = 0; i < sectionId.length; i++) {
		seed = (seed * 31 + sectionId.charCodeAt(i)) >>> 0
	}
	const idx = ((seed ^ (questionIndex * 2654435761)) >>> 0) % 4
	return OPTION_LETTERS[idx] ?? "A"
}

// MCQAnswerMap value: Record<string, string> = { itemIndex(string) → letter("A"/"B"/"C"/"D") }
function gradeMcq(
	sectionId: string,
	answered: Record<string, string>,
	totalItems: number,
): { correct: number; answered: number } {
	let correct = 0
	const answeredEntries = Object.entries(answered)
	for (const [idxStr, chosen] of answeredEntries) {
		const idx = Number(idxStr)
		if (chosen === mockCorrectLetter(sectionId, idx)) correct++
	}
	return { correct, answered: Math.min(answeredEntries.length, totalItems) }
}

// Xây kết quả từ session thực + câu trả lời thực của thí sinh.
// Dùng mock answer key (deterministic hash) để chấm MCQ — điểm sẽ
// thay đổi thật sự tùy đáp án người dùng chọn.
export function buildResultFromSession(
	examId: string,
	session: MockExamSession,
	mcqAnswers: MCQAnswerMap,
	writingAnswers: WritingAnswerMap,
	speakingDone: SpeakingDoneSet,
): PhongThiResult {
	const questionTypes: QuestionTypeResult[] = []
	let totalCorrect = 0
	let totalAnswered = 0
	let totalQuestions = 0

	// Listening — chỉ các section được chọn (session đã lọc sẵn)
	for (const sec of session.listening) {
		const answered = mcqAnswers.get(sec.id) ?? {}
		const graded = gradeMcq(sec.id, answered, sec.items.length)
		questionTypes.push(makeQT(`Nghe · ${sec.partTitle}`, sec.items.length, graded.correct))
		totalCorrect += graded.correct
		totalAnswered += graded.answered
		totalQuestions += sec.items.length
	}

	// Reading — chỉ các passage được chọn
	for (const passage of session.reading) {
		const answered = mcqAnswers.get(passage.id) ?? {}
		const graded = gradeMcq(passage.id, answered, passage.items.length)
		questionTypes.push(makeQT(`Đọc · ${passage.title}`, passage.items.length, graded.correct))
		totalCorrect += graded.correct
		totalAnswered += graded.answered
		totalQuestions += passage.items.length
	}

	// Writing — chỉ thêm nếu có task được chọn vào session
	if (session.writing.length > 0) {
		const writingDone = session.writing.filter(
			(t) => (writingAnswers.get(t.id) ?? "").trim().length > 0,
		)
		questionTypes.push(makeQT("Viết", session.writing.length, writingDone.length))
		totalCorrect += writingDone.length
		totalAnswered += writingDone.length
		totalQuestions += session.writing.length
	}

	// Speaking — chỉ thêm nếu có part được chọn vào session
	if (session.speaking.length > 0) {
		const speakingCount = session.speaking.filter((p) => speakingDone.has(p.id)).length
		questionTypes.push(makeQT("Nói", session.speaking.length, speakingCount))
		totalCorrect += speakingCount
		totalAnswered += speakingCount
		totalQuestions += session.speaking.length
	}

	const score = Math.min(4, parseFloat(((totalCorrect / Math.max(totalQuestions, 1)) * 4).toFixed(1)))

	return {
		examId,
		examTitle: session.title,
		userName: "Thí sinh",
		score,
		maxScore: 4,
		totalCorrect,
		totalAnswered,
		totalQuestions,
		questionTypes,
		submittedAt: Date.now(),
	}
}

// Fallback khi không có session (mở thẳng URL ket-qua).
export function buildMockResult(examId: string): PhongThiResult {
	return {
		examId,
		examTitle: `Đề thi thử số ${examId}`,
		userName: "Thí sinh",
		score: 0,
		maxScore: 4,
		totalCorrect: 0,
		totalAnswered: 0,
		totalQuestions: 0,
		questionTypes: [],
		submittedAt: Date.now(),
	}
}
