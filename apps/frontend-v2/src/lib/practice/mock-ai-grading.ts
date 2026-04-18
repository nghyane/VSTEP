// Mock AI grading result builder.
// TODO(backend): Thay buildAnnotatedWritingFeedback() bằng POST /api/v1/grading/writing { text, questionId }
// Backend: WritingGrader agent (đã có tại app/Ai/Agents/WritingGrader.php) xử lý.
// Response shape: AnnotatedWritingFeedback — giữ nguyên interface, chỉ đổi nguồn data.
// Annotations trong response dùng { start, end } char offset từ AI — không cần match-string.

import type { AiGradingResult } from "#/components/practice/AiGradingCard"
import type { WritingExercise } from "#/mocks/writing"

export interface WritingAnnotation {
	start: number
	end: number
	severity: "error" | "suggestion"
	category: string
	message: string
	suggestion?: string
}

export interface ParagraphFeedback {
	index: number
	wordCount: number
	suggestedWordRange: { min: number; max: number }
	status: "good" | "warn" | "bad"
	checklist: readonly { point: string; covered: boolean }[]
	notes: readonly string[]
}

export interface CohesionHint {
	afterParagraphIndex: number
	suggestion: string
}

export interface AnnotatedWritingFeedback {
	annotations: readonly WritingAnnotation[]
	paragraphs: readonly ParagraphFeedback[]
	cohesionHints: readonly CohesionHint[]
	strengths: readonly string[]
	improvements: readonly { message: string; explanation: string; annotationIdx?: number }[]
	rewrites: readonly { original: string; improved: string; reason: string }[]
}

/**
 * Build annotations bằng heuristic đơn giản — quét lỗi phổ biến trong text.
 * Thay bằng AI API sau.
 */
