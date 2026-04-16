// Mock grammar data — FE mock trước khi backend có schema.
// Khi nối API: xóa file này + sửa queryFn trong lib/queries/grammar.ts

// ─── Taxonomy ──────────────────────────────────────────────────

export type GrammarCategory = "foundation" | "sentence" | "task" | "error-clinic"

export type VstepLevel = "B1" | "B2" | "C1"

export type VstepTask = "WT1" | "WT2" | "SP1" | "SP2" | "SP3" | "READ"

export type GrammarFunction = "accuracy" | "range" | "coherence" | "register"

export const CATEGORY_LABELS: Record<GrammarCategory, string> = {
	foundation: "Nền chính xác",
	sentence: "Xây câu & mở rộng ý",
	task: "Grammar theo bài thi",
	"error-clinic": "Phòng khám lỗi",
}

export const LEVEL_LABELS: Record<VstepLevel, string> = {
	B1: "Nền tảng B1",
	B2: "Nâng cao B2",
	C1: "Tinh chỉnh C1",
}

export const TASK_LABELS: Record<VstepTask, string> = {
	WT1: "Writing Task 1",
	WT2: "Writing Task 2",
	SP1: "Speaking Part 1",
	SP2: "Speaking Part 2",
	SP3: "Speaking Part 3",
	READ: "Reading",
}

// ─── Content types ─────────────────────────────────────────────

export interface GrammarExample {
	en: string
	vi: string
	note?: string
}

export interface CommonMistake {
	wrong: string
	correct: string
	explanation: string
}

export interface VstepTip {
	task: VstepTask
	tip: string
	example: string
}

// ─── Exercise union ────────────────────────────────────────────

export interface GrammarMCQ {
	kind: "mcq"
	id: string
	prompt: string
	options: [string, string, string, string]
	correctIndex: 0 | 1 | 2 | 3
	explanation: string
}

export interface GrammarErrorCorrection {
	kind: "error-correction"
	id: string
	sentence: string
	errorStart: number
	errorEnd: number
	correction: string
	explanation: string
}

export interface GrammarFillBlank {
	kind: "fill-blank"
	id: string
	template: string
	acceptedAnswers: string[]
	explanation: string
}

export interface GrammarRewrite {
	kind: "rewrite"
	id: string
	instruction: string
	original: string
	acceptedAnswers: string[]
	explanation: string
}

export type GrammarExercise =
	| GrammarMCQ
	| GrammarErrorCorrection
	| GrammarFillBlank
	| GrammarRewrite

// ─── GrammarPoint ──────────────────────────────────────────────

export interface GrammarPoint {
	id: string
	name: string
	vietnameseName: string
	category: GrammarCategory
	levels: VstepLevel[]
	tasks: VstepTask[]
	functions: GrammarFunction[]
	summary: string
	whenToUse: string
	structures: string[]
	examples: GrammarExample[]
	commonMistakes: CommonMistake[]
	vstepTips: VstepTip[]
	exercises: GrammarExercise[]
}

// ─── Helpers ───────────────────────────────────────────────────

function mcq(
	id: string,
	prompt: string,
	options: [string, string, string, string],
	correctIndex: 0 | 1 | 2 | 3,
	explanation: string,
): GrammarMCQ {
	return { kind: "mcq", id, prompt, options, correctIndex, explanation }
}

function ec(
	id: string,
	sentence: string,
	errorStart: number,
	errorEnd: number,
	correction: string,
	explanation: string,
): GrammarErrorCorrection {
	return { kind: "error-correction", id, sentence, errorStart, errorEnd, correction, explanation }
}

function fb(
	id: string,
	template: string,
	acceptedAnswers: string[],
	explanation: string,
): GrammarFillBlank {
	return { kind: "fill-blank", id, template, acceptedAnswers, explanation }
}

function rw(
	id: string,
	instruction: string,
	original: string,
	acceptedAnswers: string[],
	explanation: string,
): GrammarRewrite {
	return { kind: "rewrite", id, instruction, original, acceptedAnswers, explanation }
}

