// Mock grammar data — FE mock trước khi backend có schema.
// Khi nối API: xóa file này + sửa queryFn trong lib/queries/grammar.ts

export type GrammarCategory =
	| "tenses"
	| "conditionals"
	| "passives"
	| "relatives"
	| "reported"
	| "modals"

export interface GrammarExample {
	en: string
	vi: string
	note?: string
}

export interface GrammarMCQ {
	id: string
	prompt: string
	options: [string, string, string, string]
	correctIndex: 0 | 1 | 2 | 3
	explanation: string
}

export interface GrammarPoint {
	id: string
	name: string
	vietnameseName: string
	category: GrammarCategory
	summary: string
	whenToUse: string
	structures: string[]
	examples: GrammarExample[]
	exercises: GrammarMCQ[]
}

export const CATEGORY_LABELS: Record<GrammarCategory, string> = {
	tenses: "Thì",
	conditionals: "Câu điều kiện",
	passives: "Bị động",
	relatives: "Mệnh đề quan hệ",
	reported: "Câu gián tiếp",
	modals: "Động từ khuyết thiếu",
}

// Helper cho nhận dạng MCQ ngắn gọn
function q(
	id: string,
	prompt: string,
	options: [string, string, string, string],
	correctIndex: 0 | 1 | 2 | 3,
	explanation: string,
): GrammarMCQ {
	return { id, prompt, options, correctIndex, explanation }
}

// ─── Grammar points ────────────────────────────────────────────────

const PRESENT_SIMPLE: GrammarPoint = {
	id: "present-simple",
	name: "Present Simple",
	vietnameseName: "Thì hiện tại đơn",
	category: "tenses",
	summary: "Diễn tả thói quen, sự thật hiển nhiên, lịch trình cố định.",
	whenToUse:
		"Dùng cho thói quen hằng ngày, sự thật khoa học/hiển nhiên, cảm xúc, lịch cố định (tàu, giờ học…).",
	structures: ["S + V(s/es) + O", "S + do/does + not + V", "Do/Does + S + V ?"],
	examples: [
		{ en: "She plays tennis every Sunday.", vi: "Cô ấy chơi tennis mỗi Chủ nhật." },
		{ en: "Water boils at 100°C.", vi: "Nước sôi ở 100 độ C.", note: "sự thật hiển nhiên" },
		{ en: "The train leaves at 7 a.m.", vi: "Tàu rời ga lúc 7 giờ sáng.", note: "lịch cố định" },
		{ en: "I don't drink coffee.", vi: "Tôi không uống cà phê." },
	],
	exercises: [
		q(
			"ps-1",
			"She _____ to work by bus every day.",
			["go", "goes", "going", "gone"],
			1,
			"Chủ ngữ số ít ngôi thứ ba (She) + V-s/es → goes.",
		),
		q(
			"ps-2",
			"_____ they live in Hanoi?",
			["Are", "Is", "Do", "Does"],
			2,
			"Chủ ngữ 'they' (số nhiều) dùng trợ động từ 'Do' cho câu hỏi hiện tại đơn.",
		),
		q(
			"ps-3",
			"My brother _____ like spicy food.",
			["don't", "doesn't", "isn't", "aren't"],
			1,
			"Chủ ngữ số ít → doesn't + V nguyên mẫu.",
		),
		q(
			"ps-4",
			"The sun _____ in the east.",
			["rise", "rises", "rising", "rose"],
			1,
			"Sự thật hiển nhiên → hiện tại đơn, ngôi thứ ba số ít → rises.",
		),
		q(
			"ps-5",
			"How often _____ you exercise?",
			["do", "does", "are", "is"],
			0,
			"How often + do/does + S + V — 'you' dùng 'do'.",
		),
		q(
			"ps-6",
			"My parents _____ in a small town.",
			["lives", "live", "living", "lived"],
			1,
			"'My parents' số nhiều → live (không -s).",
		),
	],
}

