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

export interface WordTimestamp {
	word: string
	start: number // seconds
	end: number // seconds
}

export interface ListeningExercise {
	id: string
	title: string
	part: ListeningPart
	description: string
	audioUrl?: string
	transcript: string
	/** Word-level timestamps from Whisper. If present, subtitle syncs precisely. */
	wordTimestamps?: readonly WordTimestamp[]
	vietnameseTranscript: string
	keywords: readonly string[]
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

// ─── Part 1: Extra exercises for pagination test ───────────────────

function makeP1Extra(idx: number, title: string, desc: string): ListeningExercise {
	return {
		id: `l1-extra-${idx}`,
		title,
		part: 1,
		description: desc,
		transcript:
			"This is a sample conversation for testing purposes. Two people are talking about everyday topics.",
		vietnameseTranscript:
			"Đây là đoạn hội thoại mẫu để kiểm thử. Hai người đang nói về các chủ đề hàng ngày.",
		keywords: ["sample", "conversation", "everyday"],
		estimatedMinutes: 2,
		items: [
			q(
				`l1-e${idx}-1`,
				"What is the conversation about?",
				["Weather", "Food", "Everyday topics", "Sports"],
				2,
				"Sample explanation.",
			),
			q(
				`l1-e${idx}-2`,
				"How many people are talking?",
				["One", "Two", "Three", "Four"],
				1,
				"Two people are talking.",
			),
		],
	}
}

const P1_EXTRAS: ListeningExercise[] = [
	makeP1Extra(1, "Đặt phòng khách sạn", "Khách gọi điện đặt phòng khách sạn cho kỳ nghỉ."),
	makeP1Extra(2, "Mua vé xe buýt", "Hành khách hỏi mua vé xe buýt đi liên tỉnh."),
	makeP1Extra(3, "Hỏi giờ mở cửa", "Khách hỏi giờ mở cửa của thư viện thành phố."),
	makeP1Extra(4, "Gọi taxi", "Khách gọi taxi từ sân bay về khách sạn."),
	makeP1Extra(5, "Mua thuốc ở hiệu thuốc", "Khách mô tả triệu chứng và mua thuốc."),
	makeP1Extra(6, "Đổi tiền ở ngân hàng", "Khách hỏi tỷ giá và đổi ngoại tệ."),
	makeP1Extra(7, "Hỏi thông tin chuyến bay", "Hành khách hỏi giờ bay và cổng lên máy bay."),
	makeP1Extra(8, "Mua sắm ở siêu thị", "Hai người bạn bàn về danh sách mua sắm."),
	makeP1Extra(9, "Đăng ký thẻ thư viện", "Sinh viên đăng ký thẻ thư viện mới."),
	makeP1Extra(10, "Hỏi đường đến bệnh viện", "Người đi đường hỏi đường đến bệnh viện gần nhất."),
]

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

// ─── VSTEP Listening Part 1 — data shape example cho backend ──────
// Backend đọc ví dụ này để biết cần trả về gì: audioUrl + transcript + wordTimestamps

export const VSTEP_P1_EXAMPLE: ListeningExercise = {
	id: "vstep-p1-real",
	title: "VSTEP Listening Part 1",
	part: 1,
	description: "Đề thi VSTEP thật — Part 1: 8 đoạn ghi âm ngắn với audio thật.",
	audioUrl: "/listening.mp3",
	transcript: `This is the Vietnamese Standardized Test of English Proficiency, Listening Comprehension Test. You will listen to a number of different recordings, and you will have to answer questions based on what you hear. There will be time for you to read the questions and check your work. All the recordings will be played once only.

Part 1: In this part, you will hear eight short recordings. The recordings will be played once only. There is one question following each recording. For each question, choose the right answer A, B, C, or D.

Now, let's listen to the example. On the recording, you might hear, Hello, this is the travel agency returning your call. You left a message about the holiday you've booked, asking which meals are included in the cost during your stay at Sunny Hotel. Lunch and dinner are free, but if you wish to have breakfast in the hotel, you will need to pay an extra amount of money, depending on what you order. Let me know if I can help you with any other information. Goodbye. You will read: Which meal is not included in the price of the holiday? A. Breakfast B. Lunch C. Dinner D. All. The correct answer is A. Breakfast.

First, you will have some time to look at questions 1 to 8.

Now, we're ready to start. Listen, and answer questions 1 to 8.

Question 1: This is your captain speaking. At this time, we request that all mobile phones, pagers, radios, and remote-controlled toys be turned off for the rest of the flight, as these items might interfere with the navigational and communication equipment on this aircraft. We are landing in Amsterdam in 10 minutes. It is now 4:40 local time.

Question 2: If you do not know the exact course information, you may search by subject, course level, course number, and even section number, and place courses on your preferred sections list. First, you must select the term each time you enter this page. For example, this term's code is 1-5-F-A-C-A-S. Then enter up to five subjects. You may also enter course levels, course numbers, and even section numbers.

Question 3: Thank you for calling Dragon Restaurant. You have reached the automatic call-in service of our restaurant. To find out about our menu, press 1. To reserve a table, press 2. To ask about our other services, press 3. To speak to the staff, press 0. Thank you, and have a good day.

Question 4: Well, the fact that swimming doesn't interest you does not mean it's a boring form of exercise. It just means it's not suitable for you. I myself find jogging or riding a bike very boring. Swimming is great, but it's just not for everybody. It involves a lot of skills like breathing and shaping your body. At first, these skills may take some time to learn. But when you're used to them, like me, there's nothing to compare with slipping through the water. It's like flying.

Question 5: Wash and rinse the rice really well until the water is clear. Place the rice in a saucepan with double the amount of water and a little salt and stir. Bring to a boil. Then turn the heat way down and cover the pan tightly with a lid. Cook on the lowest heat possible for 10 to 15 minutes without uncovering the pan.

Question 6: If the camera charging light is not lit, the battery is still charging as long as it is connected to the wall outlet. If some trouble occurs while using the camera battery charger, immediately shut off the power by disconnecting the plug from the wall outlet.

Question 7: Buses display route numbers, names, and final destinations in lighted signs above the windshield. If you'd like the bus operator to stop for you, just stand up and give a friendly wave as the bus approaches. Be sure to stay on the curb, though. Please catch your bus at any official Capital Metro bus stop while the route is on detour. Alert your bus operator by waving as the vehicle approaches and prior to boarding, confirm route name and number by checking the digital marquee.

Question 8: The address of Buckingham Palace is Buckingham Palace, London SW1A1AA. You can get there by several different types of public transportation. If you go by train, stop at London Victoria. If you go by underground, stop at Victoria, Green Park, and Hyde Park Corner. If you go by bus, take numbers 11, 211, C1, or C10 and stop at Buckingham Palace Road. If you go by coach, stop at Victoria Coach Station. It is a 10-minute walk away from the palace.

Now you will have some time to review questions 1 to 8.

That is the end of part 1.`,
	vietnameseTranscript: "",
	keywords: [
		"VSTEP",
		"listening",
		"part 1",
		"announcement",
		"captain",
		"restaurant",
		"swimming",
		"rice",
		"camera",
		"bus",
		"Buckingham Palace",
	],
	estimatedMinutes: 12,
	items: [
		q(
			"vstep-p1-1",
			"What are passengers asked to do?",
			["Fasten seatbelts", "Turn off electronic devices", "Open window shades", "Return to seats"],
			1,
			"Captain requests all mobile phones, pagers, radios be turned off.",
		),
		q(
			"vstep-p1-2",
			"What must you select first when searching for courses?",
			["Subject", "Course level", "The term", "Section number"],
			2,
			"'First, you must select the term each time you enter this page.'",
		),
		q(
			"vstep-p1-3",
			"What should you press to reserve a table?",
			["1", "2", "3", "0"],
			1,
			"'To reserve a table, press 2.'",
		),
		q(
			"vstep-p1-4",
			"What does the speaker think about swimming?",
			["It's boring", "It's like flying", "It's easy to learn", "It's not exercise"],
			1,
			"'there's nothing to compare with slipping through the water. It's like flying.'",
		),
		q(
			"vstep-p1-5",
			"How long should you cook the rice?",
			["5 to 10 minutes", "10 to 15 minutes", "15 to 20 minutes", "20 to 25 minutes"],
			1,
			"'Cook on the lowest heat possible for 10 to 15 minutes.'",
		),
		q(
			"vstep-p1-6",
			"What should you do if trouble occurs with the charger?",
			["Replace the battery", "Disconnect the plug", "Call customer service", "Wait 10 minutes"],
			1,
			"'immediately shut off the power by disconnecting the plug from the wall outlet.'",
		),
		q(
			"vstep-p1-7",
			"How should you signal a bus to stop?",
			["Press a button", "Wave at the driver", "Stand at the curb", "Shout"],
			1,
			"'just stand up and give a friendly wave as the bus approaches.'",
		),
		q(
			"vstep-p1-8",
			"How can you get to Buckingham Palace by underground?",
			[
				"Stop at London Victoria",
				"Stop at Victoria, Green Park, or Hyde Park Corner",
				"Take bus C1",
				"Stop at Victoria Coach Station",
			],
			1,
			"'If you go by underground, stop at Victoria, Green Park, and Hyde Park Corner.'",
		),
	],
}

// ─── Export ────────────────────────────────────────────────────────

export const MOCK_LISTENING: readonly ListeningExercise[] = [
	P1_DIRECTIONS,
	P1_CAFE,
	...P1_EXTRAS,
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
