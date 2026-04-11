// Mock speaking data — 6 đề chia 3 Part của VSTEP Speaking.

export type SpeakingPart = 1 | 2 | 3

export interface SpeakingExercise {
	id: string
	title: string
	part: SpeakingPart
	description: string
	prompt: string
	prepSeconds: number
	speakSeconds: number
	talkingPoints: readonly string[]
	sampleAnswer: string
	estimatedMinutes: number
}

export const SPEAKING_PART_LABELS: Record<SpeakingPart, string> = {
	1: "Part 1 · Giao tiếp xã hội",
	2: "Part 2 · Tình huống & giải pháp",
	3: "Part 3 · Phát triển chủ đề",
}

// ─── Part 1 — Social interaction ───────────────────────────────────

const P1_HOBBIES: SpeakingExercise = {
	id: "sp1-hobbies",
	title: "Sở thích cá nhân",
	part: 1,
	description: "Trả lời câu hỏi về sở thích và cách bạn dành thời gian rảnh.",
	prompt:
		"Talk about your favourite hobby. What is it? When did you start doing it? Why do you enjoy it? How often do you spend time on it?",
	prepSeconds: 20,
	speakSeconds: 60,
	talkingPoints: [
		"What is your hobby?",
		"When did you start?",
		"Why do you enjoy it?",
		"How often do you do it?",
	],
	sampleAnswer:
		"My favourite hobby is reading novels. I started reading seriously when I was about fourteen years old, when my teacher introduced me to Harry Potter. I enjoy reading because it allows me to escape into different worlds and learn about different cultures. I try to read for at least thirty minutes every night before I go to bed, and on weekends I sometimes spend a whole afternoon at my local café with a good book.",
	estimatedMinutes: 2,
}

const P1_HOMETOWN: SpeakingExercise = {
	id: "sp1-hometown",
	title: "Quê hương của bạn",
	part: 1,
	description: "Mô tả quê hương hoặc thành phố bạn đang sống.",
	prompt:
		"Describe your hometown or the city where you live. Where is it located? What is it famous for? What do you like most about it?",
	prepSeconds: 20,
	speakSeconds: 60,
	talkingPoints: [
		"Location",
		"What it's famous for",
		"Things you like most",
		"Local food or attractions",
	],
	sampleAnswer:
		"I live in Da Nang, a beautiful coastal city in central Vietnam. Da Nang is located about 800 kilometres south of Hanoi and is known for its long sandy beaches, the Dragon Bridge, and the Marble Mountains. What I like most about my city is the balance between nature and modern development. We have clean beaches, good restaurants, and affordable living costs. My favourite thing is trying local food like mi quang noodles and banh xeo at the night markets by the river.",
	estimatedMinutes: 2,
}

// ─── Part 2 — Problem solving ──────────────────────────────────────

const P2_TRAFFIC: SpeakingExercise = {
	id: "sp2-traffic",
	title: "Giải pháp giao thông đô thị",
	part: 2,
	description: "Đưa ra giải pháp cho vấn đề giao thông tại các thành phố lớn.",
	prompt:
		"Traffic jams are a serious problem in many big cities in Vietnam. What solutions can you suggest to reduce traffic congestion? You have 45 seconds to prepare and 90 seconds to speak. Give at least two specific solutions and explain why they would work.",
	prepSeconds: 45,
	speakSeconds: 90,
	talkingPoints: [
		"Problem: traffic in Hanoi / HCMC",
		"Solution 1: public transport (metro, bus)",
		"Solution 2: limit private vehicles",
		"Solution 3: flexible working hours",
		"Why these work: examples from other countries",
	],
	sampleAnswer:
		"Traffic congestion is indeed a major problem in cities like Hanoi and Ho Chi Minh City, where millions of motorbikes and cars fill the streets every day. I would like to suggest two main solutions.\n\nFirstly, I believe the government should invest more in public transport. Building more metro lines, like the one that recently opened in Hanoi, would give people a fast and affordable alternative to driving. If buses and trains are clean, punctual and not too expensive, many people will choose to leave their motorbikes at home. Singapore is a great example of how efficient public transport can make a city move smoothly.\n\nSecondly, companies and schools should allow flexible working and studying hours. Not everyone needs to arrive at 8 a.m. If the rush hour is spread over three hours instead of one, the roads will be much less crowded.\n\nI believe a combination of better transport and smarter scheduling can really help reduce traffic jams in the long run.",
	estimatedMinutes: 3,
}

