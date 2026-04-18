// Mock vocabulary data — FE mock trước khi backend có schema.
// Khi nối API: xóa file này, sửa queryFn trong lib/queries/vocabulary.ts

import type { VstepLevel, VstepTask } from "#/lib/types/vstep"

// ─── Types ─────────────────────────────────────────────────────

export interface VocabWord {
	id: string
	word: string
	phonetic: string
	partOfSpeech: string
	definition: string
	example: string
	synonyms: string[]
	collocations: string[]
	wordFamily: string[]
	vstepTip?: string
}

export interface VocabMCQ {
	kind: "mcq"
	id: string
	prompt: string
	options: [string, string, string, string]
	correctIndex: 0 | 1 | 2 | 3
	explanation: string
}

export interface VocabFillBlank {
	kind: "fill-blank"
	id: string
	sentence: string
	acceptedAnswers: string[]
	explanation: string
}

export interface VocabWordForm {
	kind: "word-form"
	id: string
	instruction: string
	sentence: string
	rootWord: string
	acceptedAnswers: string[]
	explanation: string
}

export type VocabExercise = VocabMCQ | VocabFillBlank | VocabWordForm

export interface VocabTopic {
	id: string
	name: string
	description: string
	level: VstepLevel
	tasks: VstepTask[]
	iconKey: "family" | "sun" | "briefcase" | "heart" | "leaf" | "graduation"
	words: VocabWord[]
	exercises: VocabExercise[]
}

// ─── Helpers ───────────────────────────────────────────────────

function w(
	topicId: string,
	word: string,
	phonetic: string,
	partOfSpeech: string,
	definition: string,
	example: string,
	synonyms: string[],
	collocations: string[],
	wordFamily: string[],
	vstepTip?: string,
): VocabWord {
	const slug = word.toLowerCase().replace(/[^a-z0-9]+/g, "-")
	return {
		id: `${topicId}:${slug}`,
		word,
		phonetic,
		partOfSpeech,
		definition,
		example,
		synonyms,
		collocations,
		wordFamily,
		vstepTip,
	}
}

function mcq(
	id: string,
	prompt: string,
	options: [string, string, string, string],
	correctIndex: 0 | 1 | 2 | 3,
	explanation: string,
): VocabMCQ {
	return { kind: "mcq", id, prompt, options, correctIndex, explanation }
}

function fb(
	id: string,
	sentence: string,
	acceptedAnswers: string[],
	explanation: string,
): VocabFillBlank {
	return { kind: "fill-blank", id, sentence, acceptedAnswers, explanation }
}

function wf(
	id: string,
	instruction: string,
	sentence: string,
	rootWord: string,
	acceptedAnswers: string[],
	explanation: string,
): VocabWordForm {
	return { kind: "word-form", id, instruction, sentence, rootWord, acceptedAnswers, explanation }
}

// ─── B1 Topics ─────────────────────────────────────────────────