// ─── Grammar points ────────────────────────────────────────────

const PRESENT_SIMPLE: GrammarPoint = {
	id: "present-simple",
	name: "Present Simple",
	vietnameseName: "Thì hiện tại đơn",
	category: "foundation",
	levels: ["B1"],
	tasks: ["SP1", "WT1", "READ"],
	functions: ["accuracy"],
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
	commonMistakes: [
		{
			wrong: "She go to school every day.",
			correct: "She goes to school every day.",
			explanation: "Ngôi thứ ba số ít (she/he/it) phải thêm -s/-es vào động từ.",
		},
		{
			wrong: "He don't like spicy food.",
			correct: "He doesn't like spicy food.",
			explanation: "Phủ định ngôi thứ ba số ít dùng 'doesn't', không phải 'don't'.",
		},
	],
	vstepTips: [
		{
			task: "SP1",
			tip: "Dùng hiện tại đơn khi nói về thói quen, sở thích cá nhân trong Speaking Part 1.",
			example: "I usually spend my weekends reading books or cycling around the lake.",
		},
		{
			task: "WT1",
			tip: "Trong email/thư, dùng hiện tại đơn để nêu lý do viết thư hoặc thông tin cố định.",
			example: "I am writing to inquire about the training programme your centre offers.",
		},
	],
	exercises: [
		mcq(
			"ps-1",
			"She _____ to work by bus every day.",
			["go", "goes", "going", "gone"],
			1,
			"Chủ ngữ số ít ngôi thứ ba (She) + V-s/es → goes.",
		),
		mcq(
			"ps-2",
			"_____ they live in Hanoi?",
			["Are", "Is", "Do", "Does"],
			2,
			"Chủ ngữ 'they' (số nhiều) dùng trợ động từ 'Do' cho câu hỏi hiện tại đơn.",
		),
		mcq(
			"ps-3",
			"My brother _____ like spicy food.",
			["don't", "doesn't", "isn't", "aren't"],
			1,
			"Chủ ngữ số ít → doesn't + V nguyên mẫu.",
		),
		mcq(
			"ps-4",
			"The sun _____ in the east.",
			["rise", "rises", "rising", "rose"],
			1,
			"Sự thật hiển nhiên → hiện tại đơn, ngôi thứ ba số ít → rises.",
		),
		mcq(
			"ps-5",
			"How often _____ you exercise?",
			["do", "does", "are", "is"],
			0,
			"How often + do/does + S + V — 'you' dùng 'do'.",
		),
		ec(
			"ps-ec-1",
			"My parents lives in a small town.",
			11,
			16,
			"live",
			"Chủ ngữ số nhiều 'my parents' → động từ không thêm -s.",
		),
		fb(
			"ps-fb-1",
			"Water ___ at 100 degrees Celsius.",
			["boils"],
			"Sự thật hiển nhiên dùng hiện tại đơn, ngôi thứ ba số ít → boils.",
		),
	],
}

