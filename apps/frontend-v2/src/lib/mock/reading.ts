// Mock reading data — 6 đề chia 3 Part của VSTEP Reading.
// Khi có API: thay queryFn, giữ nguyên shape ListeningItem-compatible cho Mcq components.

export type ReadingPart = 1 | 2 | 3

export interface ReadingItem {
	id: string
	question: string
	options: [string, string, string, string]
	correctIndex: 0 | 1 | 2 | 3
	explanation: string
}

export interface ReadingExercise {
	id: string
	title: string
	part: ReadingPart
	description: string
	passage: string // markdown paragraphs separated by \n\n
	keywords: readonly string[]
	vietnameseTranslation: string
	estimatedMinutes: number
	items: ReadingItem[]
}

export const READING_PART_LABELS: Record<ReadingPart, string> = {
	1: "Part 1 · Đọc hiểu ngắn",
	2: "Part 2 · Đọc hiểu trung bình",
	3: "Part 3 · Đọc hiểu dài",
}

function q(
	id: string,
	question: string,
	options: [string, string, string, string],
	correctIndex: 0 | 1 | 2 | 3,
	explanation: string,
): ReadingItem {
	return { id, question, options, correctIndex, explanation }
}

// ─── Part 1 — Short passages ───────────────────────────────────────

const P1_MENU: ReadingExercise = {
	id: "r1-menu",
	title: "Thông báo nhà hàng",
	part: 1,
	description: "Thông báo ngắn về giờ mở cửa và menu mới của nhà hàng.",
	passage: `Welcome to The Green Leaf Restaurant!

We are pleased to announce that starting next Monday, we will open earlier at 7 a.m. to serve breakfast. Our new breakfast menu includes fresh pastries, healthy smoothie bowls, and traditional Vietnamese dishes like pho and banh mi.

For dinner, we now offer a special vegetarian set menu every Wednesday from 6 p.m. to 9 p.m. Reservations are recommended for large groups. Please call us at 024-3456-7890 or book online at greenleaf.vn.

We look forward to welcoming you!`,
	vietnameseTranslation:
		"Chào mừng đến với Nhà hàng Green Leaf! Chúng tôi vui mừng thông báo rằng bắt đầu từ thứ Hai tới, chúng tôi sẽ mở cửa sớm hơn lúc 7 giờ sáng để phục vụ bữa sáng. Menu sáng mới bao gồm bánh ngọt tươi, bowl sinh tố và các món Việt như phở và bánh mì. Bữa tối: thực đơn chay đặc biệt mỗi thứ Tư 6h–9h tối.",
	keywords: ["breakfast", "7 a.m.", "vegetarian set menu", "Wednesday", "reservations"],
	estimatedMinutes: 3,
	items: [
		q(
			"r1m-1",
			"What time does the restaurant start serving breakfast next Monday?",
			["6 a.m.", "7 a.m.", "8 a.m.", "9 a.m."],
			1,
			"'we will open earlier at 7 a.m. to serve breakfast'.",
		),
		q(
			"r1m-2",
			"On which day is the vegetarian set menu offered?",
			["Monday", "Tuesday", "Wednesday", "Friday"],
			2,
			"'special vegetarian set menu every Wednesday'.",
		),
		q(
			"r1m-3",
			"What should customers do for large groups?",
			[
				"Come before 6 p.m.",
				"Bring their own drinks",
				"Make reservations by phone or online",
				"Pay in advance",
			],
			2,
			"'Reservations are recommended for large groups'.",
		),
		q(
			"r1m-4",
			"Which item is NOT mentioned in the new breakfast menu?",
			["Pastries", "Smoothie bowls", "Pho", "Coffee"],
			3,
			"Menu bao gồm pastries, smoothie bowls, pho, banh mi — không nhắc coffee.",
		),
	],
}

