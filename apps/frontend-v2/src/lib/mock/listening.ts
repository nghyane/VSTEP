// Mock listening data — 6 đề chia đều 3 Part của VSTEP Listening.
// Khi có API + audio thật: thay queryFn, thay `transcript` → `audioUrl`.

export type ListeningPart = 1 | 2 | 3

export interface ListeningItem {
	id: string
	question: string
	options: [string, string, string, string]
	correctIndex: 0 | 1 | 2 | 3
	explanation: string
}

export interface ListeningExercise {
	id: string
	title: string
	part: ListeningPart
	description: string
	transcript: string // TTS sẽ đọc text này
	vietnameseTranscript: string // bản dịch tiếng Việt
	keywords: readonly string[] // support mode hints
	estimatedMinutes: number
	items: ListeningItem[]
}

export const PART_LABELS: Record<ListeningPart, string> = {
	1: "Part 1 · Hội thoại ngắn",
	2: "Part 2 · Hội thoại dài",
	3: "Part 3 · Bài giảng / Thuyết trình",
}

// ─── Helper ────────────────────────────────────────────────────────

function q(
	id: string,
	question: string,
	options: [string, string, string, string],
	correctIndex: 0 | 1 | 2 | 3,
	explanation: string,
): ListeningItem {
	return { id, question, options, correctIndex, explanation }
}

// ─── Part 1: Short conversations ───────────────────────────────────

const P1_DIRECTIONS: ListeningExercise = {
	id: "l1-directions",
	title: "Hỏi đường đến bưu điện",
	part: 1,
	description: "Một người lạ hỏi đường đến bưu điện gần nhất.",
	transcript:
		"Excuse me, could you tell me how to get to the nearest post office? Sure. Go straight for two blocks, then turn left at the traffic light. The post office is on your right, next to a bakery. Thank you so much! You're welcome.",
	vietnameseTranscript:
		"Xin lỗi, bạn có thể chỉ cho tôi đường đến bưu điện gần nhất không? Được chứ. Đi thẳng hai dãy nhà, rồi rẽ trái ở đèn giao thông. Bưu điện ở bên phải bạn, cạnh tiệm bánh. Cảm ơn bạn rất nhiều! Không có gì.",
	keywords: ["post office", "two blocks", "turn left", "traffic light", "next to a bakery"],
	estimatedMinutes: 2,
	items: [
		q(
			"l1-d-1",
			"Where is the post office located?",
			[
				"Next to a supermarket",
				"On the left side of the bakery",
				"Next to a bakery",
				"Across from the traffic light",
			],
			2,
			"Người chỉ đường nói rõ: 'on your right, next to a bakery'.",
		),
		q(
			"l1-d-2",
			"How many blocks should the person walk straight?",
			["One block", "Two blocks", "Three blocks", "Four blocks"],
			1,
			"'Go straight for two blocks'.",
		),
	],
}

const P1_CAFE: ListeningExercise = {
	id: "l1-cafe-order",
	title: "Gọi đồ tại quán cà phê",
	part: 1,
	description: "Khách hàng gọi đồ uống và bánh ngọt tại quầy cà phê.",
	transcript:
		"Hi, what can I get for you? I'd like a large cappuccino and a chocolate croissant, please. For here or to go? To go, please. That'll be seven dollars fifty. Here's ten dollars. Thanks, and here's your change.",
	vietnameseTranscript:
		"Xin chào, bạn muốn gọi gì? Cho tôi một ly cappuccino lớn và một bánh sừng bò sô-cô-la. Dùng tại đây hay mang đi? Mang đi ạ. Tổng cộng bảy đô la năm mươi. Đây là mười đô la. Cảm ơn, đây là tiền thối lại.",
	keywords: ["large cappuccino", "chocolate croissant", "to go", "seven dollars fifty"],
	estimatedMinutes: 2,
	items: [
		q(
			"l1-c-1",
			"What does the customer order?",
			[
				"A small latte and a muffin",
				"A large cappuccino and a chocolate croissant",
				"A cappuccino and a bagel",
				"A large coffee and a donut",
			],
			1,
			"Khách nói rõ 'large cappuccino and a chocolate croissant'.",
		),
		q(
			"l1-c-2",
			"How much does the order cost?",
			["$5.50", "$7.00", "$7.50", "$10.00"],
			2,
			"Nhân viên nói: 'That'll be seven dollars fifty'.",
		),
	],
}