const PRESENT_PERFECT: GrammarPoint = {
	id: "present-perfect",
	name: "Present Perfect",
	vietnameseName: "Thì hiện tại hoàn thành",
	category: "foundation",
	levels: ["B1", "B2"],
	tasks: ["SP1", "SP3", "WT2", "READ"],
	functions: ["accuracy", "range"],
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
	commonMistakes: [
		{
			wrong: "I have went to Paris last year.",
			correct: "I went to Paris last year.",
			explanation:
				"'Last year' là mốc thời gian xác định trong quá khứ → dùng quá khứ đơn, không phải hiện tại hoàn thành.",
		},
		{
			wrong: "She has lived here since 3 years.",
			correct: "She has lived here for 3 years.",
			explanation:
				"'Since' đi với thời điểm cụ thể (since 2020). 'For' đi với khoảng thời gian (for 3 years).",
		},
	],
	vstepTips: [
		{
			task: "SP1",
			tip: "Dùng hiện tại hoàn thành để nói về kinh nghiệm cá nhân trong Speaking Part 1.",
			example:
				"I have visited several countries in Southeast Asia, including Thailand and Cambodia.",
		},
		{
			task: "WT2",
			tip: "Trong essay, dùng hiện tại hoàn thành để nêu xu hướng đang diễn ra.",
			example:
				"In recent years, the use of social media has increased dramatically among young people.",
		},
	],
	exercises: [
		mcq(
			"pp-1",
			"I _____ this book three times.",
			["read", "have read", "reading", "reads"],
			1,
			"Kinh nghiệm nhiều lần → hiện tại hoàn thành 'have read'.",
		),
		mcq(
			"pp-2",
			"She has lived in Paris _____ 2018.",
			["for", "since", "in", "at"],
			1,
			"'since' đi với thời điểm cụ thể (2018); 'for' đi với khoảng thời gian.",
		),
		mcq(
			"pp-3",
			"_____ you ever eaten sushi?",
			["Did", "Do", "Have", "Has"],
			2,
			"'ever' (đã từng) là dấu hiệu của hiện tại hoàn thành — 'Have you ever…'.",
		),
		mcq(
			"pp-4",
			"He has _____ arrived at the airport.",
			["yet", "just", "ago", "last"],
			1,
			"'just' = vừa mới, đặt sau have/has.",
		),
		mcq(
			"pp-5",
			"We haven't finished the project _____.",
			["already", "just", "yet", "since"],
			2,
			"'yet' trong câu phủ định = chưa, đặt cuối câu.",
		),
		ec(
			"pp-ec-1",
			"I have went to that restaurant before.",
			7,
			11,
			"been",
			"Hiện tại hoàn thành của 'go' khi nói về kinh nghiệm là 'have been', không phải 'have went'.",
		),
		fb(
			"pp-fb-1",
			"She ___ just finished her report.",
			["has"],
			"Chủ ngữ số ít ngôi thứ ba (she) + has + V3.",
		),
		rw(
			"pp-rw-1",
			"Viết lại câu dùng 'for' hoặc 'since'.",
			"She started working here in 2019. She still works here.",
			["She has worked here since 2019.", "She has been working here since 2019."],
			"Hành động bắt đầu ở quá khứ và còn tiếp diễn → hiện tại hoàn thành + since + thời điểm.",
		),
	],
}

const PAST_SIMPLE: GrammarPoint = {
	id: "past-simple",
	name: "Past Simple",
	vietnameseName: "Thì quá khứ đơn",
	category: "foundation",
	levels: ["B1"],
	tasks: ["SP1", "WT1", "READ"],
	functions: ["accuracy"],
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
	commonMistakes: [
		{
			wrong: "I have visited Hanoi last year.",
			correct: "I visited Hanoi last year.",
			explanation:
				"'Last year' là mốc thời gian xác định → quá khứ đơn, không dùng hiện tại hoàn thành.",
		},
		{
			wrong: "She didn't went to school yesterday.",
			correct: "She didn't go to school yesterday.",
			explanation: "Sau 'didn't' luôn dùng động từ nguyên mẫu, không chia.",
		},
	],
	vstepTips: [
		{
			task: "SP1",
			tip: "Dùng quá khứ đơn khi kể về trải nghiệm cụ thể trong quá khứ.",
			example:
				"When I was in secondary school, I joined the English speaking club and won second prize.",
		},
		{
			task: "WT1",
			tip: "Trong email kể lại sự việc, dùng quá khứ đơn để tường thuật chuỗi hành động.",
			example: "I attended the workshop last Friday and found it extremely informative.",
		},
	],
	exercises: [
		mcq(
			"pa-1",
			"We _____ to the cinema last night.",
			["go", "went", "gone", "going"],
			1,
			"'last night' → quá khứ đơn. 'go' bất quy tắc → went.",
		),
		mcq(
			"pa-2",
			"She _____ study for the test yesterday.",
			["doesn't", "didn't", "wasn't", "isn't"],
			1,
			"Quá khứ đơn phủ định: didn't + V nguyên mẫu.",
		),
		mcq(
			"pa-3",
			"_____ they enjoy the trip?",
			["Do", "Does", "Did", "Were"],
			2,
			"Câu hỏi quá khứ đơn: Did + S + V.",
		),
		mcq(
			"pa-4",
			"He _____ his keys this morning.",
			["loses", "lost", "losing", "has lost"],
			1,
			"'this morning' (đã kết thúc) → quá khứ đơn. 'lose' bất quy tắc → lost.",
		),
		ec(
			"pa-ec-1",
			"She didn't went to the meeting.",
			10,
			14,
			"go",
			"Sau 'didn't' dùng động từ nguyên mẫu, không chia.",
		),
		fb(
			"pa-fb-1",
			"I ___ (visit) my grandparents last weekend.",
			["visited"],
			"Có 'last weekend' → quá khứ đơn, thêm -ed.",
		),
	],
}

