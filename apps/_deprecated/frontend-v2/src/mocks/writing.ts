// Mock writing data — 6 đề chia 2 Part: 3 letters (Part 1) + 3 essays (Part 2).
// TODO(backend): Khi connect API, WritingExercise map sang Question (skill=writing).
// - sampleMarkers lưu trong Question.content.sampleMarkers[] (jsonb)
// - match/occurrence dùng text-based lookup, KHÔNG dùng character offset (fragile)
// - Admin nhập markers bằng visual picker (bôi đen text → popup) ở question editor

export type WritingPart = 1 | 2

export interface WritingExercise {
	id: string
	title: string
	part: WritingPart
	description: string
	prompt: string
	minWords: number
	maxWords: number
	requiredPoints: readonly string[]
	keywords: readonly string[]
	sentenceStarters: readonly string[]
	outline?: readonly WritingOutlineSection[]
	template?: readonly WritingTemplateSection[]
	sampleAnswer: string
	/**
	 * Markers chú thích cho bài mẫu.
	 * Mỗi marker dùng `match` string để locate vị trí — không hardcode offset.
	 * Backend lưu trong Question.content.sampleMarkers[].
	 * Xem SampleMarkerDef ở writing-sample-markers.ts.
	 */
	sampleMarkers?: readonly SampleMarkerDef[]
	estimatedMinutes: number
}

/**
 * Marker chú thích cho bài mẫu. Dùng match-string thay vì character offset.
 *
 * Backend contract (Question.content.sampleMarkers[]):
 * {
 *   id: string           — unique trong bài
 *   match: string        — đoạn text cần highlight (phải tồn tại trong sampleAnswer)
 *   occurrence: number   — lần xuất hiện thứ mấy (1-based, default 1)
 *   side: "left"|"right" — sticker hiển thị bên nào
 *   color: "yellow"|"blue"|"pink"
 *   label: string        — tiêu đề sticker
 *   detail?: string      — giải thích ngắn
 * }
 *
 * Admin nhập: bôi đen text trong preview → popup điền label/color/side.
 * Frontend: tự tính { start, end } bằng matchToRange() trong writing-sample-markers.ts.
 */
export interface SampleMarkerDef {
	readonly id: string
	readonly match: string
	readonly occurrence?: number
	readonly side: "left" | "right"
	readonly color: "yellow" | "blue" | "pink"
	readonly label: string
	readonly detail?: string
}

export interface WritingOutlineSection {
	readonly title: string
	readonly bullets: readonly string[]
}

export interface WritingTemplatePart {
	readonly type: "text" | "blank"
	/** Cho type=text: nội dung chữ. Cho type=blank: id + label placeholder + hints. */
	readonly content?: string
	readonly id?: string
	readonly label?: string
	readonly hints?: readonly string[]
}

export interface WritingTemplateSection {
	readonly title: string
	readonly parts: readonly WritingTemplatePart[]
}

export const WRITING_PART_LABELS: Record<WritingPart, string> = {
	1: "Part 1 · Viết thư",
	2: "Part 2 · Viết luận",
}

// ─── Part 1 — Letters ──────────────────────────────────────────────