const FAMILY: VocabTopic = {
	id: "family-relationships",
	name: "Gia đình & Mối quan hệ",
	description: "Từ vựng về thành viên gia đình và các mối quan hệ thường ngày.",
	level: "B1",
	tasks: ["SP1", "WT1", "READ"],
	iconKey: "family",
	words: [
		w(
			"fam",
			"relative",
			"/ˈrelətɪv/",
			"n",
			"người thân, họ hàng",
			"My relatives live in Hanoi.",
			["kin", "family member"],
			["close relative", "distant relative"],
			["relate (v)", "relation (n)", "relatively (adv)"],
			"Hay gặp trong Reading passage về gia đình/xã hội.",
		),
		w(
			"fam",
			"sibling",
			"/ˈsɪblɪŋ/",
			"n",
			"anh/chị/em ruột",
			"I have two siblings.",
			["brother/sister"],
			["older sibling", "younger sibling"],
			[],
			"Dùng trong Speaking Part 1 khi nói về gia đình.",
		),
		w(
			"fam",
			"spouse",
			"/spaʊs/",
			"n",
			"vợ hoặc chồng",
			"Her spouse works abroad.",
			["husband/wife", "partner"],
			["loving spouse"],
			[],
		),
		w(
			"fam",
			"parent",
			"/ˈpeərənt/",
			"n",
			"cha hoặc mẹ",
			"Both my parents are teachers.",
			["mother/father"],
			["single parent", "working parent"],
			["parental (adj)", "parenting (n)"],
		),
		w("fam", "nephew", "/ˈnefjuː/", "n", "cháu trai", "My nephew is ten years old.", [], [], []),
		w("fam", "niece", "/niːs/", "n", "cháu gái", "Her niece just started school.", [], [], []),
		w(
			"fam",
			"close",
			"/kləʊs/",
			"adj",
			"thân thiết",
			"We are very close friends.",
			["intimate", "tight-knit"],
			["close friend", "close relationship"],
			["closeness (n)", "closely (adv)"],
		),
		w(
			"fam",
			"raise",
			"/reɪz/",
			"v",
			"nuôi dạy",
			"They raised three children.",
			["bring up", "nurture"],
			["raise a child", "raise a family"],
			[],
		),
		w(
			"fam",
			"support",
			"/səˈpɔːt/",
			"v",
			"hỗ trợ",
			"Families should support each other.",
			["help", "assist"],
			["emotional support", "financial support"],
			["supportive (adj)", "supporter (n)"],
			"Từ đa nghĩa, hay gặp trong cả Reading và Writing.",
		),
		w(
			"fam",
			"quarrel",
			"/ˈkwɒrəl/",
			"v",
			"cãi vã",
			"They rarely quarrel.",
			["argue", "dispute"],
			["family quarrel"],
			[],
		),
	],
	exercises: [
		mcq(
			"fam-mcq-1",
			"My ___ live in the countryside.",
			["relatives", "relations", "relationships", "relators"],
			0,
			"'Relatives' = người thân. 'Relations' thường dùng cho quan hệ trừu tượng.",
		),
		mcq(
			"fam-mcq-2",
			"She is a very ___ friend of mine.",
			["close", "near", "tight", "narrow"],
			0,
			"'Close friend' là collocation chuẩn.",
		),
		fb(
			"fam-fb-1",
			"Both my parents are very ___ of my career choice.",
			["supportive"],
			"'Supportive' (adj) = ủng hộ, từ word family của 'support'.",
		),
		fb(
			"fam-fb-2",
			"They ___ three children in a small village.",
			["raised"],
			"'Raise a child' = nuôi dạy con.",
		),
		wf(
			"fam-wf-1",
			"Điền dạng đúng của từ trong ngoặc.",
			"The ___ (relate) between parents and children is important.",
			"relate",
			["relationship"],
			"'Relate' (v) → 'relationship' (n) = mối quan hệ.",
		),
	],
}