const FIRST_CONDITIONAL: GrammarPoint = {
	id: "first-conditional",
	name: "First Conditional",
	vietnameseName: "Câu điều kiện loại 1",
	category: "sentence",
	levels: ["B1", "B2"],
	tasks: ["SP2", "WT2"],
	functions: ["range", "coherence"],
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
	commonMistakes: [
		{
			wrong: "If it will rain, we will stay home.",
			correct: "If it rains, we will stay home.",
			explanation: "Mệnh đề 'if' trong loại 1 dùng hiện tại đơn, không dùng 'will'.",
		},
	],
	vstepTips: [
		{
			task: "SP2",
			tip: "Dùng loại 1 để đề xuất giải pháp có tính thực tế trong Speaking Part 2.",
			example:
				"If the school provides more extracurricular activities, students will be more motivated to attend.",
		},
		{
			task: "WT2",
			tip: "Trong essay, dùng loại 1 để nêu hệ quả thực tế của một chính sách hoặc hành động.",
			example:
				"If the government invests more in public transport, traffic congestion will decrease significantly.",
		},
	],
	exercises: [
		mcq(
			"c1-1",
			"If you _____ hard, you will succeed.",
			["work", "worked", "will work", "working"],
			0,
			"Mệnh đề 'if' trong loại 1 dùng hiện tại đơn → work.",
		),
		mcq(
			"c1-2",
			"She _____ come if she has time.",
			["come", "comes", "will come", "came"],
			2,
			"Mệnh đề chính dùng will + V nguyên mẫu.",
		),
		mcq(
			"c1-3",
			"If it _____ tomorrow, we'll cancel the picnic.",
			["rain", "rains", "will rain", "rained"],
			1,
			"Hiện tại đơn ngôi 3 số ít (it) → rains, dù ý nghĩa là tương lai.",
		),
		ec(
			"c1-ec-1",
			"If it will rain tomorrow, we will cancel the trip.",
			6,
			15,
			"rains",
			"Mệnh đề 'if' loại 1 dùng hiện tại đơn, không dùng 'will'.",
		),
		fb(
			"c1-fb-1",
			"If she ___ (study) harder, she will pass the exam.",
			["studies"],
			"Mệnh đề if loại 1 → hiện tại đơn, ngôi thứ ba số ít → studies.",
		),
	],
}

