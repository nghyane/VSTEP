// ─── Types ───────────────────────────────────────────────────────────────────

export type ExamSkillKey = "listening" | "reading" | "writing" | "speaking"

export interface MCQItem {
	stem: string
	options: string[]
}

export interface MockListeningSection {
	id: string
	part: number
	partTitle: string
	audioUrl: string
	items: MCQItem[]
}

export interface MockReadingPassage {
	id: string
	part: number
	title: string
	passage: string
	items: MCQItem[]
}

export interface MockWritingTask {
	id: string
	part: number
	taskType: "letter" | "essay"
	prompt: string
	minWords: number
	instructions: string[]
}

export interface MockSpeakingPart {
	id: string
	part: number
	type: "social" | "solution" | "development"
	speakingSeconds: number
	// Part 1 – Social Interaction
	topics?: { name: string; questions: string[] }[]
	// Part 2 – Solution Discussion
	situation?: string
	options?: string[]
	// Part 3 – Topic Development
	centralIdea?: string
	suggestions?: string[]
	followUpQuestion?: string
}

export interface MockExamSession {
	id: number
	title: string
	durationMinutes: number
	listening: MockListeningSection[]
	reading: MockReadingPassage[]
	writing: MockWritingTask[]
	speaking: MockSpeakingPart[]
}

// ─── Answer types ─────────────────────────────────────────────────────────────

export type MCQAnswerMap = Map<string, Record<string, string>> // sectionId → { itemIndex → letter }
export type WritingAnswerMap = Map<string, string>             // taskId → text
export type SpeakingDoneSet = Set<string>                      // set of recorded partIds

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AUDIO_URL =
	"https://luyenthivstep.vn/assets/nhch/listening/bac3/lp1-1642953803_eb7ab6f2e8dead6de076.mp3"