// ─── Part 2: Longer conversations ──────────────────────────────────

const P2_JOB_INTERVIEW: ListeningExercise = {
	id: "l2-job-interview",
	title: "Phỏng vấn xin việc",
	part: 2,
	description: "Một ứng viên trả lời câu hỏi phỏng vấn cho vị trí marketing.",
	transcript:
		"So, tell me about your previous experience. Well, I worked as a marketing assistant for three years at a small company in Hanoi. I was in charge of running social media campaigns and organizing events. That sounds interesting. What made you apply for this position? I'm looking for a bigger challenge. Your company has a strong international presence, and I want to develop my skills in global marketing. Great. What about your strengths and weaknesses? My strength is creativity, I love brainstorming new ideas. My weakness is that I sometimes focus too much on details, but I'm working on it. Very good. Do you have any questions for me? Yes, what does a typical day look like for someone in this role?",
	vietnameseTranscript:
		"Vậy, hãy kể cho tôi về kinh nghiệm trước đây của bạn. Tôi đã làm trợ lý marketing ba năm tại một công ty nhỏ ở Hà Nội. Tôi phụ trách chạy chiến dịch mạng xã hội và tổ chức sự kiện. Nghe thú vị đấy. Điều gì khiến bạn ứng tuyển vị trí này? Tôi đang tìm kiếm thử thách lớn hơn. Công ty của bạn có sự hiện diện quốc tế mạnh mẽ, và tôi muốn phát triển kỹ năng marketing toàn cầu. Tốt. Còn điểm mạnh và điểm yếu của bạn? Điểm mạnh của tôi là sáng tạo, tôi thích động não ý tưởng mới. Điểm yếu là đôi khi tôi quá tập trung vào chi tiết, nhưng tôi đang cải thiện. Rất tốt. Bạn có câu hỏi nào cho tôi không? Có, một ngày làm việc điển hình của vị trí này trông như thế nào?",
	keywords: [
		"marketing assistant",
		"three years",
		"Hanoi",
		"social media campaigns",
		"international presence",
		"creativity",
		"weakness: details",
	],
	estimatedMinutes: 4,
	items: [
		q(
			"l2-j-1",
			"How long did the candidate work at the previous company?",
			["One year", "Two years", "Three years", "Five years"],
			2,
			"'I worked as a marketing assistant for three years'.",
		),
		q(
			"l2-j-2",
			"What was the candidate mainly responsible for?",
			[
				"Finance and accounting",
				"Product design",
				"Running social media campaigns and organizing events",
				"Customer service",
			],
			2,
			"'I was in charge of running social media campaigns and organizing events'.",
		),
		q(
			"l2-j-3",
			"Why did the candidate apply for this position?",
			[
				"Higher salary",
				"Closer to home",
				"Bigger challenge and global marketing experience",
				"More vacation time",
			],
			2,
			"'I'm looking for a bigger challenge... develop my skills in global marketing'.",
		),
		q(
			"l2-j-4",
			"What does the candidate consider a weakness?",
			["Lack of creativity", "Focusing too much on details", "Poor time management", "Shyness"],
			1,
			"'My weakness is that I sometimes focus too much on details'.",
		),
	],
}

