// Writing structures — cấu trúc câu phổ biến theo target level.

export type TargetLevel = "B1" | "B2" | "C1"

export interface StructureEntry {
	id: string
	pattern: string
	example: string
	vietnamese: string
}

export const WRITING_STRUCTURES: Record<TargetLevel, readonly StructureEntry[]> = {
	B1: [
		{
			id: "b1-although",
			pattern: "Although + S + V",
			example: "Although it was raining, we went out.",
			vietnamese: "Mặc dù trời mưa, chúng tôi vẫn đi ra ngoài.",
		},
		{
			id: "b1-because",
			pattern: "Because + S + V",
			example: "I study hard because I want to pass the exam.",
			vietnamese: "Tôi học chăm vì muốn vượt qua kỳ thi.",
		},
		{
			id: "b1-so-that",
			pattern: "so that + S + can/will + V",
			example: "I save money so that I can buy a new phone.",
			vietnamese: "Tôi tiết kiệm tiền để có thể mua điện thoại mới.",
		},
		{
			id: "b1-if-will",
			pattern: "If + S + V(s), S + will + V",
			example: "If it rains tomorrow, I will stay home.",
			vietnamese: "Nếu ngày mai trời mưa, tôi sẽ ở nhà.",
		},
		{
			id: "b1-would-like",
			pattern: "would like to + V",
			example: "I would like to apply for the position.",
			vietnamese: "Tôi muốn ứng tuyển vào vị trí này.",
		},
		{
			id: "b1-writing-to",
			pattern: "I am writing to + V",
			example: "I am writing to inform you about the changes.",
			vietnamese: "Tôi viết thư để thông báo cho bạn về những thay đổi.",
		},
	],
	B2: [
		{
			id: "b2-despite",
			pattern: "Despite + N/V-ing",
			example: "Despite the rain, we went out.",
			vietnamese: "Mặc kệ mưa, chúng tôi vẫn đi ra ngoài.",
		},
		{
			id: "b2-not-only",
			pattern: "Not only + aux + S... but also...",
			example: "Not only does she speak English, but she also speaks French.",
			vietnamese: "Cô ấy không chỉ nói tiếng Anh mà còn nói tiếng Pháp.",
		},
		{
			id: "b2-it-is-adj",
			pattern: "It is + adj + for sb + to V",
			example: "It is important for students to read widely.",
			vietnamese: "Việc đọc rộng là quan trọng đối với học sinh.",
		},
		{
			id: "b2-the-more",
			pattern: "The more + S + V, the more + S + V",
			example: "The more you practice, the better you become.",
			vietnamese: "Càng luyện tập, bạn càng giỏi hơn.",
		},
		{
			id: "b2-worth",
			pattern: "S + be + worth + V-ing",
			example: "This movie is worth watching.",
			vietnamese: "Bộ phim này đáng để xem.",
		},
		{
			id: "b2-on-one-hand",
			pattern: "On the one hand... on the other hand...",
			example: "On the one hand, technology makes life easier; on the other hand, it isolates us.",
			vietnamese: "Một mặt công nghệ giúp cuộc sống dễ dàng hơn, mặt khác nó cô lập chúng ta.",
		},
	],
	C1: [
		{
			id: "c1-had-pp",
			pattern: "Had + S + p.p, S + would have + p.p",
			example: "Had I known, I would have told you.",
			vietnamese: "Nếu tôi biết, tôi đã nói với bạn.",
		},
		{
			id: "c1-not-until",
			pattern: "Not until + time/clause + aux + S + V",
			example: "Not until he arrived did we start the meeting.",
			vietnamese: "Mãi cho đến khi anh ấy đến, chúng tôi mới bắt đầu cuộc họp.",
		},
		{
			id: "c1-no-sooner",
			pattern: "No sooner had + S + p.p + than + S + V",
			example: "No sooner had I left the house than it started to rain.",
			vietnamese: "Tôi vừa rời khỏi nhà thì trời bắt đầu mưa.",
		},
		{
			id: "c1-high-time",
			pattern: "It is high time + S + V(ed)",
			example: "It is high time we took action on climate change.",
			vietnamese: "Đã đến lúc chúng ta phải hành động về biến đổi khí hậu.",
		},
		{
			id: "c1-were-to",
			pattern: "Inverted conditional: Were + S + to + V",
			example: "Were I to win the lottery, I would travel the world.",
			vietnamese: "Nếu tôi trúng xổ số, tôi sẽ đi khắp thế giới.",
		},
		{
			id: "c1-no-denying",
			pattern: "There is no denying that + S + V",
			example: "There is no denying that social media has changed how we communicate.",
			vietnamese: "Không thể phủ nhận rằng mạng xã hội đã thay đổi cách chúng ta giao tiếp.",
		},
	],
}

export function findStructureById(
	id: string,
): (StructureEntry & { level: TargetLevel }) | undefined {
	for (const level of ["B1", "B2", "C1"] as const) {
		const entry = WRITING_STRUCTURES[level].find((s) => s.id === id)
		if (entry) return { ...entry, level }
	}
	return undefined
}

// ─── Phrase suggestions for autocomplete ──────────────────────────

const COMMON_COMPLETIONS: Record<string, string[]> = {
	"i am writing to": ["inform you about", "apply for the position", "express my concern about"],
	"i would like to": ["apply for", "inform you that", "express my interest in"],
	"thank you for": ["your consideration", "your time", "your attention to this matter"],
	"i hope": ["to hear from you soon", "this letter finds you well", "you understand my situation"],
	despite: ["the difficulties", "the rain", "the challenges"],
	however: [", I believe that", ", it is important to note that"],
	"in conclusion": [", I strongly believe that", ", the advantages outweigh the disadvantages"],
	"on the one hand": [", technology makes our lives easier"],
	"on the other hand": [", it can cause social isolation"],
	"not only": ["does it improve", "is it beneficial"],
	"it is important": ["to note that", "for us to"],
	"first of all": [", we should consider"],
	"in addition": [", there are other factors to consider"],
	furthermore: [", studies have shown that"],
	"as a result": [", many people are"],
	dear: ["Sir or Madam,", "Mr. Smith,"],
	"best regards": [","],
	"yours sincerely": [","],
	"i look forward": ["to hearing from you", "to your reply"],
}

export function suggestNextPhrase(text: string): string | null {
	if (!text.trim()) return null
	const clean = text.toLowerCase().replace(/\s+$/, "")
	const lastChars = clean.slice(-60)

	let bestKey = ""
	for (const key of Object.keys(COMMON_COMPLETIONS)) {
		if (lastChars.endsWith(key) && key.length > bestKey.length) {
			bestKey = key
		}
	}

	if (!bestKey) return null
	const completions = COMMON_COMPLETIONS[bestKey]
	if (!completions || completions.length === 0) return null

	const suggestion = completions[0]
	if (!suggestion) return null

	return text.endsWith(" ") ? suggestion : ` ${suggestion}`
}