const P1_APOLOGY: WritingExercise = {
	id: "w1-apology-letter",
	title: "Thư xin lỗi bạn bè",
	part: 1,
	description: "Viết thư xin lỗi một người bạn vì đã lỡ hẹn dự sinh nhật.",
	prompt:
		"You missed your best friend's birthday party last week because of a family emergency. Write a letter to your friend to:\n\n- Apologize for not attending the party\n- Explain the reason why you could not come\n- Suggest a way to make it up to them\n\nWrite your letter in about 120 words. You do not need to include addresses.",
	minWords: 100,
	maxWords: 140,
	requiredPoints: [
		"Apologize for missing the party",
		"Explain the family emergency reason",
		"Suggest a make-up plan",
	],
	keywords: ["sorry", "apologize", "emergency", "make up", "birthday"],
	sentenceStarters: [
		"Dear [Name],",
		"I am writing to apologize for...",
		"I really wanted to be there, but...",
		"To make it up to you, I would like to...",
		"Once again, I am truly sorry.",
		"Best wishes, [Your name]",
	],
	outline: [
		{
			title: "Mở đầu",
			bullets: ["Chào hỏi (Dear ...)", "Nêu lý do viết thư: xin lỗi vì lỡ hẹn sinh nhật"],
		},
		{
			title: "Nội dung",
			bullets: [
				"Giải thích nguyên nhân không đến được (gia đình có việc khẩn)",
				"Thể hiện cảm xúc hối tiếc, chân thành",
				"Đề xuất cách bù đắp: mời đi ăn/tặng quà bù",
			],
		},
		{
			title: "Kết thúc",
			bullets: ["Xin lỗi lần nữa, mong được thông cảm", "Chào kết + ký tên"],
		},
	],
	template: [
		{
			title: "Mở đầu",
			parts: [
				{ type: "text", content: "Dear " },
				{
					type: "blank",
					id: "greet-name",
					label: "tên bạn",
					hints: ["Minh", "Lan", "Huy", "John"],
				},
				{ type: "text", content: ",\n\nI am writing to apologize for " },
				{
					type: "blank",
					id: "reason-open",
					label: "sự việc",
					hints: [
						"missing your birthday party last Saturday",
						"not being able to attend your party",
						"letting you down last weekend",
					],
				},
				{ type: "text", content: "." },
			],
		},
		{
			title: "Nội dung",
			parts: [
				{ type: "text", content: "\n\nUnfortunately, " },
				{
					type: "blank",
					id: "reason-detail",
					label: "lý do chi tiết",
					hints: [
						"my grandmother suddenly fell ill that morning",
						"my family had an emergency and I had to rush home",
						"I was involved in a minor accident on the way",
					],
				},
				{ type: "text", content: ", so I " },
				{
					type: "blank",
					id: "consequence",
					label: "hệ quả",
					hints: [
						"could not even send you a message",
						"had no time to inform you",
						"was unable to come as planned",
					],
				},
				{ type: "text", content: ". I feel terrible about letting you down." },
			],
		},
		{
			title: "Đề xuất",
			parts: [
				{ type: "text", content: "\n\nTo make it up to you, I would love to " },
				{
					type: "blank",
					id: "makeup-plan",
					label: "kế hoạch bù đắp",
					hints: [
						"take you out for dinner this weekend",
						"throw a small celebration just for us",
						"give you the present I bought and treat you to coffee",
					],
				},
				{ type: "text", content: "." },
			],
		},
		{
			title: "Kết thúc",
			parts: [
				{ type: "text", content: "\n\nOnce again, I am truly sorry. " },
				{
					type: "blank",
					id: "closing-line",
					label: "câu xin lỗi cuối",
					hints: [
						"Please forgive me",
						"I hope you can understand",
						"I promise I will make it up to you",
					],
				},
				{ type: "text", content: ".\n\nBest wishes,\n" },
				{
					type: "blank",
					id: "sign-name",
					label: "tên bạn",
					hints: ["Lan", "Minh", "Huy"],
				},
			],
		},
	],
	sampleAnswer: `Dear Minh,

I am writing to apologize for missing your birthday party last Saturday. I know how much effort you put into planning it, and I feel terrible for not being there.

Unfortunately, my grandmother suddenly fell ill that morning and had to be taken to the hospital. I spent the entire day with my family at the hospital, and I did not even have time to send you a message. I am really sorry for letting you know so late.

To make it up to you, I would love to take you out for dinner this weekend at your favourite restaurant. We can celebrate properly, just the two of us, and I will give you the present I bought.

Once again, I am truly sorry. Please forgive me.

Best wishes,
Lan`,
	sampleMarkers: [
		{
			id: "greeting",
			match: "Dear Minh,",
			occurrence: 1,
			side: "left",
			color: "yellow",
			label: "Lời chào",
			detail: "Mở đầu thân mật, đúng tone thư bạn bè",
		},
		{
			id: "writing-to",
			match: "I am writing to apologize",
			occurrence: 1,
			side: "right",
			color: "blue",
			label: "Cấu trúc B1",
			detail: "I am writing to + V — câu mở đầu thư formal",
		},
		{
			id: "unfortunately",
			match: "Unfortunately",
			occurrence: 1,
			side: "left",
			color: "pink",
			label: "Từ nối",
			detail: "Chuyển đoạn mượt, tạo tone đồng cảm",
		},
		{
			id: "would-love",
			match: "I would love to take you out",
			occurrence: 1,
			side: "right",
			color: "blue",
			label: "Nâng cấp B2",
			detail: "would love to + V — lịch sự hơn 'want to'",
		},
		{
			id: "closing",
			match: "Once again, I am truly sorry.",
			occurrence: 1,
			side: "left",
			color: "yellow",
			label: "Kết thư",
			detail: "Nhắc lại lời xin lỗi + chào kết đúng format",
		},
	],
	estimatedMinutes: 20,
}

