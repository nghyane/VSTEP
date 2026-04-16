// Mock vocabulary data — 6 chủ đề chia đều 3 cấp độ.
// Khi có API thật: xóa file này, sửa queryFn trong lib/queries/vocabulary.ts

export type VocabLevel = "level_1" | "level_2" | "level_3"

export interface VocabWord {
	id: string
	word: string
	phonetic: string
	partOfSpeech: string
	definition: string
	example: string
}

export interface VocabTopic {
	id: string
	name: string
	description: string
	level: VocabLevel
	iconKey: "family" | "sun" | "briefcase" | "heart" | "leaf" | "graduation"
	words: VocabWord[]
}

// Helper để sinh id ngắn gọn từ slug topic + word.
function w(
	topicId: string,
	word: string,
	phonetic: string,
	partOfSpeech: string,
	definition: string,
	example: string,
): VocabWord {
	const slug = word.toLowerCase().replace(/[^a-z0-9]+/g, "-")
	return { id: `${topicId}:${slug}`, word, phonetic, partOfSpeech, definition, example }
}

// ─── Cấp 1 ─────────────────────────────────────────────────────────

const FAMILY: VocabTopic = {
	id: "family-relationships",
	name: "Gia đình & Mối quan hệ",
	description: "Từ vựng về thành viên gia đình và các mối quan hệ thường ngày.",
	level: "level_1",
	iconKey: "family",
	words: [
		w("fam", "relative", "/ˈrelətɪv/", "n", "người thân, họ hàng", "My relatives live in Hanoi."),
		w("fam", "sibling", "/ˈsɪblɪŋ/", "n", "anh/chị/em ruột", "I have two siblings."),
		w("fam", "spouse", "/spaʊs/", "n", "vợ hoặc chồng", "Her spouse works abroad."),
		w("fam", "parent", "/ˈpeərənt/", "n", "cha hoặc mẹ", "Both my parents are teachers."),
		w("fam", "nephew", "/ˈnefjuː/", "n", "cháu trai", "My nephew is ten years old."),
		w("fam", "niece", "/niːs/", "n", "cháu gái", "Her niece just started school."),
		w("fam", "close", "/kləʊs/", "adj", "thân thiết", "We are very close friends."),
		w("fam", "raise", "/reɪz/", "v", "nuôi dạy", "They raised three children."),
		w("fam", "support", "/səˈpɔːt/", "v", "hỗ trợ", "Families should support each other."),
		w("fam", "quarrel", "/ˈkwɒrəl/", "v", "cãi vã", "They rarely quarrel."),
	],
}

const DAILY: VocabTopic = {
	id: "daily-routines",
	name: "Sinh hoạt hằng ngày",
	description: "Các hoạt động và thói quen trong ngày.",
	level: "level_1",
	iconKey: "sun",
	words: [
		w(
			"day",
			"routine",
			"/ruːˈtiːn/",
			"n",
			"thói quen, lịch sinh hoạt",
			"I have a strict morning routine.",
		),
		w("day", "commute", "/kəˈmjuːt/", "v", "đi lại đến nơi làm việc", "She commutes by bus."),
		w("day", "chore", "/tʃɔː/", "n", "việc vặt trong nhà", "Doing chores is part of life."),
		w(
			"day",
			"errand",
			"/ˈerənd/",
			"n",
			"việc lặt vặt cần làm ngoài",
			"I need to run some errands.",
		),
		w("day", "nap", "/næp/", "n", "giấc ngủ ngắn", "I take a short nap after lunch."),
		w(
			"day",
			"leisure",
			"/ˈleʒə/",
			"n",
			"thời gian rảnh rỗi",
			"Reading is my favorite leisure activity.",
		),
		w("day", "commuter", "/kəˈmjuːtə/", "n", "người đi làm xa", "The train is full of commuters."),
		w("day", "tidy", "/ˈtaɪdi/", "v", "dọn dẹp gọn gàng", "Please tidy your room."),
		w("day", "grocery", "/ˈɡrəʊsəri/", "n", "hàng tạp hóa", "I go grocery shopping on Sundays."),
		w("day", "laundry", "/ˈlɔːndri/", "n", "giặt giũ", "I do the laundry twice a week."),
	],
}