const PRESENT_PERFECT: GrammarPoint = {
	id: "present-perfect",
	name: "Present Perfect",
	vietnameseName: "Thì hiện tại hoàn thành",
	category: "tenses",
	summary: "Hành động xảy ra trong quá khứ nhưng còn ảnh hưởng đến hiện tại.",
	whenToUse:
		"Dùng với kinh nghiệm, hành động vừa mới xong, hoặc kéo dài từ quá khứ đến bây giờ. Đi với since/for/just/already/yet/ever/never.",
	structures: ["S + have/has + V3/ed + O", "S + have/has + not + V3/ed", "Have/Has + S + V3/ed ?"],
	examples: [
		{
			en: "I have lived here for 5 years.",
			vi: "Tôi đã sống ở đây 5 năm rồi.",
			note: "for + khoảng thời gian",
		},
		{ en: "She has just finished her homework.", vi: "Cô ấy vừa làm xong bài tập." },
		{ en: "Have you ever been to Japan?", vi: "Bạn đã từng đến Nhật chưa?" },
		{ en: "They haven't seen that movie yet.", vi: "Họ chưa xem phim đó." },
	],
	exercises: [
		q(
			"pp-1",
			"I _____ this book three times.",
			["read", "have read", "reading", "reads"],
			1,
			"Kinh nghiệm nhiều lần → hiện tại hoàn thành 'have read'.",
		),
		q(
			"pp-2",
			"She has lived in Paris _____ 2018.",
			["for", "since", "in", "at"],
			1,
			"'since' đi với thời điểm cụ thể (2018); 'for' đi với khoảng thời gian.",
		),
		q(
			"pp-3",
			"_____ you ever eaten sushi?",
			["Did", "Do", "Have", "Has"],
			2,
			"'ever' (đã từng) là dấu hiệu của hiện tại hoàn thành — 'Have you ever…'.",
		),
		q(
			"pp-4",
			"He has _____ arrived at the airport.",
			["yet", "just", "ago", "last"],
			1,
			"'just' = vừa mới, đặt sau have/has.",
		),
		q(
			"pp-5",
			"We haven't finished the project _____.",
			["already", "just", "yet", "since"],
			2,
			"'yet' trong câu phủ định = chưa, đặt cuối câu.",
		),
		q(
			"pp-6",
			"How long _____ you known him?",
			["have", "has", "do", "did"],
			0,
			"'How long' + have/has + S + V3 cho hành động kéo dài đến nay. 'you' → have.",
		),
	],
}

const PAST_SIMPLE: GrammarPoint = {
	id: "past-simple",
	name: "Past Simple",
	vietnameseName: "Thì quá khứ đơn",
	category: "tenses",
	summary: "Hành động đã kết thúc hoàn toàn trong quá khứ, có thời điểm xác định.",
	whenToUse:
		"Dùng khi có mốc thời gian rõ ràng trong quá khứ (yesterday, last week, in 2010, ago…). Động từ ở dạng V2/ed.",
	structures: ["S + V2/ed + O", "S + did + not + V", "Did + S + V ?"],
	examples: [
		{ en: "I visited Hanoi last summer.", vi: "Tôi đã đến Hà Nội mùa hè năm ngoái." },
		{ en: "She didn't call me yesterday.", vi: "Hôm qua cô ấy không gọi tôi." },
		{ en: "Did you finish your report?", vi: "Bạn đã làm xong báo cáo chưa?" },
		{ en: "They moved to Da Nang two years ago.", vi: "Họ chuyển đến Đà Nẵng cách đây 2 năm." },
	],
	exercises: [
		q(
			"pa-1",
			"We _____ to the cinema last night.",
			["go", "went", "gone", "going"],
			1,
			"'last night' → quá khứ đơn. 'go' bất quy tắc → went.",
		),
		q(
			"pa-2",
			"She _____ study for the test yesterday.",
			["doesn't", "didn't", "wasn't", "isn't"],
			1,
			"Quá khứ đơn phủ định: didn't + V nguyên mẫu.",
		),
		q(
			"pa-3",
			"_____ they enjoy the trip?",
			["Do", "Does", "Did", "Were"],
			2,
			"Câu hỏi quá khứ đơn: Did + S + V.",
		),
		q(
			"pa-4",
			"He _____ his keys this morning.",
			["loses", "lost", "losing", "has lost"],
			1,
			"'this morning' (đã kết thúc) → quá khứ đơn. 'lose' bất quy tắc → lost.",
		),
		q(
			"pa-5",
			"I _____ that movie two days ago.",
			["watch", "watched", "have watched", "watching"],
			1,
			"'ago' luôn đi với quá khứ đơn.",
		),
		q(
			"pa-6",
			"When _____ you born?",
			["are", "were", "do", "did"],
			1,
			"'born' đi với 'to be' ở quá khứ: 'were born'.",
		),
	],
}

