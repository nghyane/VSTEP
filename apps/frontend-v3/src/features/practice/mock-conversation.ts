/**
 * MOCK DATA — TEMPORARY
 * Dùng để review layout "Hội thoại AI" trước khi backend ready.
 * Xoá file này khi BE expose `/practice/speaking/scenarios` + `/conversations`.
 */

import type {
	ConversationScenario,
	ConversationSessionDetail,
	ConversationTurn,
} from "#/features/practice/types"

export const mockConversationScenarios: ConversationScenario[] = [
	{
		id: "sc-greet-colleague",
		slug: "greeting-a-new-colleague",
		title: "Greeting a new colleague",
		level: "A1",
		character_name: "Patricia",
		character_voice: "us Sierra",
		description:
			"Patricia is your new colleague. Today is her first day at the company, and you want to say hello and get to know her. Patricia is friendly and happy to chat.",
		estimated_minutes: 5,
	},
	{
		id: "sc-cafe-order",
		slug: "ordering-at-a-cafe",
		title: "Ordering at a café",
		level: "A2",
		character_name: "James",
		character_voice: "us Adam",
		description:
			"James is the barista at your favourite café. You want to order a drink and a snack. Be polite and ask about today's specials.",
		estimated_minutes: 4,
	},
	{
		id: "sc-job-interview",
		slug: "first-job-interview",
		title: "First job interview",
		level: "B1",
		character_name: "Linda",
		character_voice: "us Sierra",
		description:
			"Linda is interviewing you for an internship. Introduce yourself, talk about your strengths, and ask one question about the role.",
		estimated_minutes: 8,
	},
]

const greetTurns: ConversationTurn[] = [
	{
		id: "t1",
		role: "ai",
		text: "Hi there! I just started working here today. It is nice to meet you! What is your name?",
		feedback: null,
		suggested_words: [],
	},
	{
		id: "t2",
		role: "user",
		text: "Nice to meet you too. My name is Fack.",
		feedback: {
			word_count: { used: 2, target: 3 },
			grammar_ok: true,
			grammar_corrections: [],
			vocab_check: [
				{ phrase: "My name is", used: true },
				{ phrase: "Nice to meet you too", used: true },
				{ phrase: "Welcome to the company", used: false },
			],
			better: "Nice to meet you too. I'm Fack.",
		},
		suggested_words: [],
	},
	{
		id: "t3",
		role: "ai",
		text: "Hello Fack! It is nice to meet you too. My name is Patricia and today is my first day here as well.",
		feedback: null,
		suggested_words: ["Which department?", "I am happy", "Welcome"],
	},
]

export const mockConversationSessions: Record<string, ConversationSessionDetail> = {
	"sc-greet-colleague": {
		session_id: "mock-session-1",
		scenario: mockConversationScenarios[0],
		turns: greetTurns,
	},
	"sc-cafe-order": {
		session_id: "mock-session-2",
		scenario: mockConversationScenarios[1],
		turns: [
			{
				id: "t1",
				role: "ai",
				text: "Hi! Welcome to Brew House. What can I get for you today?",
				feedback: null,
				suggested_words: ["latte", "iced", "small size"],
			},
		],
	},
	"sc-job-interview": {
		session_id: "mock-session-3",
		scenario: mockConversationScenarios[2],
		turns: [
			{
				id: "t1",
				role: "ai",
				text: "Thanks for coming in. Could you start by telling me a little about yourself?",
				feedback: null,
				suggested_words: ["I'm currently", "I have experience in", "I'm passionate about"],
			},
		],
	},
}