const DAILY: VocabTopic = {
	id: "daily-routines",
	name: "Sinh hoạt hằng ngày",
	description: "Các hoạt động và thói quen trong ngày.",
	level: "B1",
	tasks: ["SP1", "WT1"],
	iconKey: "sun",
	words: [
		w(
			"day",
			"routine",
			"/ruːˈtiːn/",
			"n",
			"thói quen, lịch sinh hoạt",
			"I have a strict morning routine.",
			["habit", "schedule"],
			["daily routine", "morning routine"],
			[],
			"Dùng trong Speaking Part 1 khi mô tả ngày thường.",
		),
		w(
			"day",
			"commute",
			"/kəˈmjuːt/",
			"v",
			"đi lại đến nơi làm việc",
			"She commutes by bus.",
			["travel to work"],
			["daily commute", "long commute"],
			["commuter (n)"],
		),
		w(
			"day",
			"chore",
			"/tʃɔː/",
			"n",
			"việc vặt trong nhà",
			"Doing chores is part of life.",
			["housework", "task"],
			["household chore", "daily chore"],
			[],
		),
		w(
			"day",
			"errand",
			"/ˈerənd/",
			"n",
			"việc lặt vặt cần làm ngoài",
			"I need to run some errands.",
			["task"],
			["run errands"],
			[],
		),
		w(
			"day",
			"nap",
			"/næp/",
			"n",
			"giấc ngủ ngắn",
			"I take a short nap after lunch.",
			["doze", "snooze"],
			["take a nap", "afternoon nap"],
			[],
		),
		w(
			"day",
			"leisure",
			"/ˈleʒə/",
			"n",
			"thời gian rảnh rỗi",
			"Reading is my favorite leisure activity.",
			["free time", "recreation"],
			["leisure time", "leisure activity"],
			["leisurely (adj/adv)"],
		),
		w(
			"day",
			"commuter",
			"/kəˈmjuːtə/",
			"n",
			"người đi làm xa",
			"The train is full of commuters.",
			[],
			[],
			["commute (v)"],
		),
		w(
			"day",
			"tidy",
			"/ˈtaɪdi/",
			"v",
			"dọn dẹp gọn gàng",
			"Please tidy your room.",
			["clean up", "organize"],
			["tidy up"],
			["tidiness (n)"],
		),
		w(
			"day",
			"grocery",
			"/ˈɡrəʊsəri/",
			"n",
			"hàng tạp hóa",
			"I go grocery shopping on Sundays.",
			[],
			["grocery store", "grocery shopping"],
			[],
		),
		w(
			"day",
			"laundry",
			"/ˈlɔːndri/",
			"n",
			"giặt giũ",
			"I do the laundry twice a week.",
			["washing"],
			["do the laundry"],
			[],
		),
	],
	exercises: [
		mcq(
			"day-mcq-1",
			"I need to ___ some errands before lunch.",
			["run", "do", "make", "take"],
			0,
			"'Run errands' là collocation chuẩn.",
		),
		mcq(
			"day-mcq-2",
			"She has a very busy daily ___.",
			["routine", "habit", "custom", "manner"],
			0,
			"'Daily routine' = lịch sinh hoạt hằng ngày.",
		),
		fb(
			"day-fb-1",
			"He ___ to work by train every day.",
			["commutes"],
			"'Commute' = đi lại đến nơi làm việc.",
		),
		fb(
			"day-fb-2",
			"I usually take a short ___ after lunch.",
			["nap"],
			"'Take a nap' = ngủ trưa ngắn.",
		),
		wf(
			"day-wf-1",
			"Điền dạng đúng của từ trong ngoặc.",
			"She walked ___ (leisure) through the park.",
			"leisure",
			["leisurely"],
			"'Leisure' (n) → 'leisurely' (adj/adv) = thong thả.",
		),
	],
}

// ─── B2 Topics ─────────────────────────────────────────────────