const P1_COMPLAINT: WritingExercise = {
	id: "w1-complaint-letter",
	title: "Thư phàn nàn khách sạn",
	part: 1,
	description: "Viết thư phàn nàn gửi quản lý khách sạn về vấn đề trong kỳ nghỉ.",
	prompt:
		"You recently stayed at a hotel during your holiday and had several problems. Write a letter to the hotel manager. In your letter, you should:\n\n- Describe the problems you experienced\n- Explain how these affected your holiday\n- Say what you would like the manager to do\n\nWrite your letter in about 120 words.",
	minWords: 100,
	maxWords: 140,
	requiredPoints: [
		"Describe specific problems (at least 2)",
		"Explain impact on holiday",
		"Request action or compensation",
	],
	keywords: ["complaint", "problem", "noise", "disappointed", "refund", "apologize"],
	sentenceStarters: [
		"Dear Sir or Madam,",
		"I am writing to complain about...",
		"During my stay from [date] to [date]...",
		"These problems ruined my holiday because...",
		"I would like to request...",
		"I look forward to your reply.",
		"Yours faithfully, [Name]",
	],
	sampleAnswer: `Dear Sir or Madam,

I am writing to complain about my recent stay at your hotel from 10th to 15th of August. Unfortunately, I experienced several problems that made my holiday very disappointing.

Firstly, the air conditioning in my room did not work properly, so I could not sleep well at night. I reported this to the reception three times, but nothing was done. Secondly, the noise from the construction next door started early every morning at 6 a.m., which ruined my rest.

These problems affected my holiday badly because I was tired every day and could not enjoy my sightseeing trips.

I would like to request a partial refund of my booking fee. I hope you will take my complaint seriously and improve your service.

Yours faithfully,
Nguyen Van Hung`,
	estimatedMinutes: 20,
}

const P1_INVITATION: WritingExercise = {
	id: "w1-invitation-letter",
	title: "Thư mời bạn nước ngoài",
	part: 1,
	description: "Viết thư mời bạn nước ngoài đến thăm thành phố của bạn.",
	prompt:
		"Your friend from another country is planning to visit Vietnam. Write a letter inviting them to stay with you. In your letter:\n\n- Invite them to visit your city\n- Suggest places and activities you can enjoy together\n- Give practical advice about the trip (weather, what to bring)\n\nWrite your letter in about 120 words.",
	minWords: 100,
	maxWords: 140,
	requiredPoints: [
		"Invite friend clearly",
		"Suggest at least 2 places/activities",
		"Give practical advice",
	],
	keywords: ["invite", "visit", "weather", "bring", "enjoy"],
	sentenceStarters: [
		"Dear [Name],",
		"I was so happy to hear that...",
		"Why don't you come and stay with me...",
		"We could visit...",
		"The weather in [month] is...",
		"I cannot wait to see you!",
		"Best wishes, [Name]",
	],
	sampleAnswer: `Dear Emma,

I was so excited to hear that you are planning to visit Vietnam next month! Why don't you come and stay with me in Da Nang? I would love to show you around my beautiful city.

There are so many places I want to take you to. We can spend a day at My Khe beach, one of the most beautiful beaches in Asia, and then visit the Marble Mountains for some sightseeing. In the evening, we could walk across the famous Dragon Bridge to see it breathe fire.

The weather in November is usually mild and sunny, around 25 degrees, so please bring light clothes and a light jacket for the evenings. Don't forget your camera and comfortable walking shoes!

I cannot wait to see you soon.

Best wishes,
Linh`,
	estimatedMinutes: 20,
}