const P1_LIBRARY: ReadingExercise = {
	id: "r1-library",
	title: "Thông báo thư viện trường",
	part: 1,
	description: "Thông báo về giờ mở cửa và quy định mượn sách trong kỳ thi.",
	passage: `ATTENTION STUDENTS

During the final exam period (June 10–24), the university library will extend its opening hours. The library will be open from 7 a.m. to midnight, Monday through Saturday, and from 9 a.m. to 10 p.m. on Sundays.

Students may borrow up to 8 books at a time for 2 weeks each. Late returns will be charged 2,000 VND per book per day. Reference books and journals cannot be taken out of the library.

For technical help or printing services, please visit the information desk on the 2nd floor between 8 a.m. and 8 p.m.`,
	vietnameseTranslation:
		"Trong kỳ thi cuối kỳ (10–24/6), thư viện trường mở rộng giờ mở: 7h–nửa đêm từ thứ Hai đến thứ Bảy, 9h–22h Chủ Nhật. Mượn tối đa 8 cuốn trong 2 tuần. Phí trễ 2,000đ/cuốn/ngày. Sách tham khảo và tạp chí không được mượn về.",
	keywords: ["final exam period", "midnight", "8 books", "2 weeks", "2,000 VND", "2nd floor"],
	estimatedMinutes: 3,
	items: [
		q(
			"r1l-1",
			"How many books can a student borrow at one time?",
			["5 books", "6 books", "8 books", "10 books"],
			2,
			"'up to 8 books at a time'.",
		),
		q(
			"r1l-2",
			"What is the late return fee?",
			[
				"1,000 VND per book per day",
				"2,000 VND per book per day",
				"5,000 VND per book",
				"Free for the first day",
			],
			1,
			"'Late returns will be charged 2,000 VND per book per day'.",
		),
		q(
			"r1l-3",
			"Which items CANNOT be borrowed?",
			["Novels", "Textbooks", "Reference books and journals", "Magazines"],
			2,
			"'Reference books and journals cannot be taken out'.",
		),
		q(
			"r1l-4",
			"Where is the information desk located?",
			["1st floor", "2nd floor", "3rd floor", "Basement"],
			1,
			"'information desk on the 2nd floor'.",
		),
	],
}

// ─── Part 2 — Medium passages ──────────────────────────────────────

const P2_REMOTE_WORK: ReadingExercise = {
	id: "r2-remote-work",
	title: "Xu hướng làm việc từ xa",
	part: 2,
	description: "Bài báo ngắn về tác động của làm việc từ xa đến người lao động trẻ.",
	passage: `Remote work has transformed the way young professionals approach their careers. According to a recent survey by the International Labor Organization, nearly 42% of workers aged 22 to 35 in Southeast Asia now work from home at least two days per week, compared to only 9% before the pandemic.

The main advantages reported by employees include saving time on commuting, better work-life balance, and the freedom to live in more affordable areas. Many young workers say they feel more productive when they can design their own schedule.

However, remote work also brings challenges. Feelings of isolation, difficulty separating work from personal life, and slower career growth are common concerns. Some companies have begun offering hybrid models, allowing employees to work from home three days a week while coming to the office for team meetings.

Experts believe this flexible model will become the new standard. Businesses that adapt quickly may attract better talent, while those that insist on full office attendance risk losing employees to more flexible competitors.`,
	vietnameseTranslation:
		"Làm việc từ xa đã thay đổi cách người trẻ tiếp cận sự nghiệp. Khảo sát ILO: ~42% lao động 22-35 tuổi ở Đông Nam Á giờ làm từ xa ít nhất 2 ngày/tuần, so với 9% trước đại dịch. Ưu điểm: tiết kiệm thời gian đi lại, cân bằng công việc-cuộc sống, tự do chọn nơi sống. Nhược: cô đơn, khó tách bạch, thăng tiến chậm. Giải pháp: mô hình hybrid.",
	keywords: [
		"42% of workers",
		"22 to 35",
		"commuting",
		"work-life balance",
		"isolation",
		"hybrid models",
		"three days a week",
	],
	estimatedMinutes: 5,
	items: [
		q(
			"r2r-1",
			"What percentage of young workers in Southeast Asia work from home at least two days a week?",
			["9%", "22%", "35%", "42%"],
			3,
			"'nearly 42% of workers aged 22 to 35'.",
		),
		q(
			"r2r-2",
			"Which is NOT mentioned as an advantage of remote work?",
			[
				"Saving commute time",
				"Higher salary",
				"Better work-life balance",
				"Living in affordable areas",
			],
			1,
			"Ưu điểm nhắc: commute, balance, affordable areas, productivity — không nhắc salary.",
		),
		q(
			"r2r-3",
			"What is a common challenge of remote work?",
			["Higher rent", "Better office equipment", "Feelings of isolation", "Longer meetings"],
			2,
			"'Feelings of isolation, difficulty separating work from personal life'.",
		),
		q(
			"r2r-4",
			"In hybrid models mentioned in the article, how many days per week do employees work from home?",
			["One day", "Two days", "Three days", "Four days"],
			2,
			"'allowing employees to work from home three days a week'.",
		),
		q(
			"r2r-5",
			"What do experts predict about the flexible work model?",
			[
				"It will disappear within 5 years",
				"It will become the new standard",
				"Only small companies will use it",
				"It's too expensive for most companies",
			],
			1,
			"'Experts believe this flexible model will become the new standard'.",
		),
	],
}