// ─── Cấp 2 ─────────────────────────────────────────────────────────

const WORK: VocabTopic = {
	id: "work-career",
	name: "Công việc & Sự nghiệp",
	description: "Thuật ngữ cơ bản về công việc, nghề nghiệp và môi trường văn phòng.",
	level: "level_2",
	iconKey: "briefcase",
	words: [
		w("wrk", "colleague", "/ˈkɒliːɡ/", "n", "đồng nghiệp", "My colleagues are very supportive."),
		w("wrk", "deadline", "/ˈdedlaɪn/", "n", "hạn chót", "We are rushing to meet the deadline."),
		w("wrk", "promotion", "/prəˈməʊʃən/", "n", "sự thăng chức", "She got a promotion last month."),
		w("wrk", "resign", "/rɪˈzaɪn/", "v", "xin nghỉ việc", "He resigned to start his own business."),
		w("wrk", "overtime", "/ˈəʊvətaɪm/", "n", "làm thêm giờ", "Working overtime is exhausting."),
		w("wrk", "negotiate", "/nɪˈɡəʊʃieɪt/", "v", "thương lượng", "We negotiated a better salary."),
		w(
			"wrk",
			"freelance",
			"/ˈfriːlɑːns/",
			"adj",
			"tự do, làm độc lập",
			"She works as a freelance designer.",
		),
		w("wrk", "workload", "/ˈwɜːkləʊd/", "n", "khối lượng công việc", "My workload has doubled."),
		w("wrk", "skillset", "/ˈskɪlset/", "n", "bộ kỹ năng", "Her skillset is impressive."),
		w("wrk", "mentor", "/ˈmentɔː/", "n", "người hướng dẫn", "He is my career mentor."),
	],
}

const HEALTH: VocabTopic = {
	id: "health-fitness",
	name: "Sức khỏe & Thể chất",
	description: "Từ vựng về rèn luyện sức khỏe, dinh dưỡng và lối sống.",
	level: "level_2",
	iconKey: "heart",
	words: [
		w("hth", "nutrition", "/njuːˈtrɪʃən/", "n", "dinh dưỡng", "Good nutrition is key to health."),
		w("hth", "workout", "/ˈwɜːkaʊt/", "n", "buổi tập luyện", "I do a workout every morning."),
		w("hth", "injury", "/ˈɪndʒəri/", "n", "chấn thương", "He recovered from a knee injury."),
		w("hth", "stamina", "/ˈstæmɪnə/", "n", "sức bền", "Running builds stamina."),
		w("hth", "recover", "/rɪˈkʌvə/", "v", "hồi phục", "She recovered quickly from the flu."),
		w("hth", "immune", "/ɪˈmjuːn/", "adj", "miễn dịch", "Vitamin C boosts the immune system."),
		w("hth", "posture", "/ˈpɒstʃə/", "n", "tư thế", "Good posture prevents back pain."),
		w("hth", "hydrate", "/ˈhaɪdreɪt/", "v", "bổ sung nước", "Hydrate well during exercise."),
		w("hth", "flexibility", "/fleksəˈbɪləti/", "n", "sự dẻo dai", "Yoga improves flexibility."),
		w("hth", "diet", "/ˈdaɪət/", "n", "chế độ ăn", "A balanced diet is essential."),
	],
}

// ─── Cấp 3 ─────────────────────────────────────────────────────────

