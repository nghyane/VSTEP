export interface WritingSentenceItem {
	id: string
	sentence: string
	translation: string
	explanation: string
	writingUsage: string
	difficulty: "easy" | "medium" | "hard"
}

export interface WritingSentenceTopic {
	id: string
	name: string
	sentenceCount: number
	sentences: readonly WritingSentenceItem[]
}

const TOPICS: readonly WritingSentenceTopic[] = [
	{
		id: "opinion",
		name: "Nêu quan điểm",
		sentenceCount: 4,
		sentences: [
			{
				id: "op-1",
				sentence: "In my opinion, social media brings more benefits than drawbacks.",
				translation: "Theo tôi, mạng xã hội mang lại nhiều lợi ích hơn là bất lợi.",
				explanation: "Cấu trúc mở đầu nêu quan điểm: In my opinion + mệnh đề hoàn chỉnh.",
				writingUsage: "Dùng ở mở bài hoặc topic sentence của opinion essay.",
				difficulty: "easy",
			},
			{
				id: "op-2",
				sentence: "I strongly believe that students should learn practical life skills at school.",
				translation: "Tôi tin chắc rằng học sinh nên học các kỹ năng sống thực tế ở trường.",
				explanation: "Strongly believe giúp câu chắc chắn hơn thay vì chỉ dùng think.",
				writingUsage: "Dùng để nhấn mạnh lập trường trong bài luận.",
				difficulty: "medium",
			},
			{
				id: "op-3",
				sentence: "From my perspective, online learning is suitable only in certain situations.",
				translation: "Theo góc nhìn của tôi, học trực tuyến chỉ phù hợp trong một số tình huống.",
				explanation: "From my perspective là biến thể formal của in my opinion.",
				writingUsage: "Dùng ở thân bài khi chuyển sang góc nhìn cá nhân.",
				difficulty: "medium",
			},
			{
				id: "op-4",
				sentence: "It seems to me that public transport should be made more affordable.",
				translation: "Theo tôi có vẻ như giao thông công cộng nên được làm cho rẻ hơn.",
				explanation: "It seems to me that là cấu trúc nêu quan điểm mềm hơn, lịch sự hơn.",
				writingUsage: "Hữu ích khi cần giọng văn cân bằng, không quá mạnh.",
				difficulty: "hard",
			},
		],
	},
	{
		id: "cause-effect",
		name: "Nguyên nhân - kết quả",
		sentenceCount: 4,
		sentences: [
			{
				id: "ce-1",
				sentence: "One major cause of air pollution is the increasing number of private vehicles.",
				translation:
					"Một nguyên nhân chính của ô nhiễm không khí là số lượng phương tiện cá nhân ngày càng tăng.",
				explanation: "One major cause of... is... là mẫu câu nguyên nhân rất cơ bản.",
				writingUsage: "Dùng khi phân tích nguyên nhân trong problem-solution essay.",
				difficulty: "easy",
			},
			{
				id: "ce-2",
				sentence: "As a result, many young people struggle to maintain a healthy lifestyle.",
				translation:
					"Kết quả là nhiều người trẻ gặp khó khăn trong việc duy trì lối sống lành mạnh.",
				explanation: "As a result đặt đầu câu để nối hệ quả với ý trước đó.",
				writingUsage: "Dùng chuyển đoạn hoặc cuối đoạn để nêu hệ quả.",
				difficulty: "easy",
			},
			{
				id: "ce-3",
				sentence: "This trend leads to serious consequences for both individuals and society.",
				translation: "Xu hướng này dẫn đến những hậu quả nghiêm trọng cho cả cá nhân và xã hội.",
				explanation: "Lead to + noun phrase là cấu trúc diễn đạt hệ quả formal.",
				writingUsage: "Dùng để phát triển hậu quả trong body paragraph.",
				difficulty: "medium",
			},
			{
				id: "ce-4",
				sentence:
					"Because urban areas are becoming more crowded, housing prices have risen dramatically.",
				translation: "Bởi vì khu vực đô thị ngày càng đông đúc, giá nhà đã tăng mạnh.",
				explanation: "Mệnh đề because đứng đầu câu nêu nguyên nhân trực tiếp.",
				writingUsage: "Dùng để mở đoạn giải thích nguyên nhân của một vấn đề.",
				difficulty: "medium",
			},
		],
	},
	{
		id: "comparison",
		name: "So sánh",
		sentenceCount: 4,
		sentences: [
			{
				id: "cp-1",
				sentence: "Studying abroad can be more expensive than studying in one's home country.",
				translation: "Du học có thể đắt đỏ hơn việc học trong nước.",
				explanation: "Comparative adjective: more expensive than.",
				writingUsage: "Dùng trong discussion essay để đối chiếu hai lựa chọn.",
				difficulty: "easy",
			},
			{
				id: "cp-2",
				sentence: "Compared with traditional classrooms, online courses offer greater flexibility.",
				translation: "So với lớp học truyền thống, các khóa học trực tuyến linh hoạt hơn.",
				explanation: "Compared with + noun phrase là opener tự nhiên để so sánh.",
				writingUsage: "Topic sentence cho đoạn so sánh ưu điểm.",
				difficulty: "medium",
			},
			{
				id: "cp-3",
				sentence: "The latter option is far more practical for students with limited budgets.",
				translation: "Lựa chọn sau thực tế hơn nhiều đối với sinh viên có ngân sách hạn chế.",
				explanation: "The latter option dùng khi đã nêu hai lựa chọn trước đó.",
				writingUsage: "Dùng trong đoạn văn academic, tăng lexical variety.",
				difficulty: "hard",
			},
			{
				id: "cp-4",
				sentence: "Likewise, public libraries can be just as valuable as online resources.",
				translation: "Tương tự, thư viện công cộng có thể giá trị không kém tài nguyên trực tuyến.",
				explanation: "Just as ... as... là cấu trúc so sánh ngang bằng.",
				writingUsage: "Dùng để bổ sung ví dụ tương đồng trong bài luận.",
				difficulty: "hard",
			},
		],
	},
	{
		id: "linking",
		name: "Liên kết câu",
		sentenceCount: 4,
		sentences: [
			{
				id: "ln-1",
				sentence: "Furthermore, governments should invest more in public transport systems.",
				translation: "Hơn nữa, chính phủ nên đầu tư nhiều hơn vào hệ thống giao thông công cộng.",
				explanation: "Furthermore = linker bổ sung ý formal.",
				writingUsage: "Dùng ở đầu câu để thêm luận điểm thứ hai.",
				difficulty: "easy",
			},
			{
				id: "ln-2",
				sentence: "Nevertheless, this solution may not be effective in rural areas.",
				translation: "Tuy nhiên, giải pháp này có thể không hiệu quả ở khu vực nông thôn.",
				explanation: "Nevertheless là linker nhượng bộ/đối lập formal.",
				writingUsage: "Dùng khi nêu hạn chế hoặc phản biện trong thân bài.",
				difficulty: "medium",
			},
			{
				id: "ln-3",
				sentence:
					"For instance, many students now learn languages through short videos on social media.",
				translation:
					"Ví dụ, hiện nay nhiều học sinh học ngôn ngữ qua các video ngắn trên mạng xã hội.",
				explanation: "For instance = linker đưa ví dụ cụ thể.",
				writingUsage: "Dùng để support main idea bằng example.",
				difficulty: "easy",
			},
			{
				id: "ln-4",
				sentence: "In conclusion, a balanced approach would be the most sustainable solution.",
				translation: "Tóm lại, một cách tiếp cận cân bằng sẽ là giải pháp bền vững nhất.",
				explanation: "In conclusion báo hiệu câu kết luận cuối bài.",
				writingUsage: "Dùng trong concluding sentence hoặc final paragraph.",
				difficulty: "medium",
			},
		],
	},
] as const

export function findWritingSentenceTopic(id: string): WritingSentenceTopic | undefined {
	return TOPICS.find((topic) => topic.id === id)
}

export async function mockFetchWritingSentenceTopics(): Promise<readonly WritingSentenceTopic[]> {
	await new Promise((resolve) => setTimeout(resolve, 120))
	return TOPICS
}

export async function mockFetchWritingSentenceTopic(id: string): Promise<WritingSentenceTopic> {
	await new Promise((resolve) => setTimeout(resolve, 120))
	const topic = findWritingSentenceTopic(id)
	if (!topic) throw new Error(`Không tìm thấy chủ đề câu viết "${id}"`)
	return topic
}