const P2_URBAN_GARDEN: ReadingExercise = {
	id: "r2-urban-garden",
	title: "Vườn rau đô thị",
	part: 2,
	description: "Bài viết về phong trào trồng rau tại các khu chung cư thành phố.",
	passage: `Urban gardening is gaining popularity in crowded cities across Asia. In Ho Chi Minh City, residents of high-rise apartments are turning their small balconies into productive mini-gardens, growing herbs, vegetables, and even small fruit trees.

Mrs. Linh, who lives on the 18th floor of a building in District 7, started gardening during the 2020 lockdown. "At first, I only wanted to have some fresh basil and mint for cooking," she explains. "Now I harvest tomatoes, chili peppers, and lemongrass every week. It saves money and tastes so much better than store-bought produce."

City officials have begun supporting this trend by organizing free workshops on container gardening and composting. Some neighborhoods now share community compost bins, turning food waste into fertilizer for their plants.

Environmental experts note several benefits: reduced food miles, lower stress levels, and better air quality in dense urban areas. However, space limitations and lack of sunlight on lower floors remain obstacles. Still, the movement continues to grow, proving that even a tiny balcony can make a difference.`,
	vietnameseTranslation:
		"Vườn rau đô thị đang phổ biến ở các thành phố lớn Á. TP.HCM: dân chung cư biến ban công thành vườn nhỏ. Bà Linh, tầng 18 Q7, bắt đầu từ mùa dịch 2020, giờ thu hoạch cà chua, ớt, sả hàng tuần. Chính quyền mở workshop miễn phí. Lợi ích: giảm food miles, giảm stress, không khí tốt hơn.",
	keywords: [
		"Urban gardening",
		"Ho Chi Minh City",
		"high-rise apartments",
		"balconies",
		"herbs",
		"free workshops",
		"community compost",
		"food miles",
	],
	estimatedMinutes: 5,
	items: [
		q(
			"r2u-1",
			"Where does Mrs. Linh live?",
			[
				"A house with a garden",
				"The 18th floor of an apartment building",
				"A countryside farm",
				"A traditional Vietnamese home",
			],
			1,
			"'18th floor of a building in District 7'.",
		),
		q(
			"r2u-2",
			"When did Mrs. Linh start gardening?",
			["2018", "2019", "2020 lockdown", "2022"],
			2,
			"'Mrs. Linh... started gardening during the 2020 lockdown'.",
		),
		q(
			"r2u-3",
			"What do some neighborhoods share for gardening?",
			["Tools", "Seeds", "Community compost bins", "Water tanks"],
			2,
			"'neighborhoods now share community compost bins'.",
		),
		q(
			"r2u-4",
			"Which benefit of urban gardening is NOT mentioned?",
			[
				"Reduced food miles",
				"Lower stress levels",
				"Better air quality",
				"Increased property value",
			],
			3,
			"Lợi ích nhắc: food miles, stress, air quality — không nhắc property value.",
		),
		q(
			"r2u-5",
			"What challenges remain for urban gardening?",
			[
				"High water bills",
				"Lack of knowledge",
				"Space and sunlight limitations",
				"Government regulations",
			],
			2,
			"'space limitations and lack of sunlight on lower floors remain obstacles'.",
		),
	],
}

// ─── Part 3 — Long passages ────────────────────────────────────────