export function buildAnnotatedWritingFeedback(
	text: string,
	exercise?: WritingExercise,
): AnnotatedWritingFeedback {
	const annotations: WritingAnnotation[] = []
	const lower = text.toLowerCase()

	// Rule 1: "Despite + V" (sai — đúng phải là "Despite + N/Ving")
	findAll(lower, /despite\s+(i|you|we|they|he|she|it|the)\s+\w+/g, (m) => {
		annotations.push({
			start: m.index,
			end: m.index + m[0].length,
			severity: "error",
			category: "Sai cấu trúc Despite",
			message: "'Despite' phải theo sau bởi danh từ hoặc V-ing, không phải mệnh đề.",
			suggestion: "Despite + N/V-ing, hoặc dùng 'Although + S + V'",
		})
	})

	// Rule 2: "I wants" / "He want" — subject-verb agreement
	findAll(text, /\bI\s+wants\b/g, (m) => {
		annotations.push({
			start: m.index,
			end: m.index + m[0].length,
			severity: "error",
			category: "Chia động từ",
			message: "'I' đi với 'want', không phải 'wants'.",
			suggestion: "I want",
		})
	})
	findAll(text, /\b(He|She|It)\s+(want|need|have|do)\b/g, (m) => {
		annotations.push({
			start: m.index,
			end: m.index + m[0].length,
			severity: "error",
			category: "Chia động từ (ngôi thứ 3 số ít)",
			message: "Ngôi thứ ba số ít (he/she/it) phải thêm 's' vào động từ.",
			suggestion: `${m[1]} ${m[2]}s`,
		})
	})

	// Rule 3: "a" before vowel → should be "an"
	findAll(text, /\ba\s+[aeiouAEIOU]\w+/g, (m) => {
		annotations.push({
			start: m.index,
			end: m.index + m[0].length,
			severity: "error",
			category: "Mạo từ a/an",
			message: "Dùng 'an' trước từ bắt đầu bằng nguyên âm.",
			suggestion: m[0].replace(/^a\s/, "an "),
		})
	})

	// Rule 4: Repeated words
	findAll(text, /\b(\w+)\s+\1\b/gi, (m) => {
		annotations.push({
			start: m.index,
			end: m.index + m[0].length,
			severity: "suggestion",
			category: "Lặp từ",
			message: `Lặp từ '${m[1]}' — kiểm tra lại.`,
		})
	})

	// Rule 5: "very very"
	findAll(lower, /very\s+very/g, (m) => {
		annotations.push({
			start: m.index,
			end: m.index + m[0].length,
			severity: "suggestion",
			category: "Lặp từ",
			message: "Không nên dùng 'very very' — thay bằng adverb mạnh hơn (extremely, incredibly).",
		})
	})

	// Summary lists
	const wordCount = text.trim().split(/\s+/).filter(Boolean).length
	const errorCount = annotations.filter((a) => a.severity === "error").length
	const suggestionCount = annotations.filter((a) => a.severity === "suggestion").length

	const strengths = [
		wordCount >= 120 ? "Đủ độ dài theo yêu cầu" : "Nội dung bám sát đề",
		errorCount < 3 ? "Ít lỗi ngữ pháp cơ bản" : "Cấu trúc bài viết rõ ràng",
		text.split(/\n\n+/).length >= 3 ? "Chia đoạn hợp lý (mở/thân/kết)" : "Có nỗ lực diễn đạt ý",
	]

	const improvements = [
		errorCount > 0
			? {
					message: `${errorCount} lỗi ngữ pháp được phát hiện`,
					explanation: "Xem các vị trí được highlight màu đỏ trên bài viết để sửa lại.",
				}
			: {
					message: "Tăng sự đa dạng của cấu trúc câu",
					explanation:
						"Bài chủ yếu dùng câu đơn, nên kết hợp câu phức (although, because, despite + V-ing).",
				},
		{
			message: "Mở rộng vốn từ",
			explanation:
				"Thay các từ phổ thông (good, bad, big) bằng từ cụ thể hơn (beneficial, detrimental, substantial).",
		},
		suggestionCount > 0
			? {
					message: `${suggestionCount} gợi ý cải thiện`,
					explanation:
						"Các đoạn highlight màu vàng là gợi ý — không phải lỗi nhưng có thể diễn đạt tốt hơn.",
				}
			: {
					message: "Dùng từ nối đa dạng hơn",
					explanation: "Kết hợp: Moreover, Nevertheless, On the other hand, As a result.",
				},
	]

	const rewrites = annotations
		.filter((a) => a.suggestion)
		.slice(0, 3)
		.map((a) => ({
			original: text.slice(a.start, a.end),
			improved: a.suggestion ?? "",
			reason: a.message,
		}))

	// ─── Paragraph-level feedback ──────────────────────────────────
	const paras = text.split(/\n\n+/).filter((p) => p.trim().length > 0)
	const numSections = exercise?.outline?.length ?? Math.max(paras.length, 3)
	const totalMin = exercise?.minWords ?? 120
	const totalMax = exercise?.maxWords ?? 280
	const perParaMin = Math.round((totalMin / numSections) * 0.6)
	const perParaMax = Math.round((totalMax / numSections) * 1.4)
	const requiredPoints = exercise?.requiredPoints ?? []

	const paragraphs: ParagraphFeedback[] = paras.map((p, i) => {
		const wc = p.trim().split(/\s+/).filter(Boolean).length
		const lowerP = p.toLowerCase()
		const checklist = requiredPoints.map((rp) => ({
			point: rp,
			covered: rp
				.toLowerCase()
				.split(/\s+/)
				.some((w) => lowerP.includes(w)),
		}))
		const notes: string[] = []
		if (wc < perParaMin)
			notes.push(
				`Đoạn hơi ngắn — thử thêm ví dụ hoặc chi tiết (gợi ý ${perParaMin}-${perParaMax} từ)`,
			)
		if (
			!/however|moreover|furthermore|in addition|on the other hand|firstly|secondly|therefore|as a result/i.test(
				p,
			) &&
			i > 0
		) {
			notes.push("Thiếu từ nối mở đầu đoạn")
		}
		const status = wc < perParaMin ? "warn" : notes.length > 1 ? "warn" : "good"
		return {
			index: i,
			wordCount: wc,
			suggestedWordRange: { min: perParaMin, max: perParaMax },
			status,
			checklist,
			notes,
		}
	})

	// ─── Cohesion hints ───────────────────────────────────────────────
	const CONNECTORS = [
		"However,",
		"Moreover,",
		"Furthermore,",
		"In addition,",
		"On the other hand,",
		"Nevertheless,",
		"As a result,",
		"Therefore,",
	]
	const cohesionHints: CohesionHint[] = []
	for (let i = 0; i < paras.length - 1; i++) {
		const nextPara = paras[i + 1] ?? ""
		const hasConnector = CONNECTORS.some(
			(c) =>
				nextPara.trimStart().startsWith(c) ||
				nextPara.trimStart().toLowerCase().startsWith(c.toLowerCase()),
		)
		if (!hasConnector && i < 3) {
			const suggestion =
				i === 0
					? "Thử thêm 'Firstly,' hoặc 'To begin with,' ở đầu đoạn sau"
					: `Thử thêm '${CONNECTORS[i % CONNECTORS.length]}' ở đầu đoạn sau`
			cohesionHints.push({ afterParagraphIndex: i, suggestion })
		}
	}

	// Link improvements to annotation indices
	const linkedImprovements = improvements.map((imp, i) => ({
		...imp,
		annotationIdx: i < annotations.length ? i : undefined,
	}))

	return {
		annotations,
		paragraphs,
		cohesionHints,
		strengths,
		improvements: linkedImprovements,
		rewrites,
	}
}