// ─── Part 2 — Essays ───────────────────────────────────────────────

const P2_SOCIAL_MEDIA: WritingExercise = {
	id: "w2-social-media",
	title: "Mạng xã hội có hại hay có lợi",
	part: 2,
	description: "Bài luận nêu quan điểm về tác động của mạng xã hội.",
	prompt:
		"Some people believe that social media has done more harm than good to society. Others think it has brought many benefits. What is your opinion?\n\nWrite an essay of about 250 words. Give reasons and examples to support your opinion.",
	minWords: 220,
	maxWords: 280,
	requiredPoints: [
		"Clear thesis statement / opinion",
		"At least 2 supporting reasons with examples",
		"Acknowledge opposing view briefly",
		"Conclusion restating position",
	],
	keywords: [
		"social media",
		"benefits",
		"however",
		"in my opinion",
		"in conclusion",
		"for example",
	],
	sentenceStarters: [
		"In today's modern world,...",
		"In my opinion,...",
		"On the one hand,...",
		"On the other hand,...",
		"For example,...",
		"However,...",
		"In conclusion,...",
	],
	sampleAnswer: `In today's connected world, social media plays a central role in how people communicate and share information. While some argue that it has caused more harm than good, I strongly believe that the benefits outweigh the drawbacks when used wisely.

On the one hand, critics often point to serious problems such as fake news, cyberbullying, and addiction. For example, many young people today spend hours scrolling through their phones instead of studying or spending time with family. Mental health issues related to online comparison have also increased in recent years.

On the other hand, social media offers tremendous benefits. Firstly, it helps people stay in touch with friends and family who live far away, especially during difficult times like the pandemic. Secondly, it creates learning opportunities through free educational content on YouTube, Instagram, and TikTok. Many students now improve their English or learn new skills from online creators.

Furthermore, social media supports small businesses by giving them a cheap way to reach customers. A local baker in my neighbourhood has grown her business entirely through Facebook posts and Instagram photos.

However, we should not ignore the risks. Users need to be critical of the information they see and set healthy limits on screen time. Schools and parents should also teach young people how to use social media responsibly.

In conclusion, social media is a powerful tool that brings more benefits than harm. The key is not to reject it, but to use it wisely and mindfully.`,
	estimatedMinutes: 40,
}

const P2_POLLUTION: WritingExercise = {
	id: "w2-air-pollution",
	title: "Ô nhiễm không khí ở thành phố lớn",
	part: 2,
	description: "Bài luận phân tích nguyên nhân và giải pháp cho ô nhiễm không khí.",
	prompt:
		"Air pollution has become a serious problem in many big cities. What are the main causes of this problem, and what can be done to solve it?\n\nWrite an essay of about 250 words.",
	minWords: 220,
	maxWords: 280,
	requiredPoints: [
		"Identify at least 2 main causes",
		"Propose at least 2 solutions",
		"Use examples or data",
		"Conclusion summarizing solutions",
	],
	keywords: [
		"air pollution",
		"vehicles",
		"factories",
		"renewable",
		"public transport",
		"in conclusion",
		"therefore",
	],
	sentenceStarters: [
		"Air pollution is one of the most serious problems...",
		"There are several causes of this problem. Firstly,...",
		"Secondly,...",
		"To solve this problem, governments should...",
		"In addition, individuals can...",
		"In conclusion,...",
	],
	sampleAnswer: `Air pollution has become one of the most serious environmental problems facing major cities around the world. In this essay, I will discuss the main causes and suggest some possible solutions.

There are several causes of air pollution. Firstly, the rapid increase in the number of private vehicles produces huge amounts of exhaust fumes. In cities like Hanoi and Ho Chi Minh City, millions of motorbikes and cars release carbon monoxide and fine dust particles every day. Secondly, factories located near urban areas burn fossil fuels such as coal and oil, releasing sulphur dioxide and other harmful gases into the air. Finally, the burning of waste and agricultural land in surrounding provinces adds smoke and toxic chemicals to city air.

To solve this problem, several actions are needed. Governments should invest in clean public transport such as electric buses and metro systems to reduce the number of private vehicles. For example, Singapore has successfully limited car ownership through high taxes and excellent public transport. In addition, strict regulations should be applied to factories, forcing them to use cleaner technology or move outside residential areas.

On an individual level, people can also make a difference. We can choose to walk, cycle, or share rides instead of driving alone. Planting more trees in our neighbourhoods helps absorb pollutants and produces fresh oxygen. Reducing household waste burning is another simple step.

In conclusion, air pollution is caused mainly by vehicles, factories, and waste burning. By combining government policies with individual effort, we can make our cities healthier and more pleasant places to live.`,
	estimatedMinutes: 40,
}