const FIRST_CONDITIONAL: GrammarPoint = {
	id: "first-conditional",
	name: "First Conditional",
	vietnameseName: "Câu điều kiện loại 1",
	category: "conditionals",
	summary: "Điều kiện có thật, có khả năng xảy ra ở hiện tại hoặc tương lai.",
	whenToUse:
		"Dự đoán kết quả có thể xảy ra nếu điều kiện được đáp ứng. Mệnh đề if dùng hiện tại đơn, mệnh đề chính dùng will + V.",
	structures: ["If + S + V(s/es), S + will + V", "S + will + V if + S + V(s/es)"],
	examples: [
		{ en: "If it rains, we will stay home.", vi: "Nếu trời mưa, chúng ta sẽ ở nhà." },
		{ en: "She will pass if she studies hard.", vi: "Cô ấy sẽ đậu nếu học chăm." },
		{
			en: "If you don't hurry, you'll miss the bus.",
			vi: "Nếu bạn không nhanh lên, bạn sẽ lỡ xe buýt.",
		},
	],
	exercises: [
		q(
			"c1-1",
			"If you _____ hard, you will succeed.",
			["work", "worked", "will work", "working"],
			0,
			"Mệnh đề 'if' trong loại 1 dùng hiện tại đơn → work.",
		),
		q(
			"c1-2",
			"She _____ come if she has time.",
			["come", "comes", "will come", "came"],
			2,
			"Mệnh đề chính dùng will + V nguyên mẫu.",
		),
		q(
			"c1-3",
			"If it _____ tomorrow, we'll cancel the picnic.",
			["rain", "rains", "will rain", "rained"],
			1,
			"Hiện tại đơn ngôi 3 số ít (it) → rains, dù ý nghĩa là tương lai.",
		),
		q(
			"c1-4",
			"You will get wet if you _____ an umbrella.",
			["don't take", "didn't take", "won't take", "not take"],
			0,
			"Phủ định hiện tại đơn → don't + V.",
		),
		q(
			"c1-5",
			"If I _____ him, I will tell him the news.",
			["see", "saw", "will see", "seen"],
			0,
			"Mệnh đề if dùng hiện tại đơn → see.",
		),
	],
}

const SECOND_CONDITIONAL: GrammarPoint = {
	id: "second-conditional",
	name: "Second Conditional",
	vietnameseName: "Câu điều kiện loại 2",
	category: "conditionals",
	summary: "Điều kiện không có thật ở hiện tại hoặc giả định khó xảy ra.",
	whenToUse:
		"Giả định tình huống trái với thực tế ở hiện tại, hoặc điều ít có khả năng. If + quá khứ đơn, would + V. 'were' dùng cho mọi ngôi.",
	structures: ["If + S + V2/ed, S + would + V", "If I were you, I would + V"],
	examples: [
		{ en: "If I had money, I would travel.", vi: "Nếu tôi có tiền, tôi sẽ đi du lịch." },
		{
			en: "If I were you, I would accept the offer.",
			vi: "Nếu tôi là bạn, tôi sẽ nhận lời đề nghị.",
		},
		{
			en: "She would be happier if she lived abroad.",
			vi: "Cô ấy sẽ hạnh phúc hơn nếu sống ở nước ngoài.",
		},
	],
	exercises: [
		q(
			"c2-1",
			"If I _____ rich, I would buy a house.",
			["am", "was", "were", "will be"],
			2,
			"Loại 2 dùng 'were' cho mọi ngôi (I, he, she, it).",
		),
		q(
			"c2-2",
			"She _____ travel more if she had time.",
			["will", "would", "did", "does"],
			1,
			"Mệnh đề chính loại 2 dùng 'would + V'.",
		),
		q(
			"c2-3",
			"If he _____ here, he could help us.",
			["is", "was", "were", "will be"],
			2,
			"Loại 2, 'were' cho mọi ngôi.",
		),
		q(
			"c2-4",
			"What would you do if you _____ the lottery?",
			["win", "won", "will win", "would win"],
			1,
			"Mệnh đề if loại 2 dùng quá khứ đơn → won.",
		),
		q(
			"c2-5",
			"If I knew the answer, I _____ tell you.",
			["will", "would", "did", "am"],
			1,
			"Mệnh đề chính loại 2 → would + V.",
		),
	],
}