function findAll(text: string, regex: RegExp, callback: (m: RegExpExecArray) => void) {
	let match: RegExpExecArray | null
	regex.lastIndex = 0
	for (match = regex.exec(text); match !== null; match = regex.exec(text)) {
		callback(match)
		if (match.index === regex.lastIndex) regex.lastIndex += 1
	}
}

export function buildMockWritingGrading(wordCount: number): AiGradingResult {
	const task = clamp(6 + (wordCount > 120 ? 1 : 0), 0, 10)
	const coherence = 6.5
	const lexical = 6
	const grammar = 6.5
	const overall = round((task + coherence + lexical + grammar) / 4)

	return {
		overall,
		band: overall >= 7.5 ? "C1" : overall >= 6 ? "B2" : "B1",
		summary:
			"Bài viết có cấu trúc rõ ràng và nội dung bám sát đề. Cần cải thiện sự đa dạng trong cấu trúc câu và lựa chọn từ vựng.",
		criteria: [
			{
				label: "Task Fulfilment",
				score: task,
				comment: "Đã trả lời đủ ý chính của đề, còn thiếu một số luận điểm hỗ trợ.",
			},
			{
				label: "Coherence & Cohesion",
				score: coherence,
				comment: "Các đoạn liên kết khá tốt, nhưng từ nối còn lặp lại (However, For example).",
			},
			{
				label: "Lexical Resource",
				score: lexical,
				comment: "Vốn từ ở mức trung bình, có thể thay thế từ phổ thông bằng từ học thuật hơn.",
			},
			{
				label: "Grammar Range & Accuracy",
				score: grammar,
				comment: "Dùng đúng các thì cơ bản, thỉnh thoảng mắc lỗi chia động từ số ít/số nhiều.",
			},
		],
		strengths: [
			"Mở bài giới thiệu chủ đề rõ ràng",
			"Có ví dụ minh hoạ cụ thể",
			"Kết bài chốt lại quan điểm",
		],
		improvements: [
			"Lặp lại một số cấu trúc câu đơn giản",
			"Thiếu câu phức và câu ghép",
			"Một số lỗi mạo từ (a/an/the)",
		],
		suggestions: [
			"Dùng thêm từ nối: Moreover, Nevertheless, As a result",
			"Thay một số động từ get/do bằng từ chính xác hơn",
			"Đọc lại để bắt lỗi mạo từ và chia động từ",
		],
	}
}

export function buildMockSpeakingGrading(accuracy: number): AiGradingResult {
	const task = accuracy >= 0.8 ? 7 : accuracy >= 0.6 ? 5.5 : 4
	const pronunciation = 6.5
	const lexical = 6
	const grammar = 6
	const overall = round((task + pronunciation + lexical + grammar) / 4)

	return {
		overall,
		band: overall >= 7.5 ? "C1" : overall >= 6 ? "B2" : "B1",
		summary:
			"Phát âm rõ ràng, tốc độ nói ổn định. Có thể mở rộng ý tưởng và sử dụng cấu trúc đa dạng hơn.",
		criteria: [
			{
				label: "Task Fulfilment",
				score: task,
				comment: "Trả lời đúng trọng tâm câu hỏi. Cần kéo dài câu trả lời chi tiết hơn.",
			},
			{
				label: "Pronunciation",
				score: pronunciation,
				comment: "Đa số từ rõ ràng, một vài từ khó (specifically, opportunity) chưa chính xác.",
			},
			{
				label: "Lexical Resource",
				score: lexical,
				comment: "Vốn từ cơ bản, có thể dùng thêm idiom và collocation.",
			},
			{
				label: "Grammar Range & Accuracy",
				score: grammar,
				comment: "Ít lỗi grammar; chủ yếu dùng câu đơn, nên kết hợp câu phức.",
			},
		],
		strengths: [
			"Phát âm các âm cơ bản khá chuẩn",
			"Tốc độ nói tự nhiên, không vấp nhiều",
			"Có dùng một số phrase linking (well, I think)",
		],
		improvements: [
			"Nói hơi ngắn, dưới thời lượng gợi ý",
			"Chưa dùng câu điều kiện/giả định",
			"Intonation ở câu hỏi chưa rõ",
		],
		suggestions: [
			"Luyện thêm câu phức: I believe that... because...",
			"Bổ sung ví dụ cụ thể để kéo dài câu trả lời",
			"Thử shadowing bài mẫu để cải thiện intonation",
		],
	}
}

function round(v: number): number {
	return Math.round(v * 10) / 10
}

function clamp(v: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, v))
}
