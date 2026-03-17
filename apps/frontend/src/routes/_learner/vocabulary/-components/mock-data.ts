import {
	Airplane01Icon,
	Briefcase01Icon,
	Dumbbell01Icon,
	Globe02Icon,
	GraduationScrollIcon,
	Home01Icon,
	Leaf01Icon,
	MicroscopeIcon,
	PaintBoardIcon,
	Restaurant01Icon,
	Stethoscope02Icon,
} from "@hugeicons/core-free-icons"
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
	wordCount: number
	icon: IconSvgElement
	words: VocabWord[]
}

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

const HEALTH_WORDS: VocabWord[] = [
	{
		id: "diagnosis",
		word: "diagnosis",
		phonetic: "/ˌdaɪ.əɡˈnoʊ.sɪs/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The identification of the nature of an illness by examination of symptoms.",
		explanation: "Chẩn đoán, việc xác định bản chất bệnh qua xem xét triệu chứng.",
		examples: [
			"Early diagnosis of cancer significantly improves the chances of survival.",
			"The doctor made an accurate diagnosis after running several tests.",
		],
	},
	{
		id: "symptom",
		word: "symptom",
		phonetic: "/ˈsɪmp.təm/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A physical or mental sign that indicates the presence of a disease.",
		explanation: "Triệu chứng, dấu hiệu thể chất hoặc tinh thần cho thấy sự hiện diện của bệnh.",
		examples: [
			"Common symptoms of the flu include fever, cough, and body aches.",
			"She experienced no symptoms until the disease had progressed significantly.",
		],
	},
	{
		id: "prevention",
		word: "prevention",
		phonetic: "/prɪˈven.ʃən/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The action of stopping something from happening, especially illness.",
		explanation: "Phòng ngừa, hành động ngăn chặn điều gì đó xảy ra, đặc biệt là bệnh tật.",
		examples: [
			"Prevention is better than cure when it comes to lifestyle diseases.",
			"Vaccination is one of the most effective methods of disease prevention.",
		],
	},
	{
		id: "nutrition",
		word: "nutrition",
		phonetic: "/njuːˈtrɪʃ.ən/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The process of providing or obtaining the food necessary for health.",
		explanation: "Dinh dưỡng, quá trình cung cấp hoặc thu nhận thức ăn cần thiết cho sức khỏe.",
		examples: [
			"Good nutrition is essential for children's physical and mental development.",
			"The hospital provides nutrition counseling for patients with chronic diseases.",
		],
	},
	{
		id: "epidemic",
		word: "epidemic",
		phonetic: "/ˌep.ɪˈdem.ɪk/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A widespread occurrence of an infectious disease in a community.",
		explanation: "Dịch bệnh, sự bùng phát rộng rãi của bệnh truyền nhiễm trong cộng đồng.",
		examples: [
			"The government declared a state of emergency due to the cholera epidemic.",
			"Obesity has been described as an epidemic in many developed countries.",
		],
	},
	{
		id: "therapeutic",
		word: "therapeutic",
		phonetic: "/ˌθer.əˈpjuː.tɪk/",
		audioUrl: "",
		partOfSpeech: "adjective",
		definition: "Relating to the healing of disease or the restoration of health.",
		explanation: "Trị liệu, liên quan đến việc chữa bệnh hoặc phục hồi sức khỏe.",
		examples: [
			"Yoga and meditation have proven therapeutic benefits for stress reduction.",
			"The therapeutic effects of the new drug were confirmed in clinical trials.",
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

const WORK_WORDS: VocabWord[] = [
	{
		id: "recruitment",
		word: "recruitment",
		phonetic: "/rɪˈkruːt.mənt/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The process of finding and hiring new employees for an organization.",
		explanation: "Tuyển dụng, quá trình tìm kiếm và thuê nhân viên mới cho tổ chức.",
		examples: [
			"The company's recruitment drive attracted over 500 applicants.",
			"Online recruitment platforms have changed how employers find talent.",
		],
	},
	{
		id: "promotion",
		word: "promotion",
		phonetic: "/prəˈmoʊ.ʃən/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "Advancement to a higher position or rank in a workplace.",
		explanation: "Thăng chức, sự thăng tiến lên vị trí hoặc chức vụ cao hơn trong công việc.",
		examples: [
			"She earned a promotion to senior manager after three years of excellent performance.",
			"Promotion criteria should be transparent and based on measurable achievements.",
		],
	},
	{
		id: "collaborate",
		word: "collaborate",
		phonetic: "/kəˈlæb.ə.reɪt/",
		audioUrl: "",
		partOfSpeech: "verb",
		definition: "To work jointly with others on a shared activity or project.",
		explanation: "Hợp tác, cùng làm việc với người khác trong một hoạt động hoặc dự án chung.",
		examples: [
			"The two departments decided to collaborate on the new product launch.",
			"Remote tools make it easier for teams to collaborate across different time zones.",
		],
	},
	{
		id: "deadline",
		word: "deadline",
		phonetic: "/ˈded.laɪn/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The latest time or date by which something should be completed.",
		explanation: "Hạn chót, thời điểm cuối cùng mà công việc phải được hoàn thành.",
		examples: [
			"We need to finish the report before the Friday deadline.",
			"Missing a deadline can have serious consequences in a professional environment.",
		],
	},
	{
		id: "productivity",
		word: "productivity",
		phonetic: "/ˌprɒd.ʌkˈtɪv.ə.ti/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The efficiency of production, measured by output relative to input.",
		explanation: "Năng suất, hiệu quả sản xuất được đo bằng sản lượng so với nguồn lực đầu vào.",
		examples: [
			"The new software increased team productivity by 30 percent.",
			"Regular breaks can actually improve overall productivity during long working hours.",
		],
	},
	{
		id: "resign",
		word: "resign",
		phonetic: "/rɪˈzaɪn/",
		audioUrl: "",
		partOfSpeech: "verb",
		definition: "To voluntarily leave a job or position.",
		explanation: "Từ chức, tự nguyện rời bỏ công việc hoặc vị trí.",
		examples: [
			"He resigned from his position to pursue a career in academia.",
			"The minister was forced to resign after the scandal became public.",
		],
	},
]

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

const TECHNOLOGY_WORDS: VocabWord[] = [
	{
		id: "algorithm",
		word: "algorithm",
		phonetic: "/ˈæl.ɡə.rɪð.əm/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A set of rules or instructions followed to solve a problem or complete a task.",
		explanation: "Thuật toán, tập hợp quy tắc hoặc hướng dẫn để giải quyết vấn đề.",
		examples: [
			"Search engines use complex algorithms to rank web pages.",
			"The algorithm can process millions of data points in seconds.",
		],
	},
	{
		id: "cybersecurity",
		word: "cybersecurity",
		phonetic: "/ˌsaɪ.bə.sɪˈkjʊr.ə.ti/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The practice of protecting systems and networks from digital attacks.",
		explanation:
			"An ninh mạng, hoạt động bảo vệ hệ thống và mạng khỏi các cuộc tấn công kỹ thuật số.",
		examples: [
			"Companies invest heavily in cybersecurity to protect customer data.",
			"Cybersecurity threats are becoming more sophisticated every year.",
		],
	},
	{
		id: "innovation",
		word: "innovation",
		phonetic: "/ˌɪn.əˈveɪ.ʃən/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The introduction of new ideas, methods, or products.",
		explanation: "Đổi mới, sáng tạo, việc giới thiệu ý tưởng, phương pháp hoặc sản phẩm mới.",
		examples: [
			"Technological innovation has transformed the way we communicate.",
			"The company is known for its continuous innovation in software development.",
		],
	},
	{
		id: "automation",
		word: "automation",
		phonetic: "/ˌɔː.təˈmeɪ.ʃən/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The use of technology to perform tasks without human intervention.",
		explanation: "Tự động hóa, việc sử dụng công nghệ để thực hiện tác vụ mà không cần con người.",
		examples: [
			"Automation in manufacturing has increased efficiency and reduced costs.",
			"Many routine office tasks are now handled through automation.",
		],
	},
	{
		id: "bandwidth",
		word: "bandwidth",
		phonetic: "/ˈbænd.wɪdθ/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The capacity of a network to transmit data, measured in bits per second.",
		explanation: "Băng thông, khả năng truyền tải dữ liệu của mạng, đo bằng bit trên giây.",
		examples: [
			"Video streaming requires high bandwidth for smooth playback.",
			"The office upgraded its internet bandwidth to support remote meetings.",
		],
	},
	{
		id: "compatible",
		word: "compatible",
		phonetic: "/kəmˈpæt.ɪ.bəl/",
		audioUrl: "",
		partOfSpeech: "adjective",
		definition: "Able to exist or work together without conflict or problems.",
		explanation: "Tương thích, có khả năng tồn tại hoặc hoạt động cùng nhau mà không gây xung đột.",
		examples: [
			"Make sure the software is compatible with your operating system before installing.",
			"The new device is backward compatible with older accessories.",
		],
	},
]

const HOBBIES_WORDS: VocabWord[] = [
	{
		id: "leisure",
		word: "leisure",
		phonetic: "/ˈleʒ.ər/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "Free time when one is not working or occupied with duties.",
		explanation: "Thời gian rảnh rỗi, khoảng thời gian không phải làm việc hay bận rộn.",
		examples: [
			"She spends her leisure time reading novels and gardening.",
			"The city offers many leisure activities for residents of all ages.",
		],
	},
	{
		id: "passionate",
		word: "passionate",
		phonetic: "/ˈpæʃ.ən.ət/",
		audioUrl: "",
		partOfSpeech: "adjective",
		definition: "Showing or caused by strong feelings or enthusiasm.",
		explanation: "Đam mê, nhiệt huyết, thể hiện cảm xúc mạnh mẽ hoặc sự hào hứng.",
		examples: [
			"He is passionate about photography and spends every weekend taking pictures.",
			"A passionate teacher can inspire students to love learning.",
		],
	},
	{
		id: "amateur",
		word: "amateur",
		phonetic: "/ˈæm.ə.tʃər/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A person who engages in an activity for enjoyment rather than professionally.",
		explanation:
			"Người nghiệp dư, người tham gia hoạt động vì sở thích chứ không phải chuyên nghiệp.",
		examples: [
			"The photography contest is open to both amateurs and professionals.",
			"As an amateur painter, she still produces remarkably beautiful artwork.",
		],
	},
	{
		id: "recreation",
		word: "recreation",
		phonetic: "/ˌrek.riˈeɪ.ʃən/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "Activity done for enjoyment when one is not working.",
		explanation: "Giải trí, hoạt động thực hiện vì niềm vui khi không làm việc.",
		examples: [
			"The park provides excellent facilities for outdoor recreation.",
			"Reading and playing chess are his favorite forms of recreation.",
		],
	},
	{
		id: "craft",
		word: "craft",
		phonetic: "/krɑːft/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "An activity involving skill in making things by hand.",
		explanation: "Thủ công, hoạt động đòi hỏi kỹ năng làm đồ bằng tay.",
		examples: [
			"Traditional crafts like pottery and weaving are being revived by young artisans.",
			"She took up paper craft as a relaxing hobby during the weekends.",
		],
	},
	{
		id: "devote",
		word: "devote",
		phonetic: "/dɪˈvoʊt/",
		audioUrl: "",
		partOfSpeech: "verb",
		definition: "To give all or a large part of one's time or resources to something.",
		explanation: "Cống hiến, dành toàn bộ hoặc phần lớn thời gian cho một việc gì đó.",
		examples: [
			"He devotes every Sunday to volunteering at the local animal shelter.",
			"She decided to devote more time to her music after retirement.",
		],
	},
]

const DAILY_LIFE_WORDS: VocabWord[] = [
	{
		id: "routine",
		word: "routine",
		phonetic: "/ruːˈtiːn/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A regular sequence of actions or activities followed daily.",
		explanation: "Thói quen hàng ngày, chuỗi hành động được thực hiện đều đặn.",
		examples: [
			"Establishing a morning routine can improve your productivity throughout the day.",
			"Her daily routine includes jogging, reading, and cooking dinner.",
		],
	},
	{
		id: "commute",
		word: "commute",
		phonetic: "/kəˈmjuːt/",
		audioUrl: "",
		partOfSpeech: "verb",
		definition: "To travel regularly between one's home and workplace.",
		explanation: "Đi lại hàng ngày, di chuyển thường xuyên giữa nhà và nơi làm việc.",
		examples: [
			"She commutes by train to work every day, which takes about 45 minutes.",
			"More people are choosing to cycle rather than commute by car.",
		],
	},
	{
		id: "errand",
		word: "errand",
		phonetic: "/ˈer.ənd/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A short trip taken to do a specific task, usually outside the home.",
		explanation: "Công việc vặt, chuyến đi ngắn để thực hiện một nhiệm vụ cụ thể bên ngoài.",
		examples: [
			"I need to run a few errands before the shops close.",
			"She spent the entire morning doing errands around the neighborhood.",
		],
	},
	{
		id: "household",
		word: "household",
		phonetic: "/ˈhaʊs.hoʊld/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A house and its occupants regarded as a unit; domestic affairs.",
		explanation: "Hộ gia đình, một ngôi nhà và các thành viên sống trong đó.",
		examples: [
			"Household expenses have risen sharply due to inflation.",
			"Sharing household chores equally is important in a modern family.",
		],
	},
	{
		id: "convenient",
		word: "convenient",
		phonetic: "/kənˈviː.ni.ənt/",
		audioUrl: "",
		partOfSpeech: "adjective",
		definition: "Fitting in well with a person's needs, activities, and plans.",
		explanation: "Thuận tiện, phù hợp với nhu cầu, hoạt động và kế hoạch của người ta.",
		examples: [
			"Online shopping is convenient because you can buy things from home.",
			"The apartment is in a convenient location, close to schools and supermarkets.",
		],
	},
	{
		id: "budget",
		word: "budget",
		phonetic: "/ˈbʌdʒ.ɪt/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "An estimate of income and expenditure for a set period of time.",
		explanation: "Ngân sách, ước tính thu nhập và chi tiêu cho một khoảng thời gian nhất định.",
		examples: [
			"We need to stick to our monthly budget to save for the vacation.",
			"The government announced a new budget with increased spending on healthcare.",
		],
	},
]

const FOOD_WORDS: VocabWord[] = [
	{
		id: "cuisine",
		word: "cuisine",
		phonetic: "/kwɪˈziːn/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A style or method of cooking, especially as characteristic of a country.",
		explanation: "Ẩm thực, phong cách nấu ăn đặc trưng của một quốc gia hoặc vùng miền.",
		examples: [
			"Vietnamese cuisine is famous for its fresh ingredients and balanced flavors.",
			"Italian cuisine includes popular dishes like pasta, pizza, and risotto.",
		],
	},
	{
		id: "ingredient",
		word: "ingredient",
		phonetic: "/ɪnˈɡriː.di.ənt/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "Any of the foods or substances combined to make a dish.",
		explanation: "Nguyên liệu, thành phần thực phẩm được kết hợp để tạo nên một món ăn.",
		examples: [
			"Fresh ingredients are the key to making a delicious salad.",
			"The recipe requires only five simple ingredients.",
		],
	},
	{
		id: "appetizer",
		word: "appetizer",
		phonetic: "/ˈæp.ə.taɪ.zər/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A small dish served before the main course to stimulate appetite.",
		explanation: "Món khai vị, món ăn nhỏ được phục vụ trước món chính để kích thích khẩu vị.",
		examples: [
			"Spring rolls are a popular appetizer in many Asian restaurants.",
			"We ordered some appetizers while waiting for the main course.",
		],
	},
	{
		id: "organic",
		word: "organic",
		phonetic: "/ɔːˈɡæn.ɪk/",
		audioUrl: "",
		partOfSpeech: "adjective",
		definition: "Produced without the use of artificial chemicals or pesticides.",
		explanation: "Hữu cơ, được sản xuất mà không sử dụng hóa chất hay thuốc trừ sâu nhân tạo.",
		examples: [
			"Organic vegetables are more expensive but considered healthier.",
			"The demand for organic food products has grown significantly in recent years.",
		],
	},
	{
		id: "delicacy",
		word: "delicacy",
		phonetic: "/ˈdel.ɪ.kə.si/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A type of food considered rare, expensive, or luxurious.",
		explanation: "Đặc sản, món ăn được coi là quý hiếm, đắt tiền hoặc sang trọng.",
		examples: [
			"Caviar is considered a delicacy in many Western countries.",
			"Each region of Vietnam has its own unique delicacies.",
		],
	},
	{
		id: "savor",
		word: "savor",
		phonetic: "/ˈseɪ.vər/",
		audioUrl: "",
		partOfSpeech: "verb",
		definition: "To enjoy food or an experience slowly in order to appreciate it fully.",
		explanation: "Thưởng thức, tận hưởng chậm rãi để cảm nhận trọn vẹn.",
		examples: [
			"Take your time to savor each bite of this homemade chocolate cake.",
			"She savored the moment of receiving her graduation certificate.",
		],
	},
]

const SPORTS_WORDS: VocabWord[] = [
	{
		id: "endurance",
		word: "endurance",
		phonetic: "/ɪnˈdjʊr.əns/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The ability to withstand prolonged physical or mental effort.",
		explanation: "Sức bền, khả năng chịu đựng nỗ lực thể chất hoặc tinh thần kéo dài.",
		examples: [
			"Marathon running requires exceptional endurance and mental strength.",
			"Swimming is an excellent exercise for building endurance.",
		],
	},
	{
		id: "tournament",
		word: "tournament",
		phonetic: "/ˈtʊr.nə.mənt/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A series of contests or matches between competitors in a sport.",
		explanation: "Giải đấu, chuỗi các trận thi đấu giữa các đối thủ trong một môn thể thao.",
		examples: [
			"The tennis tournament attracted players from over 30 countries.",
			"Our school won first place in the regional basketball tournament.",
		],
	},
	{
		id: "sportsmanship",
		word: "sportsmanship",
		phonetic: "/ˈspɔːrts.mən.ʃɪp/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "Fair and generous behavior in sports competition.",
		explanation: "Tinh thần thể thao, hành vi công bằng và cao thượng trong thi đấu.",
		examples: [
			"Good sportsmanship means respecting your opponent whether you win or lose.",
			"The player was praised for her outstanding sportsmanship during the match.",
		],
	},
	{
		id: "opponent",
		word: "opponent",
		phonetic: "/əˈpoʊ.nənt/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A person who competes against another in a contest or game.",
		explanation: "Đối thủ, người thi đấu chống lại người khác trong cuộc thi hoặc trò chơi.",
		examples: [
			"She studied her opponent's strategy before the chess match.",
			"The boxer knocked out his opponent in the third round.",
		],
	},
	{
		id: "athlete",
		word: "athlete",
		phonetic: "/ˈæθ.liːt/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A person who is proficient in sports and physical exercises.",
		explanation: "Vận động viên, người giỏi trong các môn thể thao và bài tập thể chất.",
		examples: [
			"Professional athletes train for several hours every day.",
			"The young athlete broke the national record in the 100-meter sprint.",
		],
	},
	{
		id: "stamina",
		word: "stamina",
		phonetic: "/ˈstæm.ɪ.nə/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The physical or mental ability to sustain prolonged effort.",
		explanation: "Thể lực, khả năng duy trì nỗ lực trong thời gian dài.",
		examples: [
			"Long-distance runners need excellent stamina to complete a race.",
			"Regular exercise helps improve both stamina and overall fitness.",
		],
	},
]

const CULTURE_WORDS: VocabWord[] = [
	{
		id: "heritage",
		word: "heritage",
		phonetic: "/ˈher.ɪ.tɪdʒ/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "Valued traditions, customs, or properties passed down through generations.",
		explanation:
			"Di sản, truyền thống, phong tục hoặc tài sản có giá trị được truyền qua các thế hệ.",
		examples: [
			"The ancient temples are an important part of the country's cultural heritage.",
			"UNESCO works to protect world heritage sites from destruction.",
		],
	},
	{
		id: "tradition",
		word: "tradition",
		phonetic: "/trəˈdɪʃ.ən/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A custom or belief passed down within a group or society over time.",
		explanation:
			"Truyền thống, phong tục hoặc niềm tin được lưu truyền trong cộng đồng qua thời gian.",
		examples: [
			"Wearing ao dai on Tet is a beautiful Vietnamese tradition.",
			"The tradition of afternoon tea is deeply rooted in British culture.",
		],
	},
	{
		id: "diverse",
		word: "diverse",
		phonetic: "/daɪˈvɜːrs/",
		audioUrl: "",
		partOfSpeech: "adjective",
		definition: "Showing a great deal of variety; very different from each other.",
		explanation: "Đa dạng, thể hiện sự khác biệt phong phú.",
		examples: [
			"Vietnam has a diverse culture with 54 ethnic groups.",
			"A diverse team brings different perspectives and creative solutions.",
		],
	},
	{
		id: "ceremony",
		word: "ceremony",
		phonetic: "/ˈser.ə.moʊ.ni/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A formal event performed on a special occasion, often with rituals.",
		explanation: "Lễ, nghi lễ, sự kiện trang trọng được tổ chức vào dịp đặc biệt.",
		examples: [
			"The wedding ceremony was held at a beautiful seaside resort.",
			"The opening ceremony of the festival featured traditional music and dance.",
		],
	},
	{
		id: "folklore",
		word: "folklore",
		phonetic: "/ˈfoʊk.lɔːr/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "The traditional beliefs, stories, and customs of a community.",
		explanation: "Văn hóa dân gian, truyền thuyết, câu chuyện và phong tục truyền thống.",
		examples: [
			"Vietnamese folklore is rich with legends about heroes and mythical creatures.",
			"The study of folklore helps us understand ancient societies.",
		],
	},
	{
		id: "preserve",
		word: "preserve",
		phonetic: "/prɪˈzɜːrv/",
		audioUrl: "",
		partOfSpeech: "verb",
		definition: "To maintain something in its original or existing state.",
		explanation: "Bảo tồn, duy trì thứ gì đó ở trạng thái ban đầu hoặc hiện tại.",
		examples: [
			"It is important to preserve traditional crafts for future generations.",
			"The museum works to preserve historical artifacts and documents.",
		],
	},
]

const SCIENCE_WORDS: VocabWord[] = [
	{
		id: "hypothesis",
		word: "hypothesis",
		phonetic: "/haɪˈpɒθ.ə.sɪs/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A proposed explanation made as a starting point for further investigation.",
		explanation: "Giả thuyết, lời giải thích được đề xuất làm điểm khởi đầu cho nghiên cứu.",
		examples: [
			"The scientist tested her hypothesis through a series of experiments.",
			"A good hypothesis should be testable and based on existing knowledge.",
		],
	},
	{
		id: "experiment",
		word: "experiment",
		phonetic: "/ɪkˈsper.ɪ.mənt/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A scientific procedure carried out to test a hypothesis or discover something.",
		explanation: "Thí nghiệm, quy trình khoa học được thực hiện để kiểm tra giả thuyết.",
		examples: [
			"The chemistry experiment produced unexpected but fascinating results.",
			"Students are required to design and conduct their own experiments.",
		],
	},
	{
		id: "phenomenon",
		word: "phenomenon",
		phonetic: "/fəˈnɒm.ɪ.nən/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition:
			"A fact or event that is observed to exist or happen, especially one whose cause is in question.",
		explanation: "Hiện tượng, sự kiện được quan sát, đặc biệt khi nguyên nhân còn chưa rõ.",
		examples: [
			"The Northern Lights is a natural phenomenon that attracts tourists worldwide.",
			"Scientists are studying this phenomenon to understand its underlying causes.",
		],
	},
	{
		id: "analyze",
		word: "analyze",
		phonetic: "/ˈæn.ə.laɪz/",
		audioUrl: "",
		partOfSpeech: "verb",
		definition: "To examine something in detail in order to understand or explain it.",
		explanation: "Phân tích, xem xét chi tiết để hiểu hoặc giải thích một điều gì đó.",
		examples: [
			"Researchers analyzed the data collected from over 10,000 participants.",
			"The report analyzes the impact of climate change on coastal cities.",
		],
	},
	{
		id: "theory",
		word: "theory",
		phonetic: "/ˈθɪr.i/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "A system of ideas intended to explain something, based on evidence and reasoning.",
		explanation: "Lý thuyết, hệ thống ý tưởng nhằm giải thích điều gì đó dựa trên bằng chứng.",
		examples: [
			"Darwin's theory of evolution changed the way we understand biology.",
			"The theory was supported by decades of experimental evidence.",
		],
	},
	{
		id: "evidence",
		word: "evidence",
		phonetic: "/ˈev.ɪ.dəns/",
		audioUrl: "",
		partOfSpeech: "noun",
		definition: "Facts or information indicating whether a belief or proposition is true.",
		explanation:
			"Bằng chứng, dữ kiện hoặc thông tin cho thấy một niềm tin hay mệnh đề đúng hay sai.",
		examples: [
			"There is strong evidence that regular exercise reduces the risk of heart disease.",
			"The detective gathered evidence from the crime scene.",
		],
	},
]

export const POPULAR_TOPIC_IDS = new Set([
	"education",
	"health",
	"environment",
	"work",
	"travel",
	"technology",
	"hobbies",
	"daily-life",
])

export const VOCAB_TOPICS: VocabTopic[] = [
	{
		id: "education",
		name: "Education & Learning",
		description: "Từ vựng về giáo dục, học tập và môi trường học thuật.",
		wordCount: EDUCATION_WORDS.length,
		icon: GraduationScrollIcon,
		words: EDUCATION_WORDS,
	},
	{
		id: "health",
		name: "Health & Wellness",
		description: "Từ vựng về sức khỏe, y tế và lối sống lành mạnh.",
		wordCount: HEALTH_WORDS.length,
		icon: Stethoscope02Icon,
		words: HEALTH_WORDS,
	},
	{
		id: "environment",
		name: "Environment & Nature",
		description: "Từ vựng về môi trường, thiên nhiên và phát triển bền vững.",
		wordCount: ENVIRONMENT_WORDS.length,
		icon: Leaf01Icon,
		words: ENVIRONMENT_WORDS,
	},
	{
		id: "work",
		name: "Work & Career",
		description: "Từ vựng về công việc, nghề nghiệp và môi trường làm việc.",
		wordCount: WORK_WORDS.length,
		icon: Briefcase01Icon,
		words: WORK_WORDS,
	},
	{
		id: "travel",
		name: "Travel & Tourism",
		description: "Từ vựng về du lịch, di chuyển và khám phá các địa điểm mới.",
		wordCount: TRAVEL_WORDS.length,
		icon: Airplane01Icon,
		words: TRAVEL_WORDS,
	},
	{
		id: "technology",
		name: "Technology & Digital",
		description: "Từ vựng về công nghệ, kỹ thuật số và đổi mới sáng tạo.",
		wordCount: TECHNOLOGY_WORDS.length,
		icon: Globe02Icon,
		words: TECHNOLOGY_WORDS,
	},
	{
		id: "hobbies",
		name: "Hobbies & Interests",
		description: "Từ vựng về sở thích, giải trí và các hoạt động thú vị.",
		wordCount: HOBBIES_WORDS.length,
		icon: PaintBoardIcon,
		words: HOBBIES_WORDS,
	},
	{
		id: "daily-life",
		name: "Daily Life",
		description: "Từ vựng về cuộc sống hàng ngày, sinh hoạt và thói quen.",
		wordCount: DAILY_LIFE_WORDS.length,
		icon: Home01Icon,
		words: DAILY_LIFE_WORDS,
	},
	{
		id: "food",
		name: "Food & Cuisine",
		description: "Từ vựng về ẩm thực, nấu ăn và văn hóa ăn uống.",
		wordCount: FOOD_WORDS.length,
		icon: Restaurant01Icon,
		words: FOOD_WORDS,
	},
	{
		id: "sports",
		name: "Sports & Fitness",
		description: "Từ vựng về thể thao, rèn luyện thể chất và thi đấu.",
		wordCount: SPORTS_WORDS.length,
		icon: Dumbbell01Icon,
		words: SPORTS_WORDS,
	},
	{
		id: "culture",
		name: "Culture & Society",
		description: "Từ vựng về văn hóa, xã hội, phong tục và truyền thống.",
		wordCount: CULTURE_WORDS.length,
		icon: Globe02Icon,
		words: CULTURE_WORDS,
	},
	{
		id: "science",
		name: "Science & Research",
		description: "Từ vựng về khoa học, nghiên cứu và phương pháp khoa học.",
		wordCount: SCIENCE_WORDS.length,
		icon: MicroscopeIcon,
		words: SCIENCE_WORDS,
	},
]

export function getMockTopic(topicId: string): VocabTopic | undefined {
	return VOCAB_TOPICS.find((t) => t.id === topicId)
}