const P2_TRAVEL_PLAN: ListeningExercise = {
	id: "l2-travel-plan",
	title: "Lên kế hoạch du lịch",
	part: 2,
	description: "Hai người bạn bàn về chuyến du lịch cuối tuần.",
	transcript:
		"Have you decided where to go for the long weekend? I was thinking Da Lat. The weather is cool, and there are beautiful flower gardens this time of year. Sounds lovely. How are you planning to get there? I'll take the night bus from Saigon. It's cheaper than flying and gets in early morning. How many days are you staying? Three days, two nights. On the first day I want to visit the flower park and the old train station. Day two, maybe a waterfall. And day three, just relaxing at a café before the bus back. What about accommodation? I booked a small homestay for about twelve dollars a night. Very reasonable. Can I come along? Of course, the more the merrier.",
	vietnameseTranscript:
		"Bạn đã quyết định đi đâu vào kỳ nghỉ dài chưa? Tôi đang nghĩ đến Đà Lạt. Thời tiết mát mẻ, và có những vườn hoa đẹp vào thời điểm này trong năm. Nghe tuyệt đấy. Bạn định đi bằng gì? Tôi sẽ đi xe buýt đêm từ Sài Gòn. Rẻ hơn máy bay và đến vào sáng sớm. Bạn ở bao nhiêu ngày? Ba ngày hai đêm. Ngày đầu tôi muốn thăm vườn hoa và ga xe lửa cũ. Ngày hai, có lẽ đi thác nước. Ngày ba, chỉ thư giãn ở quán cà phê trước khi bắt xe về. Còn chỗ ở? Tôi đã đặt một homestay nhỏ khoảng mười hai đô la một đêm. Rất hợp lý. Tôi đi cùng được không? Tất nhiên, càng đông càng vui.",
	keywords: [
		"Da Lat",
		"long weekend",
		"night bus",
		"three days two nights",
		"flower park",
		"waterfall",
		"homestay",
		"twelve dollars",
	],
	estimatedMinutes: 4,
	items: [
		q(
			"l2-t-1",
			"Where are they planning to go?",
			["Ha Long Bay", "Sapa", "Da Lat", "Phu Quoc"],
			2,
			"'I was thinking Da Lat'.",
		),
		q(
			"l2-t-2",
			"How will the speaker travel there?",
			["By plane", "By train", "By night bus", "By car"],
			2,
			"'I'll take the night bus from Saigon'.",
		),
		q(
			"l2-t-3",
			"How long is the trip?",
			["Two days, one night", "Three days, two nights", "Four days, three nights", "One week"],
			1,
			"'Three days, two nights'.",
		),
		q(
			"l2-t-4",
			"How much does the homestay cost per night?",
			["$8", "$10", "$12", "$20"],
			2,
			"'twelve dollars a night'.",
		),
	],
}

// ─── Part 3: Lectures / talks ──────────────────────────────────────