const SECOND_CONDITIONAL: GrammarPoint = {
	id: "second-conditional",
	name: "Second Conditional",
	vietnameseName: "Câu điều kiện loại 2",
	category: "sentence",
	levels: ["B2"],
	tasks: ["SP2", "SP3", "WT2"],
	functions: ["range", "coherence"],
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
	commonMistakes: [
		{
			wrong: "If I was you, I would leave.",
			correct: "If I were you, I would leave.",
			explanation:
				"Trong câu điều kiện loại 2, 'to be' dùng 'were' cho mọi ngôi (kể cả I/he/she/it).",
		},
		{
			wrong: "If I would have money, I would travel.",
			correct: "If I had money, I would travel.",
			explanation: "Mệnh đề 'if' loại 2 dùng quá khứ đơn, không dùng 'would'.",
		},
	],
	vstepTips: [
		{
			task: "SP2",
			tip: "Dùng 'If I were you, I would...' để đưa ra lời khuyên hoặc đề xuất trong Speaking Part 2.",
			example:
				"If I were in that situation, I would talk to the teacher directly rather than ignoring the problem.",
		},
		{
			task: "WT2",
			tip: "Dùng loại 2 để thảo luận giả thuyết hoặc tình huống lý tưởng trong essay.",
			example:
				"If every citizen reduced their plastic consumption, the environmental impact would be considerable.",
		},
	],
	exercises: [
		mcq(
			"c2-1",
			"If I _____ rich, I would buy a house.",
			["am", "was", "were", "will be"],
			2,
			"Loại 2 dùng 'were' cho mọi ngôi (I, he, she, it).",
		),
		mcq(
			"c2-2",
			"She _____ travel more if she had time.",
			["will", "would", "did", "does"],
			1,
			"Mệnh đề chính loại 2 dùng 'would + V'.",
		),
		mcq(
			"c2-3",
			"What would you do if you _____ the lottery?",
			["win", "won", "will win", "would win"],
			1,
			"Mệnh đề if loại 2 dùng quá khứ đơn → won.",
		),
		ec(
			"c2-ec-1",
			"If I was you, I would apologise immediately.",
			3,
			6,
			"were",
			"Loại 2 dùng 'were' cho mọi ngôi, kể cả 'I'.",
		),
		fb(
			"c2-fb-1",
			"If he ___ (have) more time, he would learn a new language.",
			["had"],
			"Mệnh đề if loại 2 → quá khứ đơn → had.",
		),
		rw(
			"c2-rw-1",
			"Viết lại câu dùng câu điều kiện loại 2.",
			"I don't have a car, so I can't drive to work.",
			["If I had a car, I could drive to work.", "If I had a car, I would drive to work."],
			"Tình huống trái thực tế hiện tại → loại 2: If + quá khứ đơn, would/could + V.",
		),
	],
}

const THIRD_CONDITIONAL: GrammarPoint = {
	id: "third-conditional",
	name: "Third Conditional",
	vietnameseName: "Câu điều kiện loại 3",
	category: "sentence",
	levels: ["B2", "C1"],
	tasks: ["SP3", "WT2"],
	functions: ["range", "coherence"],
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
	commonMistakes: [
		{
			wrong: "If I would have studied, I would have passed.",
			correct: "If I had studied, I would have passed.",
			explanation: "Mệnh đề 'if' loại 3 dùng 'had + V3', không dùng 'would have'.",
		},
	],
	vstepTips: [
		{
			task: "SP3",
			tip: "Dùng loại 3 để phân tích nguyên nhân-kết quả trong quá khứ khi thảo luận chủ đề phức tạp.",
			example:
				"If the authorities had acted sooner, the damage caused by the flood would have been much less severe.",
		},
		{
			task: "WT2",
			tip: "Dùng loại 3 để phân tích hệ quả của quyết định trong quá khứ, tăng chiều sâu lập luận.",
			example:
				"If stricter environmental policies had been implemented decades ago, we would not be facing such a severe climate crisis today.",
		},
	],
	exercises: [
		mcq(
			"c3-1",
			"If I _____ her number, I would have called.",
			["knew", "have known", "had known", "know"],
			2,
			"Loại 3: If + had + V3 → had known.",
		),
		mcq(
			"c3-2",
			"She would have helped if you _____ her.",
			["ask", "asked", "had asked", "would ask"],
			2,
			"Mệnh đề if loại 3 → had + V3.",
		),
		mcq(
			"c3-3",
			"We _____ finished on time if we had started earlier.",
			["will have", "would have", "have", "had"],
			1,
			"Mệnh đề chính loại 3: would have + V3.",
		),
		ec(
			"c3-ec-1",
			"If I would have known, I would have told you.",
			3,
			18,
			"had known",
			"Mệnh đề 'if' loại 3 dùng 'had + V3', không dùng 'would have'.",
		),
		fb(
			"c3-fb-1",
			"If they ___ (leave) earlier, they wouldn't have missed the flight.",
			["had left"],
			"Loại 3: If + had + V3 → had left.",
		),
	],
}

