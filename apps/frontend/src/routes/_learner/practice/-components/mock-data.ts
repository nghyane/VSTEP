// --- Topics per skill ---

export const LISTENING_TOPICS = [
	"Đời sống hàng ngày",
	"Du lịch & Khách sạn",
	"Giáo dục & Học tập",
	"Khoa học & Công nghệ",
	"Văn hóa & Xã hội",
	"Sức khỏe",
] as const

export const READING_TOPICS = [
	"Sức khỏe & Khoa học",
	"Công nghệ & Xã hội",
	"Giáo dục & Ngôn ngữ",
	"Thiên nhiên & Môi trường",
	"Lịch sử & Văn hóa",
	"Khoa học & Địa chất",
	"Du lịch & Tình nguyện",
] as const

export const WRITING_TOPICS = [
	"Thư cá nhân",
	"Bài luận xã hội",
	"Bài luận quan điểm",
	"Thư trang trọng",
] as const

export const SPEAKING_TOPICS = [
	"Lối sống & Du lịch",
	"Giáo dục & Nghề nghiệp",
	"Văn hóa & Lễ hội",
	"Tài chính & Cuộc sống",
] as const

export type ListeningTopic = (typeof LISTENING_TOPICS)[number]
export type ReadingTopic = (typeof READING_TOPICS)[number]
export type WritingTopic = (typeof WRITING_TOPICS)[number]
export type SpeakingTopic = (typeof SPEAKING_TOPICS)[number]

export function getTopicsForSkill(skill: string): readonly string[] {
	switch (skill) {
		case "listening":
			return LISTENING_TOPICS
		case "reading":
			return READING_TOPICS
		case "writing":
			return WRITING_TOPICS
		case "speaking":
			return SPEAKING_TOPICS
		default:
			return []
	}
}

// --- Types ---

export interface ExamQuestion {
	questionNumber: number
	questionText: string
	options: Record<string, string>
	correctAnswer: string
}

export interface ListeningExam {
	id: string
	title: string
	topic: ListeningTopic
	audioUrl: string
	sections: {
		partNumber: number
		partTitle: string
		instructions: string
		questions: ExamQuestion[]
	}[]
}

export interface ReadingExam {
	id: string
	title: string
	topic: ReadingTopic
	passages: {
		passageNumber: number
		title: string
		content: string
		questions: ExamQuestion[]
	}[]
}

export interface WritingExam {
	id: string
	title: string
	topic: WritingTopic
	tasks: {
		taskNumber: number
		title: string
		prompt: string
		instructions: string
		wordLimit: number
	}[]
}

export interface SpeakingExam {
	id: string
	title: string
	topic: SpeakingTopic
	parts: {
		partNumber: number
		title: string
		instructions: string
		speakingTime: number
	}[]
}

// --- Mock Data ---