const P3_SLEEP: ListeningExercise = {
	id: "l3-sleep-health",
	title: "Giấc ngủ và sức khỏe",
	part: 3,
	description: "Bài thuyết trình ngắn về tầm quan trọng của giấc ngủ.",
	transcript:
		"Good morning everyone. Today we'll talk about why sleep matters. Most adults need between seven and nine hours of sleep every night, yet studies show that nearly one third of people sleep less than six hours. Lack of sleep is linked to serious problems. It weakens the immune system, makes us more likely to get sick. It affects memory and learning, because the brain uses sleep to store new information. It also raises the risk of heart disease, diabetes, and depression. So how can we sleep better? First, keep a regular schedule, go to bed and wake up at the same time every day, even on weekends. Second, avoid caffeine after lunch, and don't use phones or computers in bed. The blue light from screens delays sleep hormones. Finally, make your bedroom cool, quiet, and dark. Small changes like these can dramatically improve your rest, and your health overall.",
	vietnameseTranscript:
		"Chào buổi sáng mọi người. Hôm nay chúng ta sẽ nói về tại sao giấc ngủ quan trọng. Hầu hết người lớn cần từ bảy đến chín giờ ngủ mỗi đêm, nhưng nghiên cứu cho thấy gần một phần ba số người ngủ ít hơn sáu giờ. Thiếu ngủ liên quan đến các vấn đề nghiêm trọng. Nó làm suy yếu hệ miễn dịch, khiến chúng ta dễ bị bệnh hơn. Nó ảnh hưởng đến trí nhớ và việc học, vì não sử dụng giấc ngủ để lưu trữ thông tin mới. Nó cũng làm tăng nguy cơ bệnh tim, tiểu đường và trầm cảm. Vậy làm sao để ngủ ngon hơn? Thứ nhất, giữ lịch trình đều đặn, đi ngủ và thức dậy cùng giờ mỗi ngày, kể cả cuối tuần. Thứ hai, tránh caffeine sau bữa trưa, và không dùng điện thoại hay máy tính trên giường. Ánh sáng xanh từ màn hình làm chậm hormone giấc ngủ. Cuối cùng, giữ phòng ngủ mát mẻ, yên tĩnh và tối. Những thay đổi nhỏ như vậy có thể cải thiện đáng kể giấc nghỉ và sức khỏe tổng thể của bạn.",
	keywords: [
		"seven to nine hours",
		"one third sleep less than six",
		"weakens immune system",
		"memory and learning",
		"regular schedule",
		"avoid caffeine after lunch",
		"no phones in bed",
		"cool quiet dark bedroom",
	],
	estimatedMinutes: 5,
	items: [
		q(
			"l3-s-1",
			"How many hours of sleep do most adults need?",
			["5 to 6 hours", "6 to 7 hours", "7 to 9 hours", "9 to 10 hours"],
			2,
			"'Most adults need between seven and nine hours of sleep'.",
		),
		q(
			"l3-s-2",
			"Approximately what fraction of people sleep less than six hours?",
			["One fourth", "One third", "One half", "Two thirds"],
			1,
			"'nearly one third of people sleep less than six hours'.",
		),
		q(
			"l3-s-3",
			"Which is NOT mentioned as a consequence of sleep deprivation?",
			["Weaker immune system", "Heart disease", "Poor vision", "Depression"],
			2,
			"Speaker nhắc immune system, memory, heart disease, diabetes, depression — không nhắc vision.",
		),
		q(
			"l3-s-4",
			"What does the speaker suggest avoiding after lunch?",
			["Heavy meals", "Caffeine", "Exercise", "Cold drinks"],
			1,
			"'avoid caffeine after lunch'.",
		),
		q(
			"l3-s-5",
			"Why should people avoid screens in bed?",
			[
				"Screens are too bright",
				"Blue light delays sleep hormones",
				"They cause headaches",
				"They make the bed uncomfortable",
			],
			1,
			"'The blue light from screens delays sleep hormones'.",
		),
	],
}

