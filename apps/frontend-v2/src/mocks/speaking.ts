// Mock speaking data — Dictation + Shadowing.
// Mỗi bài 5 câu, mỗi câu có text + translation. Audio phát qua Web Speech API (TTS on-the-fly).

export type SpeakingLevel = "A2" | "B1" | "B2" | "C1"

export interface SpeakingSentence {
	id: string
	text: string
	translation?: string
}

export interface SpeakingExercise {
	id: string
	level: SpeakingLevel
	title: string
	description: string
	estimatedMinutes: number
	sentences: readonly SpeakingSentence[]
}

export const SPEAKING_LEVEL_LABELS: Record<SpeakingLevel, string> = {
	A2: "A2 · Sơ cấp",
	B1: "B1 · Trung cấp",
	B2: "B2 · Trên trung cấp",
	C1: "C1 · Nâng cao",
}

// ─── Exercises ─────────────────────────────────────────────────────

const A2_DAILY: SpeakingExercise = {
	id: "sp-a2-daily",
	level: "A2",
	title: "Daily routine",
	description: "Luyện các câu mô tả thói quen hằng ngày.",
	estimatedMinutes: 4,
	sentences: [
		{
			id: "1",
			text: "I usually wake up at seven in the morning.",
			translation: "Tôi thường dậy lúc bảy giờ sáng.",
		},
		{
			id: "2",
			text: "After breakfast, I take the bus to work.",
			translation: "Sau bữa sáng, tôi bắt xe buýt đi làm.",
		},
		{
			id: "3",
			text: "I have lunch with my colleagues around noon.",
			translation: "Tôi ăn trưa với đồng nghiệp khoảng giữa trưa.",
		},
		{
			id: "4",
			text: "In the evening, I like to read a book.",
			translation: "Buổi tối, tôi thích đọc sách.",
		},
		{
			id: "5",
			text: "I go to bed before eleven o'clock.",
			translation: "Tôi đi ngủ trước mười một giờ.",
		},
	],
}

const A2_FAMILY: SpeakingExercise = {
	id: "sp-a2-family",
	level: "A2",
	title: "My family",
	description: "Giới thiệu các thành viên trong gia đình.",
	estimatedMinutes: 4,
	sentences: [
		{
			id: "1",
			text: "There are four people in my family.",
			translation: "Gia đình tôi có bốn người.",
		},
		{
			id: "2",
			text: "My father is a teacher at a local school.",
			translation: "Bố tôi là giáo viên ở một trường gần nhà.",
		},
		{
			id: "3",
			text: "My mother works as a nurse in the city hospital.",
			translation: "Mẹ tôi làm y tá ở bệnh viện thành phố.",
		},
		{
			id: "4",
			text: "I have one younger sister who loves painting.",
			translation: "Tôi có một em gái rất thích vẽ.",
		},
		{
			id: "5",
			text: "We always have dinner together on Sundays.",
			translation: "Chủ nhật nào chúng tôi cũng ăn tối cùng nhau.",
		},
	],
}

const B1_TRAVEL: SpeakingExercise = {
	id: "sp-b1-travel",
	level: "B1",
	title: "A memorable trip",
	description: "Kể về một chuyến đi đáng nhớ.",
	estimatedMinutes: 5,
	sentences: [
		{ id: "1", text: "Last summer, my friends and I travelled to Da Nang for a week." },
		{ id: "2", text: "We booked a small hotel right next to the beach." },
		{ id: "3", text: "Every morning, we swam in the sea and watched the sunrise." },
		{ id: "4", text: "The local seafood was incredibly fresh and reasonably priced." },
		{ id: "5", text: "I still remember how relaxed and happy I felt during that trip." },
	],
}

const B1_WORK: SpeakingExercise = {
	id: "sp-b1-work",
	level: "B1",
	title: "Talking about work",
	description: "Mô tả công việc và môi trường làm việc.",
	estimatedMinutes: 5,
	sentences: [
		{ id: "1", text: "I work as a software developer for a medium-sized company." },
		{ id: "2", text: "My main responsibility is building new features for our mobile app." },
		{ id: "3", text: "I usually start my day by checking emails and planning tasks." },
		{ id: "4", text: "What I enjoy most is solving tricky bugs with my teammates." },
		{ id: "5", text: "The biggest challenge is keeping up with new technologies." },
	],
}

const B2_OPINION: SpeakingExercise = {
	id: "sp-b2-opinion",
	level: "B2",
	title: "Technology in education",
	description: "Nêu quan điểm về công nghệ trong giáo dục.",
	estimatedMinutes: 6,
	sentences: [
		{ id: "1", text: "Technology has dramatically reshaped the way students learn today." },
		{
			id: "2",
			text: "Online platforms give learners access to resources that were once out of reach.",
		},
		{ id: "3", text: "However, excessive screen time can negatively affect attention spans." },
		{
			id: "4",
			text: "Teachers should find a balance between digital tools and traditional methods.",
		},
		{
			id: "5",
			text: "In my view, technology is a powerful aid, not a replacement for good teaching.",
		},
	],
}

const C1_SOCIAL: SpeakingExercise = {
	id: "sp-c1-social",
	level: "C1",
	title: "Social media and privacy",
	description: "Bàn luận về mạng xã hội và quyền riêng tư.",
	estimatedMinutes: 7,
	sentences: [
		{
			id: "1",
			text: "The rise of social media has blurred the boundaries between public and private life.",
		},
		{
			id: "2",
			text: "Users often underestimate how much personal data they willingly disclose online.",
		},
		{
			id: "3",
			text: "Regulators around the world are struggling to keep pace with rapidly evolving platforms.",
		},
		{
			id: "4",
			text: "Meaningful reform requires both corporate accountability and individual digital literacy.",
		},
		{
			id: "5",
			text: "Ultimately, protecting privacy is a shared responsibility that cannot be outsourced.",
		},
	],
}

// ─── Export ────────────────────────────────────────────────────────

export const MOCK_SPEAKING: readonly SpeakingExercise[] = [
	A2_DAILY,
	A2_FAMILY,
	B1_TRAVEL,
	B1_WORK,
	B2_OPINION,
	C1_SOCIAL,
]

export function findSpeakingExercise(id: string): SpeakingExercise | undefined {
	return MOCK_SPEAKING.find((e) => e.id === id)
}

export async function mockFetchSpeaking(): Promise<readonly SpeakingExercise[]> {
	await new Promise((r) => setTimeout(r, 120))
	return MOCK_SPEAKING
}

export async function mockFetchSpeakingExercise(id: string): Promise<SpeakingExercise> {
	await new Promise((r) => setTimeout(r, 120))
	const exercise = findSpeakingExercise(id)
	if (!exercise) throw new Error(`Không tìm thấy đề nói "${id}"`)
	return exercise
}
