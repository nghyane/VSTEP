import { AirplaneTakeOff01Icon, GraduationScrollIcon, Leaf01Icon } from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

export type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "phrase"

export interface VocabWord {
	id: string
	word: string
	phonetic: string
	audioUrl: string
	partOfSpeech: PartOfSpeech
	definition: string
	explanation: string
	examples: string[]
}

export interface VocabTopic {
	id: string
	name: string
	description: string
	icon: IconSvgElement
	wordCount: number
	words: VocabWord[]
}

const TRAVEL_WORDS: VocabWord[] = [
	{
		id: "itinerary",
		word: "itinerary",
		phonetic: "/aɪˈtɪn.ə.rer.i/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A planned route or journey, including a list of places to visit.",
		explanation: "Lịch trình, kế hoạch chi tiết cho chuyến đi bao gồm các điểm đến và hoạt động.",
		examples: [
			"We planned our itinerary carefully before the trip to Europe.",
			"The travel agent provided a detailed itinerary for the seven-day tour.",
		],
	},
	{
		id: "accommodation",
		word: "accommodation",
		phonetic: "/əˌkɒm.əˈdeɪ.ʃən/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A place to stay, such as a hotel or rented apartment, during travel.",
		explanation: "Chỗ ở, nơi lưu trú khi đi du lịch hoặc công tác.",
		examples: [
			"Finding affordable accommodation in the city center can be challenging.",
			"The accommodation included breakfast and free Wi-Fi.",
		],
	},
	{
		id: "destination",
		word: "destination",
		phonetic: "/ˌdes.tɪˈneɪ.ʃən/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The place to which someone or something is going or being sent.",
		explanation: "Điểm đến, nơi mà người ta hướng tới trong chuyến đi.",
		examples: [
			"Paris remains one of the most popular tourist destinations in the world.",
			"We arrived at our destination after a twelve-hour flight.",
		],
	},
	{
		id: "embark",
		word: "embark",
		phonetic: "/ɪmˈbɑːk/",
		audioUrl: "",
		partOfSpeech: "verb",
		definition: "To begin a journey or undertake a new project or activity.",
		explanation: "Bắt đầu một chuyến đi hoặc khởi sự một dự án, hoạt động mới.",
		examples: [
			"They embarked on a three-month backpacking trip across Southeast Asia.",
			"She decided to embark on a new career in travel writing.",
		],
	},
	{
		id: "excursion",
		word: "excursion",
		phonetic: "/ɪkˈskɜː.ʃən/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A short trip or outing, typically for leisure or educational purposes.",
		explanation: "Chuyến tham quan ngắn, thường nhằm mục đích giải trí hoặc học tập.",
		examples: [
			"The hotel offers daily excursions to nearby islands.",
			"We booked an excursion to the ancient ruins outside the city.",
		],
	},
	{
		id: "scenic",
		word: "scenic",
		phonetic: "/ˈsiː.nɪk/",
		audioUrl: "",
		partOfSpeech: "adjective",
		definition: "Providing or relating to beautiful views of natural scenery.",
		explanation: "Có phong cảnh đẹp, liên quan đến cảnh quan thiên nhiên tuyệt đẹp.",
		examples: [
			"We took the scenic route along the coastline instead of the highway.",
			"The scenic beauty of the mountain region attracts thousands of visitors every year.",
		],
	},
]

const EDUCATION_WORDS: VocabWord[] = [
	{
		id: "curriculum",
		word: "curriculum",
		phonetic: "/kəˈrɪk.jə.ləm/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The subjects and content taught in a school or educational program.",
		explanation: "Chương trình giảng dạy, bao gồm các môn học và nội dung được dạy trong trường.",
		examples: [
			"The national curriculum has been updated to include digital literacy skills.",
			"Students must complete all courses in the curriculum to graduate.",
		],
	},
	{
		id: "enrollment",
		word: "enrollment",
		phonetic: "/ɪnˈroʊl.mənt/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The act of officially joining a course, school, or program.",
		explanation: "Việc đăng ký, ghi danh chính thức vào một khóa học, trường hoặc chương trình.",
		examples: [
			"Enrollment for the fall semester begins in August.",
			"The university reported a significant increase in enrollment this year.",
		],
	},
	{
		id: "assessment",
		word: "assessment",
		phonetic: "/əˈses.mənt/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The process of evaluating or measuring someone's abilities or knowledge.",
		explanation: "Quá trình đánh giá, kiểm tra năng lực hoặc kiến thức của ai đó.",
		examples: [
			"Continuous assessment is used alongside final exams to evaluate students.",
			"The teacher conducted an assessment to identify areas where students need improvement.",
		],
	},
	{
		id: "proficiency",
		word: "proficiency",
		phonetic: "/prəˈfɪʃ.ən.si/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A high degree of skill or competence in a particular area.",
		explanation: "Trình độ thành thạo, năng lực cao trong một lĩnh vực cụ thể.",
		examples: [
			"Applicants must demonstrate proficiency in at least two foreign languages.",
			"Her proficiency in mathematics earned her a place in the advanced class.",
		],
	},
	{
		id: "pedagogy",
		word: "pedagogy",
		phonetic: "/ˈped.ə.ɡɒdʒ.i/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The method and practice of teaching, especially as an academic subject.",
		explanation: "Phương pháp sư phạm, nghệ thuật và khoa học giảng dạy.",
		examples: [
			"Modern pedagogy emphasizes student-centered learning approaches.",
			"The conference focused on innovative pedagogy in higher education.",
		],
	},
	{
		id: "scholarship",
		word: "scholarship",
		phonetic: "/ˈskɒl.ə.ʃɪp/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "Financial aid awarded to a student based on academic achievement or need.",
		explanation: "Học bổng, khoản hỗ trợ tài chính dành cho sinh viên dựa trên thành tích học tập.",
		examples: [
			"She received a full scholarship to study abroad at Oxford University.",
			"The scholarship covers tuition fees, accommodation, and living expenses.",
		],
	},
]