const THIRD_CONDITIONAL: GrammarPoint = {
	id: "third-conditional",
	name: "Third Conditional",
	vietnameseName: "Câu điều kiện loại 3",
	category: "conditionals",
	summary: "Điều kiện không có thật trong quá khứ — tiếc nuối việc đã xảy ra.",
	whenToUse:
		"Nói về tình huống trái với sự thật trong quá khứ. Thường diễn tả tiếc nuối. If + had + V3, would have + V3.",
	structures: ["If + S + had + V3, S + would have + V3"],
	examples: [
		{ en: "If I had studied, I would have passed.", vi: "Nếu tôi đã học bài, tôi đã đậu rồi." },
		{ en: "She would have come if she had known.", vi: "Cô ấy đã đến nếu cô ấy biết." },
		{
			en: "If they had left earlier, they wouldn't have missed the train.",
			vi: "Nếu họ rời sớm hơn, họ đã không lỡ tàu.",
		},
	],
	exercises: [
		q(
			"c3-1",
			"If I _____ her number, I would have called.",
			["knew", "have known", "had known", "know"],
			2,
			"Loại 3: If + had + V3 → had known.",
		),
		q(
			"c3-2",
			"She would have helped if you _____ her.",
			["ask", "asked", "had asked", "would ask"],
			2,
			"Mệnh đề if loại 3 → had + V3.",
		),
		q(
			"c3-3",
			"We _____ finished on time if we had started earlier.",
			["will have", "would have", "have", "had"],
			1,
			"Mệnh đề chính loại 3: would have + V3.",
		),
		q(
			"c3-4",
			"If he had driven more carefully, he _____ the accident.",
			["avoided", "would avoid", "would have avoided", "had avoided"],
			2,
			"Mệnh đề chính: would have + V3 → would have avoided.",
		),
		q(
			"c3-5",
			"I _____ gone if I had had the time.",
			["will have", "would have", "had", "would"],
			1,
			"Mệnh đề chính loại 3: would have + V3.",
		),
	],
}

const PRESENT_PASSIVE: GrammarPoint = {
	id: "present-passive",
	name: "Present Passive",
	vietnameseName: "Bị động thì hiện tại",
	category: "passives",
	summary: "Câu bị động khi chủ ngữ chịu tác động của hành động.",
	whenToUse:
		"Dùng khi muốn nhấn mạnh đối tượng chịu tác động, hoặc không biết/không quan tâm ai thực hiện hành động. Công thức: be + V3/ed.",
	structures: ["S + am/is/are + V3/ed (+ by O)", "S + am/is/are + not + V3/ed"],
	examples: [
		{ en: "English is spoken in many countries.", vi: "Tiếng Anh được nói ở nhiều nước." },
		{ en: "The room is cleaned every day.", vi: "Căn phòng được dọn mỗi ngày." },
		{
			en: "These books are written by J.K. Rowling.",
			vi: "Những quyển sách này được viết bởi J.K. Rowling.",
		},
	],
	exercises: [
		q(
			"pv-1",
			"This book _____ by millions of people.",
			["reads", "is read", "reading", "read"],
			1,
			"Bị động hiện tại: is/are + V3. 'book' số ít → is read.",
		),
		q(
			"pv-2",
			"The windows _____ once a week.",
			["cleans", "clean", "are cleaned", "is cleaned"],
			2,
			"'windows' số nhiều → are + V3 → are cleaned.",
		),
		q(
			"pv-3",
			"Rice _____ in many Asian countries.",
			["grows", "grown", "is grown", "growing"],
			2,
			"Bị động: is + V3 → is grown.",
		),
		q(
			"pv-4",
			"The letters _____ every morning.",
			["deliver", "delivered", "is delivered", "are delivered"],
			3,
			"'letters' số nhiều + bị động → are delivered.",
		),
		q(
			"pv-5",
			"English _____ all over the world.",
			["speak", "speaks", "is spoken", "spoken"],
			2,
			"Tiếng Anh được nói (bị động) → is spoken.",
		),
	],
}