const P3_AI_EDUCATION: ReadingExercise = {
	id: "r3-ai-education",
	title: "Trí tuệ nhân tạo và giáo dục",
	part: 3,
	description: "Bài luận phân tích tác động của AI đến giáo dục trong thập kỷ tới.",
	passage: `Artificial intelligence (AI) is reshaping education in ways that were unimaginable just a decade ago. From personalized learning platforms that adapt to each student's pace, to AI tutors that are available 24 hours a day, technology is changing both how students learn and how teachers teach.

One of the most significant applications is adaptive learning software. These programs analyze a student's responses in real time and adjust the difficulty of the next question accordingly. A struggling student receives simpler explanations and additional practice, while an advanced learner is challenged with more complex material. Studies from Stanford University suggest that students using adaptive platforms can achieve the same learning outcomes in 40% less time than those using traditional methods.

AI is also transforming assessment. Automated grading systems can now evaluate not only multiple-choice tests but also short essays, providing instant feedback on grammar, structure, and even the strength of arguments. This frees teachers from hours of paperwork, allowing them to focus on meaningful interactions with students.

However, critics raise important concerns. The first is privacy. Learning platforms collect vast amounts of data about children, including their mistakes, attention patterns, and emotional responses. Without strong regulations, this information could be misused or sold to third parties. The second concern is equity. If only wealthy schools can afford advanced AI tools, the gap between rich and poor students may widen instead of shrinking.

Perhaps the most debated issue is the role of human teachers. Some futurists predict that AI will eventually replace many teaching positions. Others argue that AI should be seen as a tool that supports teachers, not a substitute for them. Teaching involves emotional connection, moral guidance, and inspiration — things that no machine, however advanced, can fully provide.

As we move forward, the challenge for educators, policymakers, and parents is to harness AI's benefits while protecting students' rights and ensuring equal access. The classrooms of tomorrow will not be defined by whether they use AI, but by how wisely they use it.`,
	vietnameseTranslation:
		"AI đang thay đổi giáo dục: nền tảng học thích ứng (adaptive learning) điều chỉnh độ khó theo học viên, chấm điểm tự động cả essay. Nghiên cứu Stanford: học viên dùng adaptive tiết kiệm 40% thời gian. Lo ngại: quyền riêng tư, bất bình đẳng giữa trường giàu/nghèo, vai trò giáo viên. Tranh luận: AI thay thế hay hỗ trợ giáo viên? Kết luận: câu hỏi không phải có dùng AI không, mà là dùng khôn ngoan thế nào.",
	keywords: [
		"personalized learning",
		"24 hours a day",
		"adaptive learning software",
		"40% less time",
		"automated grading",
		"privacy concerns",
		"equity",
		"human teachers",
	],
	estimatedMinutes: 7,
	items: [
		q(
			"r3a-1",
			"According to Stanford studies, how much less time do students using adaptive platforms need?",
			["20% less", "30% less", "40% less", "50% less"],
			2,
			"'can achieve the same learning outcomes in 40% less time'.",
		),
		q(
			"r3a-2",
			"What can automated grading systems now evaluate besides multiple-choice tests?",
			[
				"Only essays",
				"Short essays including grammar and structure",
				"Only multiple choice",
				"Only math problems",
			],
			1,
			"'automated grading systems can now evaluate not only multiple-choice tests but also short essays, providing instant feedback on grammar, structure, and even the strength of arguments'.",
		),
		q(
			"r3a-3",
			"Which is the FIRST concern raised by critics?",
			["Cost", "Privacy", "Teacher unemployment", "Student laziness"],
			1,
			"'The first is privacy. Learning platforms collect vast amounts of data'.",
		),
		q(
			"r3a-4",
			"What is the equity concern about AI in education?",
			[
				"All students will use the same curriculum",
				"AI might increase the gap between wealthy and poor schools",
				"Teachers will be paid unequally",
				"Urban schools are ignored",
			],
			1,
			"'If only wealthy schools can afford advanced AI tools, the gap between rich and poor students may widen'.",
		),
		q(
			"r3a-5",
			"What do some experts say AI cannot replace?",
			[
				"Homework grading",
				"Data analysis",
				"Emotional connection and moral guidance",
				"Creating tests",
			],
			2,
			"'Teaching involves emotional connection, moral guidance, and inspiration — things that no machine can fully provide'.",
		),
		q(
			"r3a-6",
			"What is the author's conclusion about AI in education?",
			[
				"AI will make teachers unnecessary",
				"The question is how wisely AI is used, not whether",
				"Schools should avoid AI",
				"AI should only be used in universities",
			],
			1,
			"'will not be defined by whether they use AI, but by how wisely they use it'.",
		),
	],
}

