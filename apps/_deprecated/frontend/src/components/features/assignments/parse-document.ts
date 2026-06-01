import type { MCQQuestion } from "@/components/features/assignments/types"

export interface ParsedDocument {
	passage: string
	questions: MCQQuestion[]
	missingAnswers: boolean
}

/**
 * Parse raw text extracted from PDF/DOCX into passage + MCQ questions.
 *
 * Supports two major formats:
 *
 * Format 1 — Numbered questions:
 *   1. Question text
 *   A. option  |  A) option  |  (A) option
 *   Answer: B  |  Đáp án: B
 *
 * Format 2 — Unnumbered questions (detected by A/B/C/D option blocks):
 *   What is the main idea?
 *   A. option one
 *   B. option two
 *   C. option three
 *   D. option four
 *
 * Answer key at the end (table or list):
 *   1  B    or   1. B   or   Câu 1: B
 */
export function parseDocumentToAssignment(raw: string): ParsedDocument {
	// Extract answer key first (usually at the end)
	const { text: textWithoutKey, answerMap } = extractAnswerKey(raw)

	const lines = textWithoutKey.split(/\r?\n/)

	// Find the first option line (A. ...) — questions start before it
	const firstOptionIdx = findFirstOptionLine(lines)

	if (firstOptionIdx === -1) {
		// No MCQ found at all
		return { passage: raw.trim(), questions: [], missingAnswers: false }
	}

	// Walk backwards from first option to find start of first question text.
	// Skip blank lines — the question text may be separated by blanks from the "A." option.
	let firstQuestionLine = firstOptionIdx
	let foundText = false
	for (let i = firstOptionIdx - 1; i >= 0; i--) {
		const trimmed = lines[i].trim()
		if (!trimmed) {
			// If we already found question text, a blank line means we've gone past it
			if (foundText) break
			continue
		}
		if (SECTION_HEADER.test(trimmed)) break
		firstQuestionLine = i
		foundText = true
	}

	const passage = lines.slice(0, firstQuestionLine).join("\n").trim()
	const questionBlock = lines.slice(firstQuestionLine).join("\n")
	const questions = parseQuestions(questionBlock, answerMap)

	const missingAnswers = questions.some((q) => q.correctAnswer === -1)
	for (const q of questions) {
		if (q.correctAnswer === -1) q.correctAnswer = 0
	}

	return { passage, questions, missingAnswers }
}

// ── Option detection ──

const OPTION_LINE = /^\s*(?:\(?([A-Da-d])\)?[.)]\s*|([A-Da-d])\.\s*|([A-Da-d])\)\s*)(.+)/

function matchOption(line: string) {
	return line.trim().match(OPTION_LINE)
}

function getOptionLetter(match: RegExpMatchArray): string {
	return (match[1] ?? match[2] ?? match[3]).toUpperCase()
}

function findFirstOptionLine(lines: string[]): number {
	for (let i = 0; i < lines.length; i++) {
		const m = matchOption(lines[i])
		if (m && getOptionLetter(m) === "A") return i
	}
	return -1
}

// ── Section headers to skip ──

const SECTION_HEADER = /^(?:multiple\s*choice|câu\s*hỏi|questions?|phần|part)\b/i

// ── Numbered question start ──

const NUMBERED_QUESTION = /^(?:(?:question|câu)\s*)?(\d+)\s*[.):\s]\s*/i

// ── Answer key extraction ──

// Matches section headers like "Answer Key", "Đáp án", etc.
const ANSWER_KEY_HEADER = /^(?:answer\s*key|đáp\s*án|keys?|answers?)\s*(?:\(.*\))?\s*$/i

// Skip table header cells like "Câu", "Đáp án"
const ANSWER_TABLE_HEADER = /^(?:câu|đáp\s*án|question|answer|#|stt)$/i

// Matches answer rows: "1  B", "1. B", "Câu 1: B", "1 B 11 B"
const ANSWER_ROW = /(?:(?:câu\s*)?(\d+)\s*[.):]*\s*([A-Da-d]))/gi

// Inline answer after each question: "Answer: B", "Đáp án: B"
const INLINE_ANSWER = /^\s*(?:answer|đáp\s*án|key)\s*[:=]\s*([A-Da-d])/i

function letterToIndex(letter: string): number {
	return letter.toUpperCase().charCodeAt(0) - 65
}