const WORK: VocabTopic = {
	id: "work-career",
	name: "Công việc & Sự nghiệp",
	description: "Thuật ngữ cơ bản về công việc, nghề nghiệp và môi trường văn phòng.",
	level: "B2",
	tasks: ["SP1", "SP3", "WT2", "READ"],
	iconKey: "briefcase",
	words: [
		w(
			"wrk",
			"colleague",
			"/ˈkɒliːɡ/",
			"n",
			"đồng nghiệp",
			"My colleagues are very supportive.",
			["coworker", "workmate"],
			["close colleague"],
			[],
		),
		w(
			"wrk",
			"deadline",
			"/ˈdedlaɪn/",
			"n",
			"hạn chót",
			"We are rushing to meet the deadline.",
			["due date"],
			["meet a deadline", "miss a deadline", "tight deadline"],
			[],
			"Hay gặp trong Reading passage về công việc.",
		),
		w(
			"wrk",
			"promotion",
			"/prəˈməʊʃən/",
			"n",
			"sự thăng chức",
			"She got a promotion last month.",
			["advancement"],
			["get a promotion", "earn a promotion"],
			["promote (v)", "promotional (adj)"],
		),
		w(
			"wrk",
			"resign",
			"/rɪˈzaɪn/",
			"v",
			"xin nghỉ việc",
			"He resigned to start his own business.",
			["quit", "step down"],
			["resign from a position"],
			["resignation (n)"],
		),
		w(
			"wrk",
			"overtime",
			"/ˈəʊvətaɪm/",
			"n",
			"làm thêm giờ",
			"Working overtime is exhausting.",
			[],
			["work overtime", "overtime pay"],
			[],
		),
		w(
			"wrk",
			"negotiate",
			"/nɪˈɡəʊʃieɪt/",
			"v",
			"thương lượng",
			"We negotiated a better salary.",
			["bargain", "discuss terms"],
			["negotiate a deal", "negotiate a salary"],
			["negotiation (n)", "negotiable (adj)"],
		),
		w(
			"wrk",
			"freelance",
			"/ˈfriːlɑːns/",
			"adj",
			"tự do, làm độc lập",
			"She works as a freelance designer.",
			["independent", "self-employed"],
			["freelance work"],
			["freelancer (n)"],
		),
		w(
			"wrk",
			"workload",
			"/ˈwɜːkləʊd/",
			"n",
			"khối lượng công việc",
			"My workload has doubled.",
			[],
			["heavy workload", "manage workload"],
			[],
		),
		w(
			"wrk",
			"skillset",
			"/ˈskɪlset/",
			"n",
			"bộ kỹ năng",
			"Her skillset is impressive.",
			["abilities", "competencies"],
			["develop a skillset"],
			[],
		),
		w(
			"wrk",
			"mentor",
			"/ˈmentɔː/",
			"n",
			"người hướng dẫn",
			"He is my career mentor.",
			["guide", "advisor"],
			["career mentor"],
			["mentoring (n)", "mentorship (n)"],
		),
	],
	exercises: [
		mcq(
			"wrk-mcq-1",
			"We need to ___ the deadline or the client will be upset.",
			["meet", "reach", "catch", "hit"],
			0,
			"'Meet a deadline' là collocation chuẩn.",
		),
		mcq(
			"wrk-mcq-2",
			"She ___ from her position after 10 years.",
			["resigned", "fired", "retired", "promoted"],
			0,
			"'Resign from' = tự xin nghỉ việc.",
		),
		fb(
			"wrk-fb-1",
			"They are ___ a new contract with the supplier.",
			["negotiating"],
			"'Negotiate' = thương lượng.",
		),
		fb(
			"wrk-fb-2",
			"He got a ___ after three years of hard work.",
			["promotion"],
			"'Get a promotion' = được thăng chức.",
		),
		wf(
			"wrk-wf-1",
			"Điền dạng đúng của từ trong ngoặc.",
			"The ___ (negotiate) lasted for three hours.",
			"negotiate",
			["negotiation"],
			"'Negotiate' (v) → 'negotiation' (n).",
		),
	],
}