const PRESENT_PASSIVE: GrammarPoint = {
	id: "present-passive",
	name: "Passive Voice",
	vietnameseName: "Câu bị động",
	category: "sentence",
	levels: ["B1", "B2"],
	tasks: ["WT2", "READ"],
	functions: ["range", "register"],
	summary: "Câu bị động nhấn mạnh đối tượng chịu tác động thay vì chủ thể thực hiện.",
	whenToUse:
		"Dùng khi muốn nhấn mạnh đối tượng chịu tác động, hoặc không biết/không quan tâm ai thực hiện hành động. Phổ biến trong văn viết học thuật và báo cáo. Công thức: be + V3/ed.",
	structures: [
		"S + am/is/are + V3/ed (+ by O)  [hiện tại]",
		"S + was/were + V3/ed (+ by O)  [quá khứ]",
		"S + will be + V3/ed  [tương lai]",
		"S + have/has been + V3/ed  [hiện tại hoàn thành]",
	],
	examples: [
		{ en: "English is spoken in many countries.", vi: "Tiếng Anh được nói ở nhiều nước." },
		{ en: "The report was submitted yesterday.", vi: "Báo cáo đã được nộp hôm qua." },
		{
			en: "New policies will be introduced next year.",
			vi: "Các chính sách mới sẽ được giới thiệu năm tới.",
		},
		{
			en: "The issue has been discussed extensively.",
			vi: "Vấn đề này đã được thảo luận rộng rãi.",
			note: "văn học thuật",
		},
	],
	commonMistakes: [
		{
			wrong: "The book was wrote by a famous author.",
			correct: "The book was written by a famous author.",
			explanation: "Bị động dùng V3 (past participle), không phải V2. 'write' → 'written'.",
		},
		{
			wrong: "This problem should solved immediately.",
			correct: "This problem should be solved immediately.",
			explanation: "Modal + bị động: modal + be + V3. Không bỏ 'be'.",
		},
	],
	vstepTips: [
		{
			task: "WT2",
			tip: "Dùng bị động để tạo giọng văn khách quan, học thuật trong essay — tránh dùng 'I' quá nhiều.",
			example: "It is widely believed that education plays a crucial role in reducing poverty.",
		},
		{
			task: "READ",
			tip: "Nhận biết bị động trong bài đọc để hiểu đúng ai là chủ thể và ai là đối tượng của hành động.",
			example:
				"The new regulation was approved by the committee last month. → Committee phê duyệt, regulation được phê duyệt.",
		},
	],
	exercises: [
		mcq(
			"pv-1",
			"This book _____ by millions of people.",
			["reads", "is read", "reading", "read"],
			1,
			"Bị động hiện tại: is/are + V3. 'book' số ít → is read.",
		),
		mcq(
			"pv-2",
			"The windows _____ once a week.",
			["cleans", "clean", "are cleaned", "is cleaned"],
			2,
			"'windows' số nhiều → are + V3 → are cleaned.",
		),
		mcq(
			"pv-3",
			"New policies _____ next year.",
			["will introduce", "will be introduced", "are introduced", "introduced"],
			1,
			"Bị động tương lai: will be + V3.",
		),
		ec(
			"pv-ec-1",
			"The report was wrote by the manager.",
			16,
			21,
			"written",
			"Bị động dùng V3 (past participle): write → written.",
		),
		fb(
			"pv-fb-1",
			"This problem should ___ solved as soon as possible.",
			["be"],
			"Modal + bị động: modal + be + V3. Không bỏ 'be'.",
		),
		rw(
			"pv-rw-1",
			"Viết lại câu ở dạng bị động.",
			"The committee approved the new regulation last month.",
			[
				"The new regulation was approved by the committee last month.",
				"The new regulation was approved last month.",
			],
			"Chủ ngữ chủ động (the committee) → by-phrase. Tân ngữ (the new regulation) → chủ ngữ bị động. was + V3.",
		),
	],
}