function extractAnswerKey(raw: string): {
	text: string
	answerMap: Map<number, number>
} {
	const answerMap = new Map<number, number>()
	const lines = raw.split(/\r?\n/)

	// Find the answer key section
	let keyStartIdx = -1
	for (let i = lines.length - 1; i >= 0; i--) {
		if (ANSWER_KEY_HEADER.test(lines[i].trim())) {
			keyStartIdx = i
			break
		}
	}

	if (keyStartIdx === -1) {
		// No answer key section — try inline answers (handled in parseQuestions)
		return { text: raw, answerMap }
	}

	// Parse answer rows from the key section.
	// Supports two formats:
	//   1) Same-line: "1  B  11  B" or "1. B"
	//   2) Table (each cell on its own line): "1\nB\n11\nB\n2\nC"
	const keyLines = lines
		.slice(keyStartIdx + 1)
		.map((l) => l.trim())
		.filter((l) => l && !ANSWER_TABLE_HEADER.test(l))

	// First try same-line format
	for (const line of keyLines) {
		for (const match of line.matchAll(ANSWER_ROW)) {
			const qNum = Number.parseInt(match[1], 10)
			answerMap.set(qNum, letterToIndex(match[2]))
		}
	}

	// If same-line didn't find anything, try line-by-line table format:
	// lines alternate between number and letter (e.g. "1", "B", "11", "B")
	if (answerMap.size === 0) {
		let pendingNum: number | null = null
		for (const line of keyLines) {
			if (/^\d+$/.test(line)) {
				pendingNum = Number.parseInt(line, 10)
			} else if (pendingNum !== null && /^[A-Da-d]$/i.test(line)) {
				answerMap.set(pendingNum, letterToIndex(line))
				pendingNum = null
			} else {
				pendingNum = null
			}
		}
	}

	// Remove the answer key section from text
	const text = lines.slice(0, keyStartIdx).join("\n")
	return { text, answerMap }
}

// ── Question parsing ──

interface RawQuestion {
	text: string
	options: string[]
	correctAnswer: number
}

function parseQuestions(text: string, answerMap: Map<number, number>): MCQQuestion[] {
	const lines = text.split(/\r?\n/)
	const rawQuestions: RawQuestion[] = []
	let current: RawQuestion | null = null

	function saveCurrent() {
		if (current?.text && current.options.length >= 2) {
			rawQuestions.push(current)
		}
		current = null
	}

	for (const line of lines) {
		const trimmed = line.trim()
		if (!trimmed) continue

		// Skip section headers
		if (SECTION_HEADER.test(trimmed)) continue

		// Check inline answer line
		const inlineMatch = trimmed.match(INLINE_ANSWER)
		if (inlineMatch && current) {
			current.correctAnswer = letterToIndex(inlineMatch[1])
			continue
		}

		// Check if this is an option line
		const optMatch = matchOption(trimmed)
		if (optMatch) {
			const letter = getOptionLetter(optMatch)
			const optionText = optMatch[4].trim()

			if (letter === "A") {
				if (!current || current.options.length > 0) {
					saveCurrent()
				}
				if (!current) {
					current = { text: "", options: [], correctAnswer: -1 }
				}
				current.options.push(optionText)
			} else if (current) {
				current.options.push(optionText)
			}
			continue
		}

		// Check if this is a numbered question start: "1. What is..."
		const numberedMatch = trimmed.match(NUMBERED_QUESTION)
		if (numberedMatch) {
			saveCurrent()
			const questionText = trimmed.replace(NUMBERED_QUESTION, "").trim()
			current = { text: questionText, options: [], correctAnswer: -1 }
			continue
		}

		// Regular text line
		if (current && current.options.length === 0) {
			// Append to current question text
			current.text += current.text ? ` ${trimmed}` : trimmed
		} else if (!current || current.options.length > 0) {
			// This is likely a new question text (unnumbered format)
			saveCurrent()
			current = { text: trimmed, options: [], correctAnswer: -1 }
		}
	}

	saveCurrent()

	// Apply answer key
	return rawQuestions.map((q, i) => {
		const options = [...q.options]
		while (options.length < 4) options.push("")

		let correctAnswer = q.correctAnswer
		if (correctAnswer === -1) {
			const fromKey = answerMap.get(i + 1)
			if (fromKey !== undefined) correctAnswer = fromKey
		}

		return {
			question: q.text,
			options: options.slice(0, 4),
			correctAnswer,
		}
	})
}