const HEALTH: VocabTopic = {
	id: "health-fitness",
	name: "Sức khỏe & Thể chất",
	description: "Từ vựng về rèn luyện sức khỏe, dinh dưỡng và lối sống.",
	level: "B2",
	tasks: ["SP1", "SP3", "WT2", "READ"],
	iconKey: "heart",
	words: [
		w(
			"hth",
			"nutrition",
			"/njuːˈtrɪʃən/",
			"n",
			"dinh dưỡng",
			"Good nutrition is key to health.",
			["diet", "nourishment"],
			["good nutrition", "proper nutrition"],
			["nutritious (adj)", "nutritional (adj)", "nutrient (n)"],
			"Chủ đề phổ biến trong Writing Task 2 và Speaking Part 3.",
		),
		w(
			"hth",
			"workout",
			"/ˈwɜːkaʊt/",
			"n",
			"buổi tập luyện",
			"I do a workout every morning.",
			["exercise session", "training"],
			["daily workout", "intense workout"],
			[],
		),
		w(
			"hth",
			"injury",
			"/ˈɪndʒəri/",
			"n",
			"chấn thương",
			"He recovered from a knee injury.",
			["wound", "harm"],
			["serious injury", "sports injury"],
			["injure (v)", "injured (adj)"],
		),
		w(
			"hth",
			"stamina",
			"/ˈstæmɪnə/",
			"n",
			"sức bền",
			"Running builds stamina.",
			["endurance"],
			["build stamina", "physical stamina"],
			[],
		),
		w(
			"hth",
			"recover",
			"/rɪˈkʌvə/",
			"v",
			"hồi phục",
			"She recovered quickly from the flu.",
			["heal", "get better"],
			["recover from an illness", "full recovery"],
			["recovery (n)"],
		),
		w(
			"hth",
			"immune",
			"/ɪˈmjuːn/",
			"adj",
			"miễn dịch",
			"Vitamin C boosts the immune system.",
			[],
			["immune system", "immune response"],
			["immunity (n)", "immunize (v)"],
		),
		w(
			"hth",
			"posture",
			"/ˈpɒstʃə/",
			"n",
			"tư thế",
			"Good posture prevents back pain.",
			[],
			["good posture", "poor posture"],
			[],
		),
		w(
			"hth",
			"hydrate",
			"/ˈhaɪdreɪt/",
			"v",
			"bổ sung nước",
			"Hydrate well during exercise.",
			[],
			["stay hydrated"],
			["hydration (n)", "dehydrate (v)"],
		),
		w(
			"hth",
			"flexibility",
			"/fleksəˈbɪləti/",
			"n",
			"sự dẻo dai",
			"Yoga improves flexibility.",
			["suppleness"],
			["improve flexibility"],
			["flexible (adj)"],
		),
		w(
			"hth",
			"diet",
			"/ˈdaɪət/",
			"n",
			"chế độ ăn",
			"A balanced diet is essential.",
			["eating habits"],
			["balanced diet", "healthy diet", "strict diet"],
			["dietary (adj)"],
		),
	],
	exercises: [
		mcq(
			"hth-mcq-1",
			"A balanced ___ is essential for good health.",
			["diet", "food", "meal", "dish"],
			0,
			"'Balanced diet' = chế độ ăn cân bằng.",
		),
		mcq(
			"hth-mcq-2",
			"She ___ quickly from the surgery.",
			["recovered", "healed", "cured", "treated"],
			0,
			"'Recover from' = hồi phục sau bệnh/phẫu thuật.",
		),
		fb(
			"hth-fb-1",
			"Eating ___ food helps you stay healthy.",
			["nutritious"],
			"'Nutritious' (adj) = giàu dinh dưỡng, từ word family của 'nutrition'.",
		),
		fb(
			"hth-fb-2",
			"You should stay ___ during hot weather.",
			["hydrated"],
			"'Stay hydrated' = giữ đủ nước.",
		),
		wf(
			"hth-wf-1",
			"Điền dạng đúng của từ trong ngoặc.",
			"The doctor recommended a ___ (nutrition) plan for the patient.",
			"nutrition",
			["nutritional"],
			"'Nutrition' (n) → 'nutritional' (adj) = thuộc về dinh dưỡng.",
		),
	],
}

// ─── C1 Topics ─────────────────────────────────────────────────