const P2_STUDY_ABROAD: WritingExercise = {
	id: "w2-study-abroad",
	title: "Du học hay học trong nước",
	part: 2,
	description: "Bài luận thảo luận ưu và nhược của du học so với học trong nước.",
	prompt:
		"Some students choose to study abroad, while others prefer to study in their home country. Discuss both views and give your own opinion.\n\nWrite an essay of about 250 words.",
	minWords: 220,
	maxWords: 280,
	requiredPoints: [
		"Discuss benefits of studying abroad",
		"Discuss benefits of studying at home",
		"State personal opinion clearly",
		"Support with reasons or examples",
	],
	keywords: [
		"study abroad",
		"home country",
		"experience",
		"expensive",
		"cultural",
		"in my view",
		"to sum up",
	],
	sentenceStarters: [
		"Choosing where to study is an important decision...",
		"On the one hand, studying abroad has many benefits...",
		"On the other hand, staying in one's home country also has advantages...",
		"In my view,...",
		"To sum up,...",
	],
	sampleAnswer: `Choosing where to pursue higher education is one of the most important decisions a young person makes. While some students dream of studying in a foreign country, others prefer to stay at home. Both options have their own advantages, and I will discuss them before giving my personal view.

On the one hand, studying abroad offers unique experiences that cannot be found at home. Students are exposed to different cultures, languages, and teaching methods, which helps them become more independent and open-minded. Famous universities in countries like the UK, Australia, or the USA provide world-class facilities and research opportunities. Graduates from these universities are also often seen as more attractive to international employers.

On the other hand, studying in one's home country has its own benefits. Firstly, it is much cheaper. Tuition fees and living costs in Vietnam are only a fraction of what they would be overseas, which reduces financial pressure on families. Secondly, students can stay close to their family and friends, which is important for emotional support. Finally, graduates can build strong local networks and understand their own job market better, leading to smoother career paths at home.

In my view, studying abroad is worth it if the student has clear goals and enough financial support. The exposure to new cultures and international thinking is invaluable. However, for most students, the best option is to study at home for their bachelor's degree and consider going abroad only for a master's programme.

To sum up, both paths can lead to success. The right choice depends on each person's dreams, budget, and long-term plans.`,
	estimatedMinutes: 40,
}

// ─── Export ────────────────────────────────────────────────────────

export const MOCK_WRITING: readonly WritingExercise[] = [
	P1_APOLOGY,
	P1_COMPLAINT,
	P1_INVITATION,
	P2_SOCIAL_MEDIA,
	P2_POLLUTION,
	P2_STUDY_ABROAD,
]

export function findWritingExercise(id: string): WritingExercise | undefined {
	return MOCK_WRITING.find((e) => e.id === id)
}

export async function mockFetchWriting(): Promise<readonly WritingExercise[]> {
	await new Promise((r) => setTimeout(r, 120))
	return MOCK_WRITING
}

export async function mockFetchWritingExercise(id: string): Promise<WritingExercise> {
	await new Promise((r) => setTimeout(r, 120))
	const exercise = findWritingExercise(id)
	if (!exercise) throw new Error(`Không tìm thấy đề viết "${id}"`)
	return exercise
}