export const LISTENING_EXAMS: ListeningExam[] = [
	{
		id: "listen-1",
		topic: "Đời sống hàng ngày",
		title: "Bài luyện nghe số 1",
		audioUrl:
			"https://luyenthivstep.vn/assets/nhch/listening/bac3/lp1-1642953803_eb7ab6f2e8dead6de076.mp3",
		sections: [
			{
				partNumber: 1,
				partTitle: "Listening",
				instructions: "",
				questions: [
					{
						questionNumber: 1,
						questionText: "",
						options: { A: "4.40", B: "10.30", C: "10.00", D: "4.50" },
						correctAnswer: "D",
					},
					{
						questionNumber: 2,
						questionText: "",
						options: { A: "15FACAS", B: "50SACAS", C: "15SHCAF", D: "50FACAF" },
						correctAnswer: "A",
					},
					{
						questionNumber: 3,
						questionText: "",
						options: { A: "press 3", B: "press 1", C: "press 0", D: "press 2" },
						correctAnswer: "D",
					},
					{
						questionNumber: 4,
						questionText: "",
						options: {
							A: "It is a boring exercise.",
							B: "It requires short-term training.",
							C: "It is exciting for him.",
							D: "It is more tiring than riding.",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 5,
						questionText: "",
						options: {
							A: "how to fry rice",
							B: "how to heat rice",
							C: "how to cook rice",
							D: "how to wash rice",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 6,
						questionText: "",
						options: {
							A: "computer users",
							B: "wall climbers",
							C: "lift riders",
							D: "camera owners",
						},
						correctAnswer: "D",
					},
					{
						questionNumber: 7,
						questionText: "",
						options: {
							A: "How to seek for destination on the bus map",
							B: "How to alert the driver on the digital marquee",
							C: "How to get around using the local bus service",
							D: "How to make a detour in using the bus service",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 8,
						questionText: "",
						options: {
							A: "underground riders",
							B: "park visitors",
							C: "palace visitors",
							D: "bus riders",
						},
						correctAnswer: "C",
					},
				],
			},
		],
	},
	{
		id: "listen-2",
		topic: "Du lịch & Khách sạn",
		title: "Bài luyện nghe số 2",
		audioUrl:
			"https://luyenthivstep.vn/assets/nhch/listening/bac3/lp2-1642953803_eb7ab6f2e8dead6de076.mp3",
		sections: [
			{
				partNumber: 1,
				partTitle: "Listening - Conversations",
				instructions: "Listen to the conversations and answer the questions.",
				questions: [
					{
						questionNumber: 1,
						questionText: "",
						options: {
							A: "At a hotel reception",
							B: "At a restaurant",
							C: "At a travel agency",
							D: "At an airport",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 2,
						questionText: "",
						options: { A: "2 nights", B: "3 nights", C: "5 nights", D: "7 nights" },
						correctAnswer: "C",
					},
					{
						questionNumber: 3,
						questionText: "",
						options: {
							A: "By credit card",
							B: "By cash",
							C: "By bank transfer",
							D: "By cheque",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 4,
						questionText: "",
						options: {
							A: "She wants to cancel the booking.",
							B: "She wants to extend her stay.",
							C: "She wants to change the room type.",
							D: "She wants to complain about the service.",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 5,
						questionText: "",
						options: {
							A: "It has a sea view.",
							B: "It is on the top floor.",
							C: "It includes breakfast.",
							D: "It has a private balcony.",
						},
						correctAnswer: "D",
					},
					{
						questionNumber: 6,
						questionText: "",
						options: {
							A: "The gym is open 24 hours.",
							B: "The pool closes at 9 PM.",
							C: "The restaurant serves until midnight.",
							D: "The spa is free for guests.",
						},
						correctAnswer: "B",
					},
				],
			},
		],
	},
	{
		id: "listen-3",
		topic: "Giáo dục & Học tập",
		title: "Bài luyện nghe số 3",
		audioUrl:
			"https://luyenthivstep.vn/assets/nhch/listening/bac3/lp3-1642953803_eb7ab6f2e8dead6de076.mp3",
		sections: [
			{
				partNumber: 1,
				partTitle: "Listening - Academic Lecture",
				instructions: "Listen to the lecture and answer the questions.",
				questions: [
					{
						questionNumber: 1,
						questionText: "",
						options: {
							A: "The effects of climate change on agriculture",
							B: "New methods of sustainable farming",
							C: "The history of organic food production",
							D: "Water pollution in developing countries",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 2,
						questionText: "",
						options: {
							A: "It reduces crop yield significantly.",
							B: "It requires more water than traditional methods.",
							C: "It helps preserve soil nutrients.",
							D: "It is too expensive for small farmers.",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 3,
						questionText: "",
						options: { A: "15%", B: "25%", C: "40%", D: "60%" },
						correctAnswer: "C",
					},
					{
						questionNumber: 4,
						questionText: "",
						options: {
							A: "Government subsidies",
							B: "Community support programs",
							C: "International trade agreements",
							D: "Private investment funds",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 5,
						questionText: "",
						options: {
							A: "They are skeptical about the results.",
							B: "They are enthusiastic about adopting new techniques.",
							C: "They prefer traditional methods.",
							D: "They lack access to training resources.",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 6,
						questionText: "",
						options: {
							A: "Increased use of pesticides",
							B: "Integration of technology in farming",
							C: "Reduction of farmland areas",
							D: "Migration to urban areas",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 7,
						questionText: "",
						options: {
							A: "The lecture was purely theoretical.",
							B: "The lecture included real-world case studies.",
							C: "The lecture focused only on one country.",
							D: "The lecture avoided controversial topics.",
						},
						correctAnswer: "B",
					},
				],
			},
		],
	},
	{
		id: "listen-4",
		topic: "Khoa học & Công nghệ",
		title: "Bài luyện nghe số 4",
		audioUrl:
			"https://luyenthivstep.vn/assets/nhch/listening/bac3/lp2-1664819146_f3e21323a2997bc44c0b.mp3",
		sections: [
			{
				partNumber: 1,
				partTitle: "Listening - Science & Technology",
				instructions: "Listen to the recording and answer the questions.",
				questions: [
					{
						questionNumber: 1,
						questionText: "",
						options: {
							A: "She is running.",
							B: "She is taking the train.",
							C: "She is taking the bus.",
							D: "She is driving her car.",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 2,
						questionText: "",
						options: {
							A: "He wanted to save time.",
							B: "He liked keeping fit at the gym.",
							C: "He found running to work was bad for his health.",
							D: "He felt tired.",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 3,
						questionText: "",
						options: {
							A: "Vaccines can prevent all diseases.",
							B: "Vaccines stimulate the immune system.",
							C: "Vaccines replace antibiotics entirely.",
							D: "Vaccines are only for children.",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 4,
						questionText: "",
						options: {
							A: "It processes data faster than expected.",
							B: "It can store unlimited information.",
							C: "It requires no electricity to operate.",
							D: "It helps scientists model complex problems.",
						},
						correctAnswer: "D",
					},
					{
						questionNumber: 5,
						questionText: "",
						options: {
							A: "Video games improve hand-eye coordination.",
							B: "Video games cause violent behavior.",
							C: "Video games have no educational value.",
							D: "Video games should be banned for children.",
						},
						correctAnswer: "A",
					},
				],
			},
		],
	},
	{
		id: "listen-5",
		topic: "Văn hóa & Xã hội",
		title: "Bài luyện nghe số 5",
		audioUrl:
			"https://luyenthivstep.vn/assets/nhch/listening/bac3/lp3-1664868840_a3e14350621815aa007f.mp3",
		sections: [
			{
				partNumber: 1,
				partTitle: "Listening - Culture & Society",
				instructions:
					"Listen to the recording about the Statue of Liberty and answer the questions.",
				questions: [
					{
						questionNumber: 1,
						questionText: "",
						options: {
							A: "To remember the friendship between France and America.",
							B: "To remember the soldiers in the war against Britain.",
							C: "To remember Gustave Eiffel.",
							D: "To remember the war between France and America.",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 2,
						questionText: "",
						options: {
							A: "It is 46 meters high.",
							B: "The statue's skin was made of copper.",
							C: "It's reduced to 350 pieces and shipped to America.",
							D: "Gustave Eiffel was chosen to design the statue.",
						},
						correctAnswer: "D",
					},
					{
						questionNumber: 3,
						questionText: "",
						options: {
							A: "Immigrants saw it as a symbol of hope.",
							B: "It was used as a lighthouse.",
							C: "It was built to attract tourists.",
							D: "It served as a military fort.",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 4,
						questionText: "",
						options: {
							A: "Over 2 million",
							B: "Over 4 million",
							C: "Over 6 million",
							D: "Over 10 million",
						},
						correctAnswer: "B",
					},
				],
			},
		],
	},
	{
		id: "listen-6",
		topic: "Sức khỏe",
		title: "Bài luyện nghe số 6",
		audioUrl:
			"https://luyenthivstep.vn/assets/nhch/listening/bac3/lp1-1664862652_48ad9ca8f9e034e23c54.mp3",
		sections: [
			{
				partNumber: 1,
				partTitle: "Listening - Health",
				instructions: "Listen to the conversations about health and answer the questions.",
				questions: [
					{
						questionNumber: 1,
						questionText: "",
						options: {
							A: "She has a headache.",
							B: "She has a toothache.",
							C: "She has a stomachache.",
							D: "She has a sore throat.",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 2,
						questionText: "",
						options: {
							A: "Take some medicine and rest.",
							B: "Visit a dentist immediately.",
							C: "Drink warm water with salt.",
							D: "Apply ice to the affected area.",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 3,
						questionText: "",
						options: {
							A: "He has been coughing for a week.",
							B: "He has a runny nose and fever.",
							C: "He has difficulty breathing.",
							D: "He has been feeling dizzy.",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 4,
						questionText: "",
						options: {
							A: "Get plenty of rest and drink fluids.",
							B: "Go to the hospital right away.",
							C: "Take antibiotics for a week.",
							D: "Exercise more to build immunity.",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 5,
						questionText: "",
						options: {
							A: "Once a year",
							B: "Twice a year",
							C: "Every two years",
							D: "Only when feeling sick",
						},
						correctAnswer: "B",
					},
				],
			},
		],
	},
]

export const READING_EXAMS: ReadingExam[] = [
	{
		id: "read-1",
		topic: "Sức khỏe & Khoa học",
		title: "Bài luyện đọc số 1",
		passages: [
			{
				passageNumber: 1,
				title: "Blood Types & Personality",
				content:
					'(A) In many Asian countries, people believe that blood types are associated with personality traits. This belief is especially popular in Japan and South Korea, where asking about someone\'s blood type is almost as common as asking about their zodiac sign. The idea was first introduced by a Japanese professor, Takeji Furukawa, in 1927. Although it has been dismissed by the scientific community, the theory persists in popular culture.\n\n(B) People with blood type A are often described as careful, patient, and sensitive. They tend to prioritize harmony in their relationships and may suppress their own feelings to get on well with others. Type B individuals are seen as creative, passionate, and outgoing. They get on well with people but can sometimes be perceived as selfish. Type AB people are thought to be rational and good at deciphering complex situations. They do not let emotion affect their assessment of things. Type O individuals are known for their confidence, determination, and leadership qualities. They use willpower to achieve what they want and are often drawn to sports due to their physical strength. However, they can be perceived as insensitive. In Japan, discrimination based on blood type, called "bura hara," has become a social issue.',
				questions: [
					{
						questionNumber: 1,
						questionText: "",
						options: {
							A: "It is more popular in Asian countries than in the West.",
							B: "It is used in schools and workplaces to categorize people.",
							C: "It was originally developed by a Japanese scientist.",
							D: "Its accuracy has been supported with scientific data.",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 2,
						questionText: "",
						options: { A: "blood", B: "school", C: "personality", D: "theory" },
						correctAnswer: "D",
					},
					{
						questionNumber: 3,
						questionText: "",
						options: {
							A: "They cannot perform in jobs that require frequent contact with others.",
							B: "They often suppress their own feelings to get on well with others.",
							C: "They suffer from anxiety as a result of their inability to communicate.",
							D: "Trying to communicate with others make them mentally exhausted.",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 4,
						questionText: "",
						options: { A: "Type B", B: "Type O", C: "Type AB", D: "Type A" },
						correctAnswer: "A",
					},
					{
						questionNumber: 5,
						questionText: "",
						options: { A: "Type O", B: "Type AB", C: "Type A", D: "Type B" },
						correctAnswer: "B",
					},
					{
						questionNumber: 6,
						questionText: "",
						options: {
							A: "They prioritize others' needs.",
							B: "They can become great leaders.",
							C: "They get on well with people.",
							D: "They are naturally outgoing.",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 7,
						questionText: "",
						options: {
							A: "discovering",
							B: "feeling",
							C: "translating",
							D: "cracking",
						},
						correctAnswer: "D",
					},
					{
						questionNumber: 8,
						questionText: "",
						options: {
							A: 'The passage explains the meaning of "bura hara."',
							B: "The passage describes the personality traits of Type A.",
							C: "The passage discusses the discrimination against Type B individuals.",
							D: "The passage compares different blood type personalities.",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 9,
						questionText: "",
						options: {
							A: "They are down-to-earth and often follow the rules.",
							B: "Their unpopularity with people makes them lonely.",
							C: "They use willpower to achieve what they want.",
							D: "Their physical strength gives them advantages in sports.",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 10,
						questionText: "",
						options: {
							A: "The blood type personality traits",
							B: "Applications of blood group system",
							C: "The blood type personality myth",
							D: "What your blood type can tell you",
						},
						correctAnswer: "D",
					},
				],
			},
		],
	},
	{
		id: "read-2",
		title: "Bài luyện đọc số 2",
		topic: "Công nghệ & Xã hội",
		passages: [
			{
				passageNumber: 1,
				title: "The Impact of Social Media on Young People",
				content:
					"Social media has become an integral part of modern life, especially for young people. Platforms such as Facebook, Instagram, and TikTok allow users to connect, share, and communicate with others around the world. However, the increasing use of social media among teenagers has raised concerns about its effects on mental health, academic performance, and social skills.\n\nStudies have shown that excessive use of social media can lead to anxiety, depression, and low self-esteem. Young people often compare themselves to others online, which can create unrealistic expectations about appearance, lifestyle, and success. Cyberbullying is another serious issue, as it can have devastating effects on victims' mental well-being.\n\nOn the other hand, social media also offers positive benefits. It provides a platform for self-expression, creativity, and learning. Many young people use social media to stay informed about current events, connect with like-minded individuals, and access educational resources. The key is to find a healthy balance between online and offline activities.",
				questions: [
					{
						questionNumber: 1,
						questionText: "",
						options: {
							A: "Social media is harmful for all age groups.",
							B: "Social media has both positive and negative effects on young people.",
							C: "Young people should avoid social media completely.",
							D: "Social media only benefits adults.",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 2,
						questionText: "",
						options: {
							A: "improved academic results",
							B: "better sleep quality",
							C: "anxiety and depression",
							D: "stronger family bonds",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 3,
						questionText: "",
						options: {
							A: "physical bullying at school",
							B: "online harassment and bullying",
							C: "verbal abuse from teachers",
							D: "competition in sports",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 4,
						questionText: "",
						options: {
							A: "self-expression and creativity",
							B: "increased screen time",
							C: "reduced attention span",
							D: "addiction to games",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 5,
						questionText: "",
						options: {
							A: "an equal amount of time online and offline",
							B: "completely avoiding social media",
							C: "a healthy balance between online and offline activities",
							D: "spending more time on social media for learning",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 6,
						questionText: "",
						options: {
							A: "They feel more confident about themselves.",
							B: "They develop unrealistic expectations.",
							C: "They become more motivated to succeed.",
							D: "They stop using social media.",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 7,
						questionText: "",
						options: {
							A: "essential",
							B: "harmful",
							C: "irrelevant",
							D: "temporary",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 8,
						questionText: "",
						options: {
							A: "To promote social media platforms",
							B: "To discuss the effects of social media on young people",
							C: "To encourage teenagers to quit social media",
							D: "To compare different social media platforms",
						},
						correctAnswer: "B",
					},
				],
			},
		],
	},
	{
		id: "read-3",
		title: "Bài luyện đọc số 3",
		topic: "Giáo dục & Ngôn ngữ",
		passages: [
			{
				passageNumber: 1,
				title: "The Benefits of Learning a Second Language",
				content:
					"Learning a second language has numerous cognitive, social, and professional benefits. Research has consistently shown that bilingual individuals tend to have better memory, improved problem-solving skills, and enhanced multitasking abilities compared to monolinguals.\n\nFrom a cognitive perspective, learning a new language strengthens the brain's neural pathways. It improves concentration and delays the onset of age-related cognitive decline. Studies conducted at the University of Edinburgh found that bilingual people showed signs of dementia an average of four years later than those who spoke only one language.\n\nProfessionally, knowing a second language opens doors to international career opportunities. In today's globalized economy, employers value candidates who can communicate across cultures. Furthermore, language learning fosters cultural awareness and empathy, as it requires understanding different perspectives and ways of thinking.\n\nDespite these benefits, many people struggle to learn a new language due to lack of motivation, limited resources, or insufficient practice opportunities. Experts recommend immersive learning experiences, regular practice, and the use of technology-based tools to make the process more engaging and effective.",
				questions: [
					{
						questionNumber: 1,
						questionText: "",
						options: {
							A: "Learning languages is only useful for travel.",
							B: "Bilingual people have cognitive advantages.",
							C: "Everyone should learn at least three languages.",
							D: "Language learning is easy for everyone.",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 2,
						questionText: "",
						options: {
							A: "It weakens neural pathways.",
							B: "It has no effect on the brain.",
							C: "It strengthens neural pathways and improves concentration.",
							D: "It only benefits children's brains.",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 3,
						questionText: "",
						options: {
							A: "two years",
							B: "four years",
							C: "six years",
							D: "ten years",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 4,
						questionText: "",
						options: {
							A: "It limits career choices.",
							B: "It is only useful in academic settings.",
							C: "It opens doors to international career opportunities.",
							D: "It has no impact on professional life.",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 5,
						questionText: "",
						options: {
							A: "understanding",
							B: "encouraging",
							C: "promoting",
							D: "preventing",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 6,
						questionText: "",
						options: {
							A: "excess motivation",
							B: "too many resources",
							C: "lack of motivation and limited resources",
							D: "having too much free time",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 7,
						questionText: "",
						options: {
							A: "avoiding technology",
							B: "studying grammar books only",
							C: "immersive experiences and regular practice",
							D: "learning alone without any help",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 8,
						questionText: "",
						options: {
							A: "To discourage people from learning languages",
							B: "To highlight the benefits and challenges of learning a second language",
							C: "To compare different languages",
							D: "To promote a specific language course",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 9,
						questionText: "",
						options: {
							A: "Cultural awareness and empathy",
							B: "Physical fitness",
							C: "Musical talent",
							D: "Mathematical skills",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 10,
						questionText: "",
						options: {
							A: "University of Oxford",
							B: "University of Cambridge",
							C: "University of Edinburgh",
							D: "University of London",
						},
						correctAnswer: "C",
					},
				],
			},
		],
	},
	{
		id: "read-4",
		topic: "Thiên nhiên & Môi trường",
		title: "Bài luyện đọc số 4",
		passages: [
			{
				passageNumber: 1,
				title: "The Importance of Bees to Our Ecosystem",
				content:
					"(A) Bees are among the most important creatures on Earth. They play a critical role in pollinating plants, which is essential for the production of fruits, vegetables, and seeds. Without bees, many of the foods we rely on would become scarce or disappear entirely. It is estimated that one-third of the food we eat depends on pollination by bees.\n\n(B) In recent years, bee populations around the world have been declining at an alarming rate. This phenomenon, known as Colony Collapse Disorder (CCD), has been linked to several factors, including the use of pesticides, habitat loss, climate change, and diseases caused by parasites. Scientists warn that if bee populations continue to decline, the consequences for global food production could be devastating.\n\n(C) Efforts to protect bees include banning harmful pesticides, creating bee-friendly habitats, and supporting local beekeepers. Many countries have introduced legislation to reduce the use of neonicotinoids, a class of pesticides that has been shown to be particularly harmful to bees. Additionally, individuals can help by planting wildflowers, avoiding the use of chemicals in their gardens, and buying locally produced honey.",
				questions: [
					{
						questionNumber: 1,
						questionText: "",
						options: {
							A: "Bees are dangerous insects.",
							B: "Bees are essential for pollination and food production.",
							C: "Bees produce only honey.",
							D: "Bees are found only in tropical areas.",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 2,
						questionText: "",
						options: {
							A: "One-quarter",
							B: "One-third",
							C: "One-half",
							D: "Two-thirds",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 3,
						questionText: "",
						options: {
							A: "Increasing urbanization only",
							B: "Pesticides, habitat loss, climate change, and parasites",
							C: "Natural predators",
							D: "Overproduction of honey",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 4,
						questionText: "",
						options: {
							A: "A type of bee species",
							B: "A pesticide brand",
							C: "The widespread disappearance of bee colonies",
							D: "A beekeeping technique",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 5,
						questionText: "",
						options: {
							A: "Increasing pesticide use",
							B: "Banning all farming activities",
							C: "Planting wildflowers and avoiding chemicals",
							D: "Importing bees from other countries",
						},
						correctAnswer: "C",
					},
				],
			},
		],
	},
	{
		id: "read-5",
		topic: "Lịch sử & Văn hóa",
		title: "Bài luyện đọc số 5",
		passages: [
			{
				passageNumber: 1,
				title: "The History of Jazz Music",
				content:
					"(A) Jazz is a music genre that originated in the African-American communities of New Orleans, Louisiana, in the late 19th and early 20th centuries. It developed from roots in blues and ragtime, incorporating elements of European harmony and African rhythmic patterns. Jazz is characterized by swing and blue notes, complex chords, call-and-response vocals, polyrhythms, and improvisation.\n\n(B) The genre spread rapidly across the United States during the 1920s, a period often referred to as the Jazz Age. Musicians such as Louis Armstrong, Duke Ellington, and Billie Holiday became iconic figures who shaped the sound of American music. Jazz clubs in cities like New York, Chicago, and Kansas City became cultural hubs where musicians experimented with new sounds and styles.\n\n(C) Over the decades, jazz has continued to evolve, giving rise to numerous subgenres including bebop, cool jazz, free jazz, and jazz fusion. Today, jazz is recognized worldwide as a significant form of musical expression that reflects the cultural diversity and creative spirit of its origins. UNESCO designated April 30 as International Jazz Day to highlight the role of jazz in promoting peace, dialogue, and understanding.",
				questions: [
					{
						questionNumber: 1,
						questionText: "",
						options: {
							A: "Chicago, Illinois",
							B: "New York City",
							C: "New Orleans, Louisiana",
							D: "Kansas City, Missouri",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 2,
						questionText: "",
						options: {
							A: "Classical music and opera",
							B: "Blues and ragtime",
							C: "Country and folk",
							D: "Rock and pop",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 3,
						questionText: "",
						options: {
							A: "The 1940s",
							B: "The 1910s",
							C: "The 1920s",
							D: "The 1950s",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 4,
						questionText: "",
						options: {
							A: "playing exactly as written",
							B: "creating music spontaneously",
							C: "singing without instruments",
							D: "repeating the same melody",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 5,
						questionText: "",
						options: {
							A: "March 21",
							B: "April 30",
							C: "June 15",
							D: "October 1",
						},
						correctAnswer: "B",
					},
				],
			},
		],
	},
	{
		id: "read-6",
		topic: "Khoa học & Địa chất",
		title: "Bài luyện đọc số 6",
		passages: [
			{
				passageNumber: 1,
				title: "Plate Tectonics and Continental Formation",
				content:
					"(A) According to geoscientists, the continents were assumed to first rise above the oceans approximately 3 billion years ago. Continental crust, which is five times thicker than the ocean floor crust, is made of thick, buoyant rock that rises high above the seafloor. However, the exact time when continents were formed is subject to argument among researchers.\n\n(B) To shed light on this question, scientists have studied ancient rocks and minerals, particularly zircon crystals, which can survive for billions of years. By analyzing the ratio of rubidium to strontium in these crystals, researchers can estimate when the rock was first formed. When magma cools and crystallizes, the molten rock diminishes in silica content, providing clues about the geological processes involved.\n\n(C) The thick, buoyant nature of these chunks of crust would have made them rise high above what became the seafloor. Accompanying volcanic activity and tectonic compression played crucial roles in shaping the continents as we know them. The moment plate tectonics began properly marked a significant turning point in Earth's geological history, leading to the formation of the continental crust that supports life today.",
				questions: [
					{
						questionNumber: 1,
						questionText: "",
						options: {
							A: "3 billion years ago",
							B: "2 billion years ago",
							C: "4 billion years ago",
							D: "1 billion years ago",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 2,
						questionText: "",
						options: {
							A: "They rise about four miles above the seafloor.",
							B: "Their crust is five times thicker than the ocean floor crust.",
							C: "Their crust is dense and has average thickness.",
							D: "They are made of thick and underlying crust.",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 3,
						questionText: "",
						options: {
							A: "It is subject to argument.",
							B: "It is put forward in a contest.",
							C: "It was dated from the earliest days.",
							D: "It is beyond human's knowledge.",
						},
						correctAnswer: "A",
					},
					{
						questionNumber: 4,
						questionText: "",
						options: {
							A: "To release",
							B: "To clarify",
							C: "To illustrate",
							D: "To ignite",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 5,
						questionText: "",
						options: {
							A: "Through tectonic compression.",
							B: "Through continental erosion.",
							C: "Through silica deposition.",
							D: "Through volcanic activity.",
						},
						correctAnswer: "D",
					},
				],
			},
		],
	},
	{
		id: "read-7",
		topic: "Du lịch & Tình nguyện",
		title: "Bài luyện đọc số 7",
		passages: [
			{
				passageNumber: 1,
				title: "Voluntourism: Travel with a Purpose",
				content:
					"(A) Voluntourism, a combination of volunteering and tourism, has become increasingly popular among travelers who want to make a positive impact while exploring new destinations. Participants typically spend part of their trip working on community projects such as building schools, teaching English, or supporting conservation efforts, while also enjoying the cultural and natural attractions of the region.\n\n(B) Proponents argue that voluntourism benefits both travelers and host communities. Volunteers gain meaningful experiences, develop new skills, and build cross-cultural understanding. Host communities receive much-needed assistance with infrastructure, education, and environmental protection. Many organizations facilitate these trips, matching volunteers with projects that align with their skills and interests.\n\n(C) However, critics point out that voluntourism can sometimes do more harm than good. Short-term volunteers may lack the expertise needed for certain projects, potentially producing substandard work. Additionally, the presence of well-meaning but unskilled volunteers can undermine local workers and create dependency. Experts recommend that potential voluntourists research organizations carefully, choose projects that match their skills, and prioritize long-term commitments over brief visits.",
				questions: [
					{
						questionNumber: 1,
						questionText: "",
						options: {
							A: "A type of luxury tourism",
							B: "A combination of volunteering and tourism",
							C: "Government-sponsored travel programs",
							D: "A form of business travel",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 2,
						questionText: "",
						options: {
							A: "Only the travelers benefit.",
							B: "Only the host communities benefit.",
							C: "Both travelers and host communities benefit.",
							D: "Neither side benefits significantly.",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 3,
						questionText: "",
						options: {
							A: "Volunteers always have the right expertise.",
							B: "Short-term volunteers may lack needed expertise.",
							C: "Voluntourism never causes problems.",
							D: "Local workers always welcome volunteers.",
						},
						correctAnswer: "B",
					},
					{
						questionNumber: 4,
						questionText: "",
						options: {
							A: "Always choose the cheapest option.",
							B: "Avoid doing any research beforehand.",
							C: "Research organizations and prioritize long-term commitments.",
							D: "Only visit popular tourist destinations.",
						},
						correctAnswer: "C",
					},
					{
						questionNumber: 5,
						questionText: "",
						options: {
							A: "weakening",
							B: "damaging",
							C: "supporting",
							D: "ignoring",
						},
						correctAnswer: "A",
					},
				],
			},
		],
	},
]

export const WRITING_EXAMS: WritingExam[] = [
	{
		id: "write-1",
		topic: "Thư cá nhân",
		title: "Bài luyện viết số 1",
		tasks: [
			{
				taskNumber: 1,
				title: "Email Response",
				prompt:
					"You should spend about 20 minutes on this task.\n\nYou have asked your closest friend Brianna to help look after your house and pet when you are on holiday. She has written you an email asking for more information. Read this part of her email below.\n\n\nGreat to hear that you are going to visit Dubai! I'm sure you will have a wonderful time there. Don't worry, I'll look after your house and your pet while you are away. I just want to know the time you leave for Dubai and when you will be back. I don't have a lot of experience looking after animals, so tell me how to care for your pet. Also, are there any other household duties I am supposed to do?\nLots of love,\nBrianna\n\n\nWrite a letter to respond to Brianna.\n\nYou should write at least 120 words. Do not include your name. Your response will be evaluated in terms of Task Fulfillment, Organization, Vocabulary and Grammar.",
				instructions: "",
				wordLimit: 120,
			},
		],
	},
	{
		id: "write-2",
		topic: "Bài luận quan điểm",
		title: "Bài luyện viết số 2",
		tasks: [
			{
				taskNumber: 1,
				title: "Opinion Essay",
				prompt:
					"You should spend about 40 minutes on this task.\n\nWrite about the following topic:\n\nSome people think that the internet has brought people closer together, while others think it has made people more isolated. Discuss both views and give your own opinion.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words. Your response will be evaluated in terms of Task Fulfillment, Organization, Vocabulary and Grammar.",
				instructions: "",
				wordLimit: 250,
			},
		],
	},
	{
		id: "write-3",
		topic: "Thư trang trọng",
		title: "Bài luyện viết số 3",
		tasks: [
			{
				taskNumber: 1,
				title: "Formal Letter",
				prompt:
					"You should spend about 20 minutes on this task.\n\nYou recently attended a training course at your company. Write a letter to your manager. In your letter:\n- Describe the training course you attended\n- Explain what you learned from it\n- Suggest how the company could benefit from the training\n\nYou should write at least 120 words. Do not include your name. Your response will be evaluated in terms of Task Fulfillment, Organization, Vocabulary and Grammar.",
				instructions: "",
				wordLimit: 120,
			},
		],
	},
	{
		id: "write-4",
		topic: "Bài luận xã hội",
		title: "Bài luyện viết số 4",
		tasks: [
			{
				taskNumber: 1,
				title: "Social Essay - Teenage Crime",
				prompt:
					"You should spend about 40 minutes on this task.\n\nRead the following extract from a report on teenage crime.\n\n\nIn recent years, the rate of crime committed by teenagers in many countries throughout the world has increased. This problem has affected people's lives and security. The rise of crime committed by youth has resulted from many factors. The challenge, therefore, is how to deal with this worrying trend.\n\n\nWrite an essay discussing the possible causes of teenage crime and proposing solutions to address this issue.\n\nGive reasons and relevant examples from your knowledge or experience. You should write at least 250 words. Your response will be evaluated in terms of Task Fulfillment, Organization, Vocabulary and Grammar.",
				instructions: "",
				wordLimit: 250,
			},
		],
	},
	{
		id: "write-5",
		topic: "Thư cá nhân",
		title: "Bài luyện viết số 5",
		tasks: [
			{
				taskNumber: 1,
				title: "Email - Backpacking Advice",
				prompt:
					"You should spend about 20 minutes on this task.\n\nYou have received this email from an English-speaking friend, Alex. Read part of his email below.\n\n\nSome friends of mine are going backpacking next month around Vietnam. They would like to learn about Vietnamese culture and its history.\n\nWhere should they begin the trip?\nWhat's the easiest way to get around?\nWhere should they stay as they are on a tight budget?\n\n\nWrite an email responding to him, giving advice on travel routes, transportation, and accommodation.\n\nYou should write at least 120 words. Do not include your name. Your response will be evaluated in terms of Task Fulfillment, Organization, Vocabulary and Grammar.",
				instructions: "",
				wordLimit: 120,
			},
		],
	},
	{
		id: "write-6",
		topic: "Bài luận xã hội",
		title: "Bài luyện viết số 6",
		tasks: [
			{
				taskNumber: 1,
				title: "Social Essay - Internet and Social Interactions",
				prompt:
					"You should spend about 40 minutes on this task.\n\nRead the following text from an article about the Internet:\n\n\nIt is evident that the Internet has increasingly brought about significant changes to our life. According to a recent study, the more time people use the Internet, the less time they spend with real human beings. Some people say that instead of seeing the Internet as a way of opening up new communication possibilities worldwide, we should be concerned about the effect it is having on social interactions.\n\n\nWrite an essay for an educated audience discussing the effects of the Internet on human interactions. Support your arguments with reasons and relevant examples.\n\nGive reasons and relevant examples from your knowledge or experience. You should write at least 250 words. Your response will be evaluated in terms of Task Fulfillment, Organization, Vocabulary and Grammar.",
				instructions: "",
				wordLimit: 250,
			},
		],
	},
	{
		id: "write-7",
		topic: "Thư cá nhân",
		title: "Bài luyện viết số 7",
		tasks: [
			{
				taskNumber: 1,
				title: "Email - Music Preferences",
				prompt:
					"You should spend about 20 minutes on this task.\n\nYou have received this email from an English-speaking pen friend.\n\n\nI'm a rock fan. I can listen to rock all day.\n\nWhat about you?\nWhat kind of music do you like?\nWhat is your favourite song and artist?\nPlease write to tell me more about your music taste.\n\n\nWrite an email to your friend responding to their questions and sharing your music preferences.\n\nYou should write at least 120 words. Do not include your name. Your response will be evaluated in terms of Task Fulfillment, Organization, Vocabulary and Grammar.",
				instructions: "",
				wordLimit: 120,
			},
		],
	},
	{
		id: "write-8",
		topic: "Bài luận quan điểm",
		title: "Bài luyện viết số 8",
		tasks: [
			{
				taskNumber: 1,
				title: "Opinion Essay - Ex-prisoners Educating Teenagers",
				prompt:
					"You should spend about 40 minutes on this task.\n\nRead the following text from an article about ex-prisoners.\n\n\nIt is undeniable that ex-prisoners can reintegrate into society and become responsible, productive citizens. Some former prisoners successfully turn their lives around and contribute positively to society. Many argue that they are the most effective individuals to educate teenagers about the consequences of crime.\n\n\nWrite an essay for an educated audience discussing your opinion on whether ex-prisoners are the best people to educate teenagers about crime. Support your answer with specific reasons and relevant examples.\n\nGive reasons and relevant examples from your knowledge or experience. You should write at least 250 words. Your response will be evaluated in terms of Task Fulfillment, Organization, Vocabulary and Grammar.",
				instructions: "",
				wordLimit: 250,
			},
		],
	},
]

export const SPEAKING_EXAMS: SpeakingExam[] = [
	{
		id: "speak-1",
		topic: "Lối sống & Du lịch",
		title: "Bài luyện nói số 1",
		parts: [
			{
				partNumber: 1,
				title: "Going Out",
				instructions:
					"Let's talk about going out.\n- How often do you go out? Why?\n- Who do you usually go out with? Why?\n- Where do you often go when you go out? Why?\nNow, let's talk about a special place you would always want to return to.\n- Can you describe that place?\n- Did you go there alone or with someone else?\n- What makes you want to return to that place?",
				speakingTime: 3,
			},
		],
	},
	{
		id: "speak-2",
		title: "Bài luyện nói số 2",
		topic: "Giáo dục & Nghề nghiệp",
		parts: [
			{
				partNumber: 1,
				title: "Daily Routine & Healthy Habits",
				instructions:
					"Let's talk about your daily routine.\n- What is your typical daily routine?\n- What do you usually do in the morning?\n- How do you spend your evenings?\nNow, let's talk about healthy habits.\n- What do you do to stay healthy?\n- Do you think young people today have healthy lifestyles? Why or why not?\n- What advice would you give to someone who wants to improve their health?",
				speakingTime: 3,
			},
		],
	},
	{
		id: "speak-3",
		title: "Bài luyện nói số 3",
		topic: "Giáo dục & Nghề nghiệp",
		parts: [
			{
				partNumber: 1,
				title: "Education & Future Plans",
				instructions:
					"Let's talk about education.\n- What are you studying at the moment?\n- Why did you choose this field of study?\n- What do you enjoy most about your studies?\nNow, let's talk about your future plans.\n- What do you plan to do after finishing your studies?\n- Where do you see yourself in five years?\n- What skills do you think are most important for your future career?",
				speakingTime: 3,
			},
		],
	},
	{
		id: "speak-4",
		topic: "Lối sống & Du lịch",
		title: "Bài luyện nói số 4",
		parts: [
			{
				partNumber: 1,
				title: "Holidays & TV Programs",
				instructions:
					"Let's talk about holidays.\n- What did you do on your last holiday?\n- Who do you prefer spending your holidays with?\n- Do you prefer going on holidays abroad?\nNow, let's talk about TV programs.\n- How many hours a day do you watch television?\n- What kinds of programs do you like?\n- Do you prefer watching television alone or with others? Why?",
				speakingTime: 3,
			},
		],
	},
	{
		id: "speak-5",
		topic: "Tài chính & Cuộc sống",
		title: "Bài luyện nói số 5",
		parts: [
			{
				partNumber: 1,
				title: "Lottery & Financial Decisions",
				instructions:
					"Situation: If you won a lottery of 1 billion VND, what would you do with the money? Three options are suggested: buying a new house, starting a business, and depositing the money in the bank. Which option do you think is the best choice? Why?",
				speakingTime: 3,
			},
		],
	},
	{
		id: "speak-6",
		topic: "Giáo dục & Nghề nghiệp",
		title: "Bài luyện nói số 6",
		parts: [
			{
				partNumber: 1,
				title: "Online Courses",
				instructions:
					"Topic: Online courses\n\nOnline courses provide new learning experiences, allow students to be independent in learning, and are more convenient to study.\n\nDiscuss the advantages of online courses.\n\nFollow-up questions:\n1. What are the advantages of online courses compared to traditional classes?\n2. What challenges do students face when learning online?\n3. How can online learning be improved in the future?",
				speakingTime: 4,
			},
		],
	},
	{
		id: "speak-7",
		topic: "Văn hóa & Lễ hội",
		title: "Bài luyện nói số 7",
		parts: [
			{
				partNumber: 1,
				title: "Traditional Festivals",
				instructions:
					"Topic: Traditional festivals carry important cultural values.\n\nTraditional festivals honor community strength, teach history and culture, and improve spiritual life.\n\nDiscuss why traditional festivals are important.\n\nFollow-up questions:\n1. Which local festival in your area or country would be most interesting for a foreign guest?\n2. Do people today appreciate public holidays as much as in the past?\n3. What should the government do to preserve traditional festivals?",
				speakingTime: 4,
			},
		],
	},
	{
		id: "speak-8",
		topic: "Văn hóa & Lễ hội",
		title: "Bài luyện nói số 8",
		parts: [
			{
				partNumber: 1,
				title: "Festival Roles",
				instructions:
					"Situation: Your town plans to organize an Open Festival and many visitors will attend. Three roles are suggested: a tour guide, a traffic instructor, and a master of ceremonies. Which role do you think would suit you best? Why?",
				speakingTime: 3,
			},
		],
	},
]