const ENVIRONMENT: VocabTopic = {
	id: "environment",
	name: "Môi trường & Khí hậu",
	description: "Từ vựng học thuật về môi trường, biến đổi khí hậu và phát triển bền vững.",
	level: "C1",
	tasks: ["WT2", "SP3", "READ"],
	iconKey: "leaf",
	words: [
		w(
			"env",
			"sustainable",
			"/səˈsteɪnəbl/",
			"adj",
			"bền vững",
			"Sustainable farming protects soil.",
			["eco-friendly"],
			["sustainable development", "sustainable energy"],
			["sustain (v)", "sustainability (n)"],
			"Từ khóa quan trọng trong Writing Task 2 về môi trường.",
		),
		w(
			"env",
			"emission",
			"/ɪˈmɪʃən/",
			"n",
			"sự thải khí",
			"Carbon emissions are rising.",
			["discharge", "output"],
			["carbon emission", "reduce emissions"],
			["emit (v)"],
		),
		w(
			"env",
			"renewable",
			"/rɪˈnjuːəbl/",
			"adj",
			"có thể tái tạo",
			"Solar is a renewable energy source.",
			[],
			["renewable energy", "renewable resources"],
			["renew (v)"],
		),
		w(
			"env",
			"deforestation",
			"/diːˌfɒrɪˈsteɪʃən/",
			"n",
			"nạn phá rừng",
			"Deforestation threatens biodiversity.",
			[],
			["illegal deforestation", "combat deforestation"],
			["deforest (v)", "forest (n)"],
		),
		w(
			"env",
			"biodiversity",
			"/ˌbaɪəʊdaɪˈvɜːsəti/",
			"n",
			"đa dạng sinh học",
			"The rainforest has rich biodiversity.",
			[],
			["rich biodiversity", "loss of biodiversity"],
			[],
		),
		w(
			"env",
			"pollutant",
			"/pəˈluːtənt/",
			"n",
			"chất gây ô nhiễm",
			"Plastic is a major pollutant.",
			["contaminant"],
			["air pollutant", "water pollutant"],
			["pollute (v)", "pollution (n)"],
		),
		w(
			"env",
			"ecosystem",
			"/ˈiːkəʊsɪstəm/",
			"n",
			"hệ sinh thái",
			"Coral reefs are fragile ecosystems.",
			[],
			["fragile ecosystem", "marine ecosystem"],
			[],
		),
		w(
			"env",
			"mitigate",
			"/ˈmɪtɪɡeɪt/",
			"v",
			"giảm thiểu",
			"We must mitigate climate risks.",
			["reduce", "alleviate"],
			["mitigate the effects", "mitigate risks"],
			["mitigation (n)"],
			"Từ học thuật hay dùng trong essay C1.",
		),
		w(
			"env",
			"conservation",
			"/ˌkɒnsəˈveɪʃən/",
			"n",
			"sự bảo tồn",
			"Wildlife conservation is vital.",
			["preservation", "protection"],
			["wildlife conservation", "conservation efforts"],
			["conserve (v)"],
		),
		w(
			"env",
			"ozone",
			"/ˈəʊzəʊn/",
			"n",
			"tầng ozone",
			"The ozone layer is recovering.",
			[],
			["ozone layer", "ozone depletion"],
			[],
		),
	],
	exercises: [
		mcq(
			"env-mcq-1",
			"The government aims to reduce carbon ___.",
			["emissions", "pollutions", "wastes", "outputs"],
			0,
			"'Carbon emissions' là collocation chuẩn.",
		),
		mcq(
			"env-mcq-2",
			"___ development meets present needs without compromising future generations.",
			["Sustainable", "Renewable", "Recyclable", "Ecological"],
			0,
			"'Sustainable development' = phát triển bền vững.",
		),
		fb(
			"env-fb-1",
			"We must take action to ___ the effects of climate change.",
			["mitigate"],
			"'Mitigate' = giảm thiểu, giảm nhẹ.",
		),
		fb(
			"env-fb-2",
			"Solar energy is a ___ resource.",
			["renewable"],
			"'Renewable resource' = tài nguyên tái tạo.",
		),
		wf(
			"env-wf-1",
			"Điền dạng đúng của từ trong ngoặc.",
			"___ (sustain) is a key goal for modern economies.",
			"sustain",
			["Sustainability"],
			"'Sustain' (v) → 'sustainability' (n).",
		),
	],
}