function mcq(n: number, topic: string): MCQItem[] {
	const STEMS: string[] = [
		`What is the main purpose of the ${topic}?`,
		`According to the ${topic}, which statement is correct?`,
		`What does the speaker suggest about the ${topic}?`,
		`Which of the following best describes the ${topic}?`,
		`What can be inferred from the ${topic}?`,
		`How does the speaker feel about the ${topic}?`,
		`What will happen next according to the ${topic}?`,
		`Which option is NOT mentioned in the ${topic}?`,
		`What problem is discussed in the ${topic}?`,
		`What solution is proposed in the ${topic}?`,
	]
	const OPTIONS = [
		["To inform people about a schedule change", "To advertise a new service", "To announce a promotion", "To give safety instructions"],
		["The event starts at 9 AM", "Registration is required", "Attendance is free of charge", "The venue has changed"],
		["People should arrive early", "The deadline has been extended", "More details will follow", "Participants must register online"],
		["It provides historical context", "It focuses on practical advice", "It presents two opposing views", "It describes a personal experience"],
		["The speaker is satisfied with the result", "The project will be delayed", "A new policy will take effect", "Costs are lower than expected"],
		["Enthusiastic", "Concerned", "Indifferent", "Optimistic"],
		["Another meeting will be held", "The decision will be announced", "A survey will be conducted", "The project will resume"],
		["The opening time", "The location", "The admission fee", "The parking facilities"],
		["Lack of funding", "Poor communication", "Technical difficulties", "Staff shortage"],
		["Hire more staff", "Increase the budget", "Extend the deadline", "Change the approach"],
	]
	return Array.from({ length: n }, (_, i) => ({
		stem: STEMS[i % STEMS.length] ?? `Question ${i + 1}.`,
		options: OPTIONS[i % OPTIONS.length] ?? ["Option A", "Option B", "Option C", "Option D"],
	}))
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_LISTENING: MockListeningSection[] = [
	{
		id: "L1",
		part: 1,
		partTitle: "Part 1 — Thông báo ngắn",
		audioUrl: AUDIO_URL,
		items: mcq(8, "announcement"),
	},
	{
		id: "L2",
		part: 2,
		partTitle: "Part 2 — Hội thoại",
		audioUrl: AUDIO_URL,
		items: mcq(12, "conversation"),
	},
	{
		id: "L3",
		part: 3,
		partTitle: "Part 3 — Bài giảng",
		audioUrl: AUDIO_URL,
		items: mcq(15, "lecture"),
	},
]

const MOCK_READING: MockReadingPassage[] = [
	{
		id: "R1",
		part: 1,
		title: "The Impact of Technology on Modern Education",
		passage: `Technology has fundamentally transformed the way students learn and teachers instruct. The integration of digital tools into classrooms has opened up new possibilities for personalised learning, allowing students to progress at their own pace. Online platforms and educational applications provide instant feedback, enabling learners to identify their weaknesses and address them proactively.

However, the rapid adoption of technology also presents challenges. Not all students have equal access to devices and reliable internet connections, creating a digital divide that can exacerbate existing inequalities. Teachers must also adapt their pedagogical approaches to leverage technology effectively, which requires ongoing professional development.

Despite these challenges, research consistently shows that well-implemented technology can improve student engagement and academic outcomes. Interactive simulations, virtual field trips, and collaborative online projects make learning more dynamic and relevant to students' lives. As technology continues to evolve, educators and policymakers must work together to ensure that all students can benefit from its potential.`,
		items: mcq(10, "passage"),
	},
	{
		id: "R2",
		part: 2,
		title: "Urban Green Spaces and Mental Health",
		passage: `The relationship between urban green spaces and mental health has attracted increasing attention from researchers and city planners alike. Studies conducted across multiple countries have found that regular exposure to parks, gardens, and tree-lined streets is associated with reduced levels of stress, anxiety, and depression among urban residents.

One compelling explanation for this phenomenon is the Attention Restoration Theory, which proposes that natural environments provide a form of effortless attention that allows the directed attention used in daily tasks to recover. Unlike the built environment, which demands constant cognitive engagement, nature offers a restorative experience that replenishes mental resources.

City planners are beginning to incorporate these findings into urban design. Green corridors connecting parks, rooftop gardens, and pocket parks in dense neighbourhoods are being developed with mental health outcomes in mind. While access to large urban parks remains unevenly distributed, smaller green interventions may offer meaningful benefits to residents in underserved areas.`,
		items: mcq(10, "passage"),
	},
	{
		id: "R3",
		part: 3,
		title: "The Future of Remote Work",
		passage: `The COVID-19 pandemic forced millions of workers worldwide to shift to remote work almost overnight, accelerating a trend that had been gradually gaining momentum. For many organisations, this experiment proved surprisingly successful: productivity remained stable or even improved in numerous sectors, and employees reported greater satisfaction with their work-life balance.

Nevertheless, remote work is not without its drawbacks. Isolation, difficulties in collaboration, and the blurring of boundaries between professional and personal life have emerged as significant concerns. Junior employees, in particular, may miss out on the informal learning and mentorship opportunities that come with physical presence in the workplace.

Many companies are now adopting hybrid models that combine remote and in-office work. These arrangements seek to capture the benefits of flexibility while preserving the social and collaborative aspects of traditional office environments. The long-term success of hybrid work will depend on how effectively organisations can redesign their management practices and physical workspaces to support this new paradigm.`,
		items: mcq(10, "passage"),
	},
	{
		id: "R4",
		part: 4,
		title: "Renewable Energy Transition",
		passage: `The global transition to renewable energy sources represents one of the most significant economic and technological shifts of the twenty-first century. Solar and wind power have become increasingly cost-competitive with fossil fuels, driven by rapid advances in technology and dramatic reductions in the cost of manufacturing solar panels and wind turbines.

Governments around the world are setting ambitious targets for renewable energy adoption, motivated both by climate concerns and economic opportunities. The renewable energy sector has become a major source of employment, with millions of jobs created in manufacturing, installation, and maintenance of clean energy infrastructure.

However, the transition also poses challenges. The intermittent nature of solar and wind power requires significant investment in energy storage and grid infrastructure. Regions that have long depended on fossil fuel industries face economic disruption and must manage a just transition for affected workers and communities. International cooperation and sustained policy commitment will be essential to navigate these challenges and achieve a sustainable energy future.`,
		items: mcq(10, "passage"),
	},
]

const MOCK_WRITING: MockWritingTask[] = [
	{
		id: "W1",
		part: 1,
		taskType: "letter",
		prompt: `You recently stayed at a hotel during a business trip. You were not satisfied with some aspects of your stay.

Write a letter to the hotel manager. In your letter:
– explain why you were staying at the hotel
– describe the problems you experienced
– suggest what the hotel should do to improve its service`,
		minWords: 120,
		instructions: [
			"Write at least 120 words.",
			"Do not write your real name or address.",
			"Begin your letter with 'Dear Manager,'",
		],
	},
	{
		id: "W2",
		part: 2,
		taskType: "essay",
		prompt: `Some people believe that universities should focus on providing students with academic knowledge and theoretical skills. Others argue that universities should place greater emphasis on preparing students for the practical demands of the workplace.

Discuss both views and give your own opinion.`,
		minWords: 250,
		instructions: [
			"Write at least 250 words.",
			"Present a balanced argument before stating your own view.",
			"Support your points with relevant examples or evidence.",
		],
	},
]

const MOCK_SPEAKING: MockSpeakingPart[] = [
	{
		id: "S1",
		part: 1,
		type: "social",
		speakingSeconds: 180,
		topics: [
			{
				name: "Daily Routines",
				questions: [
					"What does a typical weekday look like for you?",
					"How do you usually spend your evenings after work or school?",
					"Has your daily routine changed significantly in recent years? How?",
				],
			},
			{
				name: "Hobbies and Leisure",
				questions: [
					"What hobbies or activities do you enjoy in your free time?",
					"Do you prefer indoor or outdoor activities? Why?",
					"How important is it to have hobbies outside of work or study?",
				],
			},
		],
	},
	{
		id: "S2",
		part: 2,
		type: "solution",
		speakingSeconds: 120,
		situation:
			"A local community centre wants to attract more young people aged 18–25 to use its facilities. The centre currently offers a gym, a library, meeting rooms, and a café. It has a limited budget for improvements or new programmes.",
		options: [
			"Offer free membership for students with a valid student ID",
			"Launch evening social events such as film nights and quiz competitions",
			"Partner with local businesses to provide career workshops and networking events",
			"Create a dedicated quiet study zone with free Wi-Fi and charging points",
		],
	},
	{
		id: "S3",
		part: 3,
		type: "development",
		speakingSeconds: 120,
		centralIdea:
			"The use of social media has had both positive and negative effects on communication among young people.",
		suggestions: [
			"Consider how social media has changed the speed and reach of communication.",
			"Think about whether online communication has replaced or complemented face-to-face interaction.",
			"Reflect on issues such as misinformation, cyberbullying, or mental health impacts.",
		],
		followUpQuestion:
			"Do you think the benefits of social media for young people outweigh the drawbacks? Justify your answer with specific examples.",
	},
]

export const MOCK_EXAM_SESSION: MockExamSession = {
	id: 1,
	title: "Đề thi VSTEP HNUE 08/02/2026 #1",
	durationMinutes: 172,
	listening: MOCK_LISTENING,
	reading: MOCK_READING,
	writing: MOCK_WRITING,
	speaking: MOCK_SPEAKING,
}

export function mockGetExamSession(examId: number): MockExamSession {
	return {
		...MOCK_EXAM_SESSION,
		id: examId,
		title: `Đề thi VSTEP HNUE 08/02/2026 #${examId}`,
	}
}

// ─── Counting helpers ─────────────────────────────────────────────────────────

export function countTotalItems(session: MockExamSession): number {
	const listening = session.listening.reduce((s, sec) => s + sec.items.length, 0)
	const reading = session.reading.reduce((s, p) => s + p.items.length, 0)
	const writing = session.writing.length
	const speaking = session.speaking.length
	return listening + reading + writing + speaking
}

export function countAnswered(
	session: MockExamSession,
	mcq: MCQAnswerMap,
	writing: WritingAnswerMap,
	speaking: SpeakingDoneSet,
): number {
	let count = 0
	for (const sec of session.listening) {
		const a = mcq.get(sec.id) ?? {}
		count += Object.keys(a).length
	}
	for (const p of session.reading) {
		const a = mcq.get(p.id) ?? {}
		count += Object.keys(a).length
	}
	for (const t of session.writing) {
		const text = writing.get(t.id) ?? ""
		if (text.trim().length > 0) count += 1
	}
	for (const p of session.speaking) {
		if (speaking.has(p.id)) count += 1
	}
	return count
}