const P2_HEALTHY_HABITS: SpeakingExercise = {
	id: "sp2-healthy-habits",
	title: "Khuyến khích thói quen lành mạnh",
	part: 2,
	description: "Đề xuất cách giúp người trẻ sống lành mạnh hơn.",
	prompt:
		"Many young people today do not exercise or eat healthy food. What can be done to encourage them to live a healthier lifestyle? You have 45 seconds to prepare and 90 seconds to speak.",
	prepSeconds: 45,
	speakSeconds: 90,
	talkingPoints: [
		"Current problem: inactive young people",
		"Solution 1: school programs",
		"Solution 2: social media campaigns",
		"Solution 3: community sports facilities",
	],
	sampleAnswer:
		"It's true that many young people today spend too much time in front of screens and eat too much fast food. I think there are several ways we can encourage them to adopt a healthier lifestyle.\n\nFirst, schools should make physical education more fun and engaging. Instead of boring exercises, students could try different sports or outdoor activities every week. Schools could also teach simple cooking lessons so students know how to prepare healthy meals at home.\n\nSecond, we should take advantage of social media to promote healthy habits. Influencers and celebrities have huge followings among young people. If they share workout videos, healthy recipes and fitness challenges, their fans are likely to copy them. For example, many Vietnamese youtubers have started fitness channels that attract millions of viewers.\n\nFinally, local governments should build more free sports facilities like parks, running tracks and basketball courts. When exercise is accessible and free, people are much more likely to do it regularly.\n\nWith these combined efforts, I'm sure more young people would become more active and healthier.",
	estimatedMinutes: 3,
}

// ─── Part 3 — Topic development ────────────────────────────────────

const P3_REMOTE_WORK: SpeakingExercise = {
	id: "sp3-remote-work",
	title: "Làm việc từ xa: ưu và nhược",
	part: 3,
	description: "Phát triển ý kiến về lợi ích và hạn chế của làm việc từ xa.",
	prompt:
		"Working from home has become popular in recent years. Discuss the advantages and disadvantages of remote working. In your opinion, is it a good trend? You have 60 seconds to prepare and 120 seconds to speak.",
	prepSeconds: 60,
	speakSeconds: 120,
	talkingPoints: [
		"Define: working from home",
		"Advantages: flexibility, commute, cost",
		"Disadvantages: isolation, work-life blur",
		"Personal opinion with reasons",
		"Conclusion: hybrid model",
	],
	sampleAnswer:
		"Working from home, also known as remote work, has become much more common since the pandemic, and it has definitely changed how many people do their jobs.\n\nOn the positive side, remote work offers a lot of flexibility. Employees save time and money by not commuting, and they can design their day around their own needs. For example, a parent can pick up their child from school in the afternoon and finish work later at night. Companies also benefit, because they can hire talented people from anywhere in the country or even the world, and they save on office rent.\n\nHowever, there are also some drawbacks. Many remote workers feel lonely and cut off from their colleagues, which can hurt their motivation and mental health. It's also much harder to separate work from personal life when both happen in the same room. Some people end up working longer hours than before.\n\nIn my opinion, working from home is generally a positive trend, but it works best when combined with office time. A hybrid model, where employees come to the office two or three days a week, gives them flexibility without losing human connection. I think this is the best way forward for most jobs in the modern world.",
	estimatedMinutes: 4,
}

const P3_EDUCATION_REFORM: SpeakingExercise = {
	id: "sp3-education-reform",
	title: "Cải cách giáo dục",
	part: 3,
	description: "Phân tích nhu cầu cải cách giáo dục trong thế giới hiện đại.",
	prompt:
		"Some people think that the traditional education system needs major reform to prepare students for the modern world. Do you agree? What changes would you suggest? You have 60 seconds to prepare and 120 seconds to speak.",
	prepSeconds: 60,
	speakSeconds: 120,
	talkingPoints: [
		"Position: agree or disagree",
		"Problems with traditional education",
		"Change 1: skills vs memorization",
		"Change 2: technology integration",
		"Change 3: critical thinking",
		"Conclusion",
	],
	sampleAnswer:
		"I strongly agree that the traditional education system needs significant reform. The world today is very different from the world our current curriculum was designed for, and young people need new skills to succeed.\n\nThe main problem with traditional education is that it still focuses too much on memorization. Students spend years learning facts for exams but are rarely taught how to think critically, solve real problems, or work in teams. These are the exact skills that employers are looking for today.\n\nI would suggest three main changes. First, schools should focus more on practical skills instead of just academic knowledge. Subjects like personal finance, digital literacy, and communication should be taught alongside traditional maths and literature. Second, technology should be fully integrated into every classroom. Instead of banning phones, teachers should show students how to use AI tools, coding platforms, and online resources responsibly. Third, critical thinking must become a central goal. Students should learn to question information, evaluate sources, and form their own opinions with evidence.\n\nFinally, exams should be redesigned to test understanding and creativity, not just memory. Project-based assessments would be much more meaningful than multiple-choice tests.\n\nIn conclusion, while reform is difficult, it's absolutely necessary. If we don't update our schools, we will not prepare our children for the jobs and challenges of the future.",
	estimatedMinutes: 4,
}

// ─── Export ────────────────────────────────────────────────────────

export const MOCK_SPEAKING: readonly SpeakingExercise[] = [
	P1_HOBBIES,
	P1_HOMETOWN,
	P2_TRAFFIC,
	P2_HEALTHY_HABITS,
	P3_REMOTE_WORK,
	P3_EDUCATION_REFORM,
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