const ENVIRONMENT_WORDS: VocabWord[] = [
	{
		id: "sustainability",
		word: "sustainability",
		phonetic: "/səˌsteɪ.nəˈbɪl.ə.ti/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The ability to maintain ecological balance without depleting natural resources.",
		explanation: "Tính bền vững, khả năng duy trì cân bằng sinh thái mà không cạn kiệt tài nguyên.",
		examples: [
			"Sustainability should be at the core of every government policy on development.",
			"The company adopted sustainability practices to reduce its carbon footprint.",
		],
	},
	{
		id: "ecosystem",
		word: "ecosystem",
		phonetic: "/ˈiː.koʊˌsɪs.təm/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A biological community of interacting organisms and their physical environment.",
		explanation: "Hệ sinh thái, cộng đồng sinh vật tương tác với nhau và với môi trường vật lý.",
		examples: [
			"Coral reefs are among the most diverse ecosystems on Earth.",
			"Human activities have disrupted the natural balance of many ecosystems.",
		],
	},
	{
		id: "conservation",
		word: "conservation",
		phonetic: "/ˌkɒn.səˈveɪ.ʃən/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The protection and preservation of natural environments and wildlife.",
		explanation: "Bảo tồn, việc bảo vệ và gìn giữ môi trường tự nhiên và động vật hoang dã.",
		examples: [
			"Conservation efforts have helped increase the population of endangered species.",
			"The government established new conservation areas to protect the rainforest.",
		],
	},
	{
		id: "biodiversity",
		word: "biodiversity",
		phonetic: "/ˌbaɪ.oʊ.daɪˈvɜː.sə.ti/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The variety of plant and animal life in a particular habitat or ecosystem.",
		explanation: "Đa dạng sinh học, sự phong phú của các loài động thực vật trong một môi trường.",
		examples: [
			"Tropical rainforests are known for their extraordinary biodiversity.",
			"Loss of biodiversity threatens the stability of ecosystems worldwide.",
		],
	},
	{
		id: "renewable",
		word: "renewable",
		phonetic: "/rɪˈnjuː.ə.bəl/",
		audioUrl: "",
		partOfSpeech: "adjective",
		definition: "Capable of being replenished naturally over time, not permanently depleted.",
		explanation: "Tái tạo được, có khả năng phục hồi tự nhiên theo thời gian.",
		examples: [
			"Solar and wind power are examples of renewable energy sources.",
			"Investing in renewable resources is essential for a sustainable future.",
		],
	},
	{
		id: "deforestation",
		word: "deforestation",
		phonetic: "/diːˌfɒr.ɪˈsteɪ.ʃən/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The clearing or removal of forests, typically for agricultural or urban use.",
		explanation:
			"Phá rừng, việc chặt phá hoặc loại bỏ rừng để phục vụ nông nghiệp hoặc đô thị hóa.",
		examples: [
			"Deforestation in the Amazon has accelerated at an alarming rate.",
			"Illegal logging is one of the primary causes of deforestation in Southeast Asia.",
		],
	},
]

export const VOCAB_TOPICS: VocabTopic[] = [
	{
		id: "travel",
		name: "Travel & Tourism",
		description: "Từ vựng về du lịch, di chuyển và khám phá các địa điểm mới.",
		icon: AirplaneTakeOff01Icon,
		wordCount: TRAVEL_WORDS.length,
		words: TRAVEL_WORDS,
	},
	{
		id: "education",
		name: "Education & Learning",
		description: "Từ vựng về giáo dục, học tập và môi trường học thuật.",
		icon: GraduationScrollIcon,
		wordCount: EDUCATION_WORDS.length,
		words: EDUCATION_WORDS,
	},
	{
		id: "environment",
		name: "Environment & Nature",
		description: "Từ vựng về môi trường, thiên nhiên và phát triển bền vững.",
		icon: Leaf01Icon,
		wordCount: ENVIRONMENT_WORDS.length,
		words: ENVIRONMENT_WORDS,
	},
]