const P3_CLIMATE: ListeningExercise = {
	id: "l3-climate-change",
	title: "Biến đổi khí hậu",
	part: 3,
	description: "Bài giảng về nguyên nhân và tác động của biến đổi khí hậu.",
	transcript:
		"Climate change is one of the biggest challenges of our century. The main cause is human activity, especially burning fossil fuels like coal, oil, and gas. These activities release carbon dioxide and other greenhouse gases into the atmosphere. Since the year 1900, the average global temperature has risen by about one point one degrees Celsius. That may sound small, but the effects are huge. Glaciers are melting, sea levels are rising, and extreme weather events like hurricanes, droughts, and floods are becoming more frequent. Developing countries, especially those near the equator, suffer the most, even though they produce fewer emissions. The good news is there are solutions. Switching to renewable energy such as solar and wind, using public transport, reducing meat consumption, and protecting forests can all make a difference. But governments, businesses, and individuals must act together. The decisions we make in the next ten years will shape the planet for generations to come.",
	vietnameseTranscript:
		"Biến đổi khí hậu là một trong những thách thức lớn nhất của thế kỷ chúng ta. Nguyên nhân chính là hoạt động của con người, đặc biệt là đốt nhiên liệu hóa thạch như than, dầu và khí đốt. Các hoạt động này thải ra carbon dioxide và các khí nhà kính khác vào khí quyển. Kể từ năm 1900, nhiệt độ trung bình toàn cầu đã tăng khoảng 1,1 độ C. Nghe có vẻ nhỏ, nhưng tác động rất lớn. Sông băng đang tan chảy, mực nước biển đang dâng, và các hiện tượng thời tiết cực đoan như bão, hạn hán và lũ lụt ngày càng thường xuyên hơn. Các nước đang phát triển, đặc biệt gần xích đạo, chịu ảnh hưởng nặng nhất, dù họ thải ít khí hơn. Tin tốt là có giải pháp. Chuyển sang năng lượng tái tạo như mặt trời và gió, sử dụng giao thông công cộng, giảm tiêu thụ thịt và bảo vệ rừng đều có thể tạo ra sự khác biệt. Nhưng chính phủ, doanh nghiệp và cá nhân phải cùng hành động. Những quyết định chúng ta đưa ra trong mười năm tới sẽ định hình hành tinh cho các thế hệ mai sau.",
	keywords: [
		"fossil fuels",
		"carbon dioxide",
		"1.1 degrees Celsius since 1900",
		"melting glaciers",
		"rising sea levels",
		"extreme weather",
		"developing countries suffer most",
		"renewable energy",
		"next ten years",
	],
	estimatedMinutes: 5,
	items: [
		q(
			"l3-c-1",
			"What is the main cause of climate change mentioned in the talk?",
			["Volcanic activity", "Burning fossil fuels", "Solar cycles", "Deforestation only"],
			1,
			"'The main cause is human activity, especially burning fossil fuels'.",
		),
		q(
			"l3-c-2",
			"How much has the global temperature risen since 1900?",
			["0.5°C", "1.1°C", "2.0°C", "3.5°C"],
			1,
			"'has risen by about one point one degrees Celsius'.",
		),
		q(
			"l3-c-3",
			"Which group suffers the most from climate change?",
			[
				"Wealthy countries",
				"Cold northern regions",
				"Developing countries near the equator",
				"Mountain communities",
			],
			2,
			"'Developing countries, especially those near the equator, suffer the most'.",
		),
		q(
			"l3-c-4",
			"Which is NOT listed as a solution?",
			[
				"Switching to renewable energy",
				"Using public transport",
				"Building more highways",
				"Protecting forests",
			],
			2,
			"Speaker không nhắc highways; các giải pháp là renewable energy, public transport, reduce meat, protect forests.",
		),
		q(
			"l3-c-5",
			"What timeframe does the speaker say is critical?",
			["The next 2 years", "The next 5 years", "The next 10 years", "The next 50 years"],
			2,
			"'The decisions we make in the next ten years will shape the planet'.",
		),
	],
}

// ─── Export ────────────────────────────────────────────────────────

export const MOCK_LISTENING: readonly ListeningExercise[] = [
	P1_DIRECTIONS,
	P1_CAFE,
	P2_JOB_INTERVIEW,
	P2_TRAVEL_PLAN,
	P3_SLEEP,
	P3_CLIMATE,
]

export function findListeningExercise(id: string): ListeningExercise | undefined {
	return MOCK_LISTENING.find((e) => e.id === id)
}

export async function mockFetchListening(): Promise<readonly ListeningExercise[]> {
	await new Promise((r) => setTimeout(r, 120))
	return MOCK_LISTENING
}

export async function mockFetchListeningExercise(id: string): Promise<ListeningExercise> {
	await new Promise((r) => setTimeout(r, 120))
	const exercise = findListeningExercise(id)
	if (!exercise) throw new Error(`Không tìm thấy đề nghe "${id}"`)
	return exercise
}