const P3_MARINE_CONSERVATION: ReadingExercise = {
	id: "r3-marine",
	title: "Bảo tồn đại dương",
	part: 3,
	description: "Bài báo về nỗ lực bảo vệ rạn san hô và sinh vật biển ở Đông Nam Á.",
	passage: `The oceans of Southeast Asia contain some of the richest marine biodiversity on the planet. The waters between Vietnam, the Philippines, and Indonesia, known as the Coral Triangle, are home to more than 600 species of coral and over 3,000 species of fish. This underwater paradise, however, is facing unprecedented threats.

Climate change is the biggest enemy of coral reefs. Rising sea temperatures cause coral bleaching, a phenomenon in which corals expel the algae living in their tissues and turn completely white. If the water stays warm for too long, the coral eventually dies. Scientists estimate that more than half of the Great Barrier Reef has already been lost to bleaching events since 2016, and reefs in Vietnam are showing similar damage.

Overfishing presents another serious problem. When commercial fleets catch too many fish, the entire food chain is disrupted. Predators run out of prey, smaller fish populations explode, and coral reefs — which depend on balanced fish populations — begin to deteriorate. Destructive methods such as dynamite fishing and cyanide fishing cause immediate and long-term damage to reef ecosystems.

Fortunately, conservation efforts are growing. Vietnam established its first marine protected area in 1994, and today there are over 15 such zones where fishing is strictly controlled. Local communities are also playing a vital role. In Hon Mun, near Nha Trang, fishermen who once used explosives now work as tour guides, teaching visitors about the importance of reef protection. Young volunteers participate in beach cleanups and help monitor coral health.

International cooperation is essential. Organizations like UNESCO and WWF work with Southeast Asian governments to create policies that balance economic development with environmental protection. Scientists from many countries share data on water temperature, coral health, and fish populations.

The road ahead is difficult but not hopeless. Every small action — choosing sustainable seafood, reducing plastic use, supporting marine parks — contributes to the survival of these fragile ecosystems. As one marine biologist put it, "The ocean gave us life; now it is our turn to give something back."`,
	vietnameseTranslation:
		"Biển Đông Nam Á có đa dạng sinh học cao nhất hành tinh. Tam giác San hô (VN-Phi-Indo) có 600+ loài san hô, 3000+ loài cá. Đe dọa: biến đổi khí hậu làm san hô tẩy trắng (Great Barrier Reef mất hơn nửa từ 2016), đánh bắt quá mức, dynamite/cyanide fishing. Bảo tồn: VN có 15+ khu bảo tồn biển từ 1994, Hòn Mun — ngư dân cũ giờ làm hướng dẫn viên. Hợp tác quốc tế: UNESCO, WWF.",
	keywords: [
		"Coral Triangle",
		"600 species of coral",
		"3,000 species of fish",
		"bleaching",
		"Great Barrier Reef",
		"overfishing",
		"1994 marine protected area",
		"Hon Mun",
		"UNESCO",
	],
	estimatedMinutes: 7,
	items: [
		q(
			"r3m-1",
			"What is the Coral Triangle famous for?",
			["Oil reserves", "Rich marine biodiversity", "Underwater volcanoes", "Ancient shipwrecks"],
			1,
			"'The waters... known as the Coral Triangle, are home to more than 600 species of coral'.",
		),
		q(
			"r3m-2",
			"What causes coral bleaching?",
			["Heavy rainfall", "Rising sea temperatures", "Dark algae", "Boat pollution"],
			1,
			"'Rising sea temperatures cause coral bleaching'.",
		),
		q(
			"r3m-3",
			"Which is NOT mentioned as a destructive fishing method?",
			["Dynamite fishing", "Cyanide fishing", "Trawling", "Overfishing"],
			2,
			"Bài nhắc dynamite, cyanide, overfishing — không nhắc trawling.",
		),
		q(
			"r3m-4",
			"When did Vietnam establish its first marine protected area?",
			["1984", "1994", "2004", "2014"],
			1,
			"'Vietnam established its first marine protected area in 1994'.",
		),
		q(
			"r3m-5",
			"What role do former explosive-fishermen in Hon Mun play now?",
			["Commercial divers", "Tour guides", "Fish farmers", "Boat builders"],
			1,
			"'fishermen who once used explosives now work as tour guides'.",
		),
		q(
			"r3m-6",
			"What is the main message of the final paragraph?",
			[
				"Ocean conservation is impossible",
				"Governments must do everything alone",
				"Every small action contributes to ocean survival",
				"Scientists should lead the effort",
			],
			2,
			"'Every small action — choosing sustainable seafood, reducing plastic use, supporting marine parks — contributes'.",
		),
	],
}

// ─── Export ────────────────────────────────────────────────────────

export const MOCK_READING: readonly ReadingExercise[] = [
	P1_MENU,
	P1_LIBRARY,
	P2_REMOTE_WORK,
	P2_URBAN_GARDEN,
	P3_AI_EDUCATION,
	P3_MARINE_CONSERVATION,
]

export function findReadingExercise(id: string): ReadingExercise | undefined {
	return MOCK_READING.find((e) => e.id === id)
}

export async function mockFetchReading(): Promise<readonly ReadingExercise[]> {
	await new Promise((r) => setTimeout(r, 120))
	return MOCK_READING
}

export async function mockFetchReadingExercise(id: string): Promise<ReadingExercise> {
	await new Promise((r) => setTimeout(r, 120))
	const exercise = findReadingExercise(id)
	if (!exercise) throw new Error(`Không tìm thấy đề đọc "${id}"`)
	return exercise
}