const RELATIVE_CLAUSES: GrammarPoint = {
	id: "relative-clauses",
	name: "Relative Clauses",
	vietnameseName: "Mệnh đề quan hệ",
	category: "sentence",
	levels: ["B1", "B2"],
	tasks: ["WT2", "SP3", "READ"],
	functions: ["range", "coherence"],
	summary: "Bổ nghĩa cho danh từ bằng who / which / that / whose / where.",
	whenToUse:
		"Dùng để thêm thông tin cho danh từ đứng trước: who (người), which (vật), that (cả hai), whose (sở hữu), where (nơi chốn). Mệnh đề quan hệ xác định (defining) không có dấu phẩy; không xác định (non-defining) có dấu phẩy.",
	structures: [
		"N (người) + who/that + V…",
		"N (vật) + which/that + V…",
		"N + whose + N + V…",
		"N (nơi) + where + S + V…",
	],
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
	commonMistakes: [
		{
			wrong: "The student which won the prize is my friend.",
			correct: "The student who won the prize is my friend.",
			explanation: "'Who' dùng cho người, 'which' dùng cho vật/sự việc.",
		},
		{
			wrong: "This is the city where I was born there.",
			correct: "This is the city where I was born.",
			explanation:
				"Không lặp lại trạng từ chỉ nơi chốn sau 'where'. 'Where' đã thay thế cho 'there'.",
		},
	],
	vstepTips: [
		{
			task: "WT2",
			tip: "Dùng mệnh đề quan hệ để kết hợp 2 câu ngắn thành 1 câu phức, tăng điểm range.",
			example:
				"Education is a fundamental right. It should be accessible to all. → Education, which is a fundamental right, should be accessible to all.",
		},
		{
			task: "SP3",
			tip: "Dùng mệnh đề quan hệ để giải thích, bổ sung thông tin khi thảo luận chủ đề trừu tượng.",
			example:
				"People who grow up in multilingual environments tend to have stronger cognitive flexibility.",
		},
	],
	exercises: [
		mcq(
			"rc-1",
			"The woman _____ lives next door is a doctor.",
			["which", "who", "whose", "where"],
			1,
			"Bổ nghĩa người → dùng 'who' (hoặc 'that').",
		),
		mcq(
			"rc-2",
			"I lost the keys _____ my father gave me.",
			["who", "whose", "which", "where"],
			2,
			"Bổ nghĩa vật → 'which' (hoặc 'that').",
		),
		mcq(
			"rc-3",
			"That's the boy _____ father is a lawyer.",
			["who", "which", "whose", "where"],
			2,
			"Chỉ sự sở hữu (bố của cậu ấy) → 'whose'.",
		),
		mcq(
			"rc-4",
			"This is the hotel _____ we stayed last year.",
			["which", "that", "whose", "where"],
			3,
			"Nơi chốn → 'where'.",
		),
		ec(
			"rc-ec-1",
			"The student which won the competition received a scholarship.",
			12,
			17,
			"who",
			"'Who' dùng cho người, 'which' dùng cho vật.",
		),
		fb("rc-fb-1", "This is the city ___ I was born.", ["where"], "Nơi chốn → 'where'."),
		rw(
			"rc-rw-1",
			"Kết hợp hai câu dùng mệnh đề quan hệ.",
			"The researcher published a paper. The paper changed our understanding of climate change.",
			[
				"The researcher published a paper which changed our understanding of climate change.",
				"The researcher published a paper that changed our understanding of climate change.",
			],
			"Dùng 'which' hoặc 'that' để bổ nghĩa cho 'paper' (vật).",
		),
	],
}

// ─── Export ────────────────────────────────────────────────────

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
