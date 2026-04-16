// Kiểu dữ liệu và storage helpers cho kết quả phòng thi.
// Lưu qua sessionStorage (mất khi đóng tab) — giống result-storage.ts.

import type {
	MCQAnswerMap,
	MockExamSession,
	SpeakingDoneSet,
	WritingAnswerMap,
} from "#/lib/mock/exam-session"

export interface QuestionItemResult {
	readonly no: number
	readonly answered: boolean
	readonly correct: boolean
	/** Chữ cái thí sinh chọn ("A"–"D") hoặc "—" nếu bỏ qua */
	readonly userLetter: string
	/** Đáp án đúng theo mock key ("A"–"D") hoặc "" nếu không phải MCQ */
	readonly correctLetter: string
}

export interface QuestionTypeResult {
	readonly label: string
	readonly total: number
	readonly correct: number
	readonly wrong: number
	readonly accuracyPct: number
	/** Per-question breakdown — chỉ có với MCQ sections */
	readonly items: readonly QuestionItemResult[]
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
const PHONG_THI_MAX_SCORE = 10

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

const OPTION_LETTERS = ["A", "B", "C", "D"] as const

function mockCorrectLetter(sectionId: string, questionNo: number): string {
	let seed = 0
	for (let i = 0; i < sectionId.length; i++) {
		seed = (seed * 31 + sectionId.charCodeAt(i)) >>> 0
	}
	const idx = ((seed ^ (questionNo * 2654435761)) >>> 0) % 4
	return OPTION_LETTERS[idx] ?? "A"
}

// MCQAnswerMap value: Record<string, string> = { no(string, 1-based) → letter }
function gradeMcq(
	sectionId: string,
	answered: Record<string, string>,
	totalItems: number,
): { correct: number; answered: number; items: QuestionItemResult[] } {
	let correct = 0
	let answeredCount = 0
	const items: QuestionItemResult[] = []

	for (let no = 1; no <= totalItems; no++) {
		const userLetter = answered[String(no)] ?? ""
		const correctLetter = mockCorrectLetter(sectionId, no)
		const isAnswered = userLetter.length > 0
		const isCorrect = isAnswered && userLetter === correctLetter
		if (isAnswered) answeredCount++
		if (isCorrect) correct++
		items.push({
			no,
			answered: isAnswered,
			correct: isCorrect,
			userLetter: isAnswered ? userLetter : "—",
			correctLetter,
		})
	}

	return { correct, answered: answeredCount, items }
}

function makeQT(
	label: string,
	total: number,
	correct: number,
	items: QuestionItemResult[],
): QuestionTypeResult {
	const c = Math.min(correct, total)
	return {
		label,
		total,
		correct: c,
		wrong: total - c,
		accuracyPct: total > 0 ? Math.round((c / total) * 100) : 0,
		items,
	}
}

function makeNonMcqItems(ids: string[], doneSet: ReadonlySet<string> | null): QuestionItemResult[] {
	return ids.map((id, i) => {
		const done = doneSet ? doneSet.has(id) : false
		return { no: i + 1, answered: done, correct: done, userLetter: "", correctLetter: "" }
	})
}

// Xây kết quả từ session thực + câu trả lời thực của thí sinh.
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

	for (const sec of session.listening) {
		const answered = mcqAnswers.get(sec.id) ?? {}
		const graded = gradeMcq(sec.id, answered, sec.items.length)
		questionTypes.push(
			makeQT(`Nghe · ${sec.partTitle}`, sec.items.length, graded.correct, graded.items),
		)
		totalCorrect += graded.correct
		totalAnswered += graded.answered
		totalQuestions += sec.items.length
	}

	for (const passage of session.reading) {
		const answered = mcqAnswers.get(passage.id) ?? {}
		const graded = gradeMcq(passage.id, answered, passage.items.length)
		questionTypes.push(
			makeQT(`Đọc · ${passage.title}`, passage.items.length, graded.correct, graded.items),
		)
		totalCorrect += graded.correct
		totalAnswered += graded.answered
		totalQuestions += passage.items.length
	}

	if (session.writing.length > 0) {
		const writingIds = session.writing.map((t) => t.id)
		const writingDoneSet = new Set(
			session.writing
				.filter((t) => (writingAnswers.get(t.id) ?? "").trim().length > 0)
				.map((t) => t.id),
		)
		const items = makeNonMcqItems(writingIds, writingDoneSet)
		const done = writingDoneSet.size
		questionTypes.push(makeQT("Viết", session.writing.length, done, items))
		totalCorrect += done
		totalAnswered += done
		totalQuestions += session.writing.length
	}

	if (session.speaking.length > 0) {
		const speakingIds = session.speaking.map((p) => p.id)
		const items = makeNonMcqItems(speakingIds, speakingDone)
		const done = session.speaking.filter((p) => speakingDone.has(p.id)).length
		questionTypes.push(makeQT("Nói", session.speaking.length, done, items))
		totalCorrect += done
		totalAnswered += done
		totalQuestions += session.speaking.length
	}

	const score = Math.min(
		PHONG_THI_MAX_SCORE,
		parseFloat(((totalCorrect / Math.max(totalQuestions, 1)) * PHONG_THI_MAX_SCORE).toFixed(1)),
	)

	return {
		examId,
		examTitle: session.title,
		userName: "Thí sinh",
		score,
		maxScore: PHONG_THI_MAX_SCORE,
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
		maxScore: PHONG_THI_MAX_SCORE,
		totalCorrect: 0,
		totalAnswered: 0,
		totalQuestions: 0,
		questionTypes: [],
		submittedAt: Date.now(),
	}
}