const RELATIVE_CLAUSES: GrammarPoint = {
	id: "relative-clauses",
	name: "Relative Clauses",
	vietnameseName: "Mệnh đề quan hệ",
	category: "relatives",
	summary: "Bổ nghĩa cho danh từ bằng who / which / that / whose / where.",
	whenToUse:
		"Dùng để thêm thông tin cho danh từ đứng trước: who (người), which (vật), that (cả hai), whose (sở hữu), where (nơi chốn).",
	structures: ["N (người) + who/that + V…", "N (vật) + which/that + V…", "N + whose + N + V…"],
	examples: [
		{ en: "The man who called you is my uncle.", vi: "Người đàn ông vừa gọi bạn là chú tôi." },
		{
			en: "This is the book which I bought yesterday.",
			vi: "Đây là quyển sách tôi đã mua hôm qua.",
		},
		{ en: "The girl whose bag was stolen is crying.", vi: "Cô gái có cái túi bị trộm đang khóc." },
		{
			en: "I know a café where we can meet.",
			vi: "Tôi biết một quán cà phê chúng ta có thể gặp nhau.",
		},
	],
	exercises: [
		q(
			"rc-1",
			"The woman _____ lives next door is a doctor.",
			["which", "who", "whose", "where"],
			1,
			"Bổ nghĩa người → dùng 'who' (hoặc 'that').",
		),
		q(
			"rc-2",
			"I lost the keys _____ my father gave me.",
			["who", "whose", "which", "where"],
			2,
			"Bổ nghĩa vật → 'which' (hoặc 'that').",
		),
		q(
			"rc-3",
			"That's the boy _____ father is a lawyer.",
			["who", "which", "whose", "where"],
			2,
			"Chỉ sự sở hữu (bố của cậu ấy) → 'whose'.",
		),
		q(
			"rc-4",
			"This is the hotel _____ we stayed last year.",
			["which", "that", "whose", "where"],
			3,
			"Nơi chốn → 'where'.",
		),
		q(
			"rc-5",
			"The students _____ passed the exam will get a prize.",
			["who", "which", "whose", "where"],
			0,
			"Bổ nghĩa người → 'who'.",
		),
	],
}

// ─── Export ────────────────────────────────────────────────────────

export const MOCK_GRAMMAR_POINTS: readonly GrammarPoint[] = [
	PRESENT_SIMPLE,
	PRESENT_PERFECT,
	PAST_SIMPLE,
	FIRST_CONDITIONAL,
	SECOND_CONDITIONAL,
	THIRD_CONDITIONAL,
	PRESENT_PASSIVE,
	RELATIVE_CLAUSES,
]

export function findGrammarPoint(id: string): GrammarPoint | undefined {
	return MOCK_GRAMMAR_POINTS.find((p) => p.id === id)
}

export async function mockFetchGrammarPoints(): Promise<readonly GrammarPoint[]> {
	await new Promise((r) => setTimeout(r, 120))
	return MOCK_GRAMMAR_POINTS
}

export async function mockFetchGrammarPoint(id: string): Promise<GrammarPoint> {
	await new Promise((r) => setTimeout(r, 120))
	const point = findGrammarPoint(id)
	if (!point) throw new Error(`Không tìm thấy điểm ngữ pháp "${id}"`)
	return point
}
