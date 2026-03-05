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
]

export const READING_EXAMS: ReadingExam[] = [
	{
		id: "read-1",
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
]

export const WRITING_EXAMS: WritingExam[] = [
	{
		id: "write-1",
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
]

export const SPEAKING_EXAMS: SpeakingExam[] = [
	{
		id: "speak-1",
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
]
