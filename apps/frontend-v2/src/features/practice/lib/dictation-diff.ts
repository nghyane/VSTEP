// Word-level diff cho Dictation.
// Normalize (lowercase, bỏ dấu câu), split theo khoảng trắng, so khớp tuần tự.

export type TokenStatus = "correct" | "wrong" | "missing"

export interface DictationToken {
	expected: string
	typed: string | null
	status: TokenStatus
}

export interface DictationResult {
	tokens: readonly DictationToken[]
	correct: number
	total: number
	accuracy: number // 0..1
}

function normalize(s: string): string {
	return s
		.toLowerCase()
		.replace(/[.,!?;:"'()[\]–—-]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
}

export function diffDictation(expected: string, typed: string): DictationResult {
	const exp = normalize(expected).split(" ").filter(Boolean)
	const got = normalize(typed).split(" ").filter(Boolean)

	const tokens: DictationToken[] = []
	let i = 0
	let j = 0
	let correct = 0
	while (i < exp.length) {
		const e = exp[i] as string
		const g = got[j]
		if (g === undefined) {
			tokens.push({ expected: e, typed: null, status: "missing" })
			i++
			continue
		}
		if (g === e) {
			tokens.push({ expected: e, typed: g, status: "correct" })
			correct++
			i++
			j++
			continue
		}
		// lookahead: nếu từ tiếp theo khớp expected thì coi như got[j] thừa/sai
		if (got[j + 1] === e) {
			tokens.push({ expected: e, typed: g, status: "wrong" })
			i++
			j += 2
			continue
		}
		tokens.push({ expected: e, typed: g, status: "wrong" })
		i++
		j++
	}
	const total = exp.length
	return { tokens, correct, total, accuracy: total > 0 ? correct / total : 0 }
}