const ENVIRONMENT: VocabTopic = {
	id: "environment",
	name: "Môi trường & Khí hậu",
	description: "Từ vựng học thuật về môi trường, biến đổi khí hậu và phát triển bền vững.",
	level: "level_3",
	iconKey: "leaf",
	words: [
		w(
			"env",
			"sustainable",
			"/səˈsteɪnəbl/",
			"adj",
			"bền vững",
			"Sustainable farming protects soil.",
		),
		w("env", "emission", "/ɪˈmɪʃən/", "n", "sự thải khí", "Carbon emissions are rising."),
		w(
			"env",
			"renewable",
			"/rɪˈnjuːəbl/",
			"adj",
			"có thể tái tạo",
			"Solar is a renewable energy source.",
		),
		w(
			"env",
			"deforestation",
			"/diːˌfɒrɪˈsteɪʃən/",
			"n",
			"nạn phá rừng",
			"Deforestation threatens biodiversity.",
		),
		w(
			"env",
			"biodiversity",
			"/ˌbaɪəʊdaɪˈvɜːsəti/",
			"n",
			"đa dạng sinh học",
			"The rainforest has rich biodiversity.",
		),
		w("env", "pollutant", "/pəˈluːtənt/", "n", "chất gây ô nhiễm", "Plastic is a major pollutant."),
		w(
			"env",
			"ecosystem",
			"/ˈiːkəʊsɪstəm/",
			"n",
			"hệ sinh thái",
			"Coral reefs are fragile ecosystems.",
		),
		w("env", "mitigate", "/ˈmɪtɪɡeɪt/", "v", "giảm thiểu", "We must mitigate climate risks."),
		w(
			"env",
			"conservation",
			"/ˌkɒnsəˈveɪʃən/",
			"n",
			"sự bảo tồn",
			"Wildlife conservation is vital.",
		),
		w("env", "ozone", "/ˈəʊzəʊn/", "n", "tầng ozone", "The ozone layer is recovering."),
	],
}

const EDUCATION: VocabTopic = {
	id: "education-academics",
	name: "Giáo dục & Học thuật",
	description: "Từ vựng học thuật dùng trong bài thi, báo cáo và luận văn.",
	level: "level_3",
	iconKey: "graduation",
	words: [
		w(
			"edu",
			"curriculum",
			"/kəˈrɪkjʊləm/",
			"n",
			"chương trình học",
			"The curriculum was recently updated.",
		),
		w("edu", "assessment", "/əˈsesmənt/", "n", "đánh giá", "The assessment is based on two exams."),
		w("edu", "tuition", "/tjuːˈɪʃən/", "n", "học phí", "University tuition is expensive."),
		w("edu", "dissertation", "/ˌdɪsəˈteɪʃən/", "n", "luận văn", "She submitted her dissertation."),
		w(
			"edu",
			"faculty",
			"/ˈfækəlti/",
			"n",
			"khoa, đội ngũ giảng viên",
			"The faculty approved the proposal.",
		),
		w("edu", "scholarship", "/ˈskɒləʃɪp/", "n", "học bổng", "He won a full scholarship."),
		w("edu", "plagiarism", "/ˈpleɪdʒərɪzəm/", "n", "đạo văn", "Plagiarism is strictly forbidden."),
		w("edu", "thesis", "/ˈθiːsɪs/", "n", "luận án", "Her thesis covers climate policy."),
		w(
			"edu",
			"peer-reviewed",
			"/pɪə rɪˈvjuːd/",
			"adj",
			"đã được bình duyệt",
			"Cite only peer-reviewed sources.",
		),
		w("edu", "enrol", "/ɪnˈrəʊl/", "v", "đăng ký nhập học", "Students enrol every September."),
	],
}

// ─── Export ────────────────────────────────────────────────────────

export const MOCK_TOPICS: readonly VocabTopic[] = [
	FAMILY,
	DAILY,
	WORK,
	HEALTH,
	ENVIRONMENT,
	EDUCATION,
]

export function findTopic(topicId: string): VocabTopic | undefined {
	return MOCK_TOPICS.find((t) => t.id === topicId)
}

export async function mockFetchTopics(): Promise<readonly VocabTopic[]> {
	await new Promise((r) => setTimeout(r, 150))
	return MOCK_TOPICS
}

export async function mockFetchTopic(topicId: string): Promise<VocabTopic> {
	await new Promise((r) => setTimeout(r, 150))
	const topic = findTopic(topicId)
	if (!topic) throw new Error(`Không tìm thấy chủ đề "${topicId}"`)
	return topic
}

export const LEVEL_LABELS: Record<VocabLevel, string> = {
	level_1: "Cấp 1",
	level_2: "Cấp 2",
	level_3: "Cấp 3",
}