const EDUCATION: VocabTopic = {
	id: "education-academics",
	name: "Giáo dục & Học thuật",
	description: "Từ vựng học thuật dùng trong bài thi, báo cáo và luận văn.",
	level: "C1",
	tasks: ["WT2", "SP3", "READ"],
	iconKey: "graduation",
	words: [
		w(
			"edu",
			"curriculum",
			"/kəˈrɪkjʊləm/",
			"n",
			"chương trình học",
			"The curriculum was recently updated.",
			["syllabus"],
			["school curriculum", "national curriculum"],
			[],
			"Hay gặp trong Reading và Writing về giáo dục.",
		),
		w(
			"edu",
			"assessment",
			"/əˈsesmənt/",
			"n",
			"đánh giá",
			"The assessment is based on two exams.",
			["evaluation", "appraisal"],
			["continuous assessment", "formal assessment"],
			["assess (v)"],
		),
		w(
			"edu",
			"tuition",
			"/tjuːˈɪʃən/",
			"n",
			"học phí",
			"University tuition is expensive.",
			["fees"],
			["tuition fees", "pay tuition"],
			[],
		),
		w(
			"edu",
			"dissertation",
			"/ˌdɪsəˈteɪʃən/",
			"n",
			"luận văn",
			"She submitted her dissertation.",
			["thesis"],
			["write a dissertation", "submit a dissertation"],
			[],
		),
		w(
			"edu",
			"faculty",
			"/ˈfækəlti/",
			"n",
			"khoa, đội ngũ giảng viên",
			"The faculty approved the proposal.",
			["department", "staff"],
			["faculty member", "faculty of science"],
			[],
		),
		w(
			"edu",
			"scholarship",
			"/ˈskɒləʃɪp/",
			"n",
			"học bổng",
			"He won a full scholarship.",
			["grant", "bursary"],
			["win a scholarship", "full scholarship"],
			["scholar (n)"],
		),
		w(
			"edu",
			"plagiarism",
			"/ˈpleɪdʒərɪzəm/",
			"n",
			"đạo văn",
			"Plagiarism is strictly forbidden.",
			[],
			["commit plagiarism", "avoid plagiarism"],
			["plagiarize (v)"],
		),
		w(
			"edu",
			"thesis",
			"/ˈθiːsɪs/",
			"n",
			"luận án",
			"Her thesis covers climate policy.",
			["dissertation"],
			["thesis statement", "defend a thesis"],
			[],
		),
		w(
			"edu",
			"peer-reviewed",
			"/pɪə rɪˈvjuːd/",
			"adj",
			"đã được bình duyệt",
			"Cite only peer-reviewed sources.",
			[],
			["peer-reviewed journal", "peer-reviewed article"],
			["peer review (n)"],
		),
		w(
			"edu",
			"enrol",
			"/ɪnˈrəʊl/",
			"v",
			"đăng ký nhập học",
			"Students enrol every September.",
			["register", "sign up"],
			["enrol in a course"],
			["enrolment (n)"],
		),
	],
	exercises: [
		mcq(
			"edu-mcq-1",
			"The university updated its ___ to include more practical courses.",
			["curriculum", "syllabus", "schedule", "timetable"],
			0,
			"'Curriculum' = chương trình học tổng thể.",
		),
		mcq(
			"edu-mcq-2",
			"She won a full ___ to study abroad.",
			["scholarship", "sponsorship", "fellowship", "grant"],
			0,
			"'Win a scholarship' = giành được học bổng.",
		),
		fb(
			"edu-fb-1",
			"Students must ___ in the course before the deadline.",
			["enrol"],
			"'Enrol in' = đăng ký nhập học.",
		),
		fb(
			"edu-fb-2",
			"The ___ is based on both exams and coursework.",
			["assessment"],
			"'Assessment' = đánh giá.",
		),
		wf(
			"edu-wf-1",
			"Điền dạng đúng của từ trong ngoặc.",
			"The teacher will ___ (assessment) the students' progress.",
			"assessment",
			["assess"],
			"'Assessment' (n) → 'assess' (v) = đánh giá.",
		),
	],
}

// ─── Export ────────────────────────────────────────────────────

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
