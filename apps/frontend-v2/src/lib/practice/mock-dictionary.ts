// Mock word dictionary — IPA + pos + meaning cho từ phổ biến trong bài đọc.
// Thay bằng API từ điển thật sau.

export interface WordEntry {
	word: string
	ipa: string
	pos: string
	meaning: string
}

const ENTRIES: WordEntry[] = [
	// Common words from reading passages
	{ word: "restaurant", ipa: "/ˈres.tər.ɑːnt/", pos: "noun", meaning: "nhà hàng" },
	{ word: "announce", ipa: "/əˈnaʊns/", pos: "verb", meaning: "thông báo" },
	{ word: "breakfast", ipa: "/ˈbrek.fəst/", pos: "noun", meaning: "bữa sáng" },
	{ word: "pastries", ipa: "/ˈpeɪ.striz/", pos: "noun", meaning: "bánh ngọt" },
	{ word: "smoothie", ipa: "/ˈsmuː.ði/", pos: "noun", meaning: "sinh tố" },
	{ word: "vegetarian", ipa: "/ˌvedʒ.əˈter.i.ən/", pos: "adj", meaning: "chay" },
	{ word: "reservations", ipa: "/ˌrez.ərˈveɪ.ʃənz/", pos: "noun", meaning: "đặt chỗ" },
	{ word: "library", ipa: "/ˈlaɪ.brer.i/", pos: "noun", meaning: "thư viện" },
	{ word: "extended", ipa: "/ɪkˈsten.dɪd/", pos: "adj", meaning: "kéo dài" },
	{ word: "midnight", ipa: "/ˈmɪd.naɪt/", pos: "noun", meaning: "nửa đêm" },
	{ word: "overdue", ipa: "/ˌoʊ.vərˈduː/", pos: "adj", meaning: "quá hạn" },
	{ word: "penalty", ipa: "/ˈpen.əl.ti/", pos: "noun", meaning: "phạt" },
	{ word: "remote", ipa: "/rɪˈmoʊt/", pos: "adj", meaning: "từ xa" },
	{ word: "transformed", ipa: "/trænsˈfɔːrmd/", pos: "verb", meaning: "biến đổi" },
	{ word: "professionals", ipa: "/prəˈfeʃ.ən.əlz/", pos: "noun", meaning: "chuyên gia" },
	{ word: "careers", ipa: "/kəˈrɪrz/", pos: "noun", meaning: "sự nghiệp" },
	{ word: "survey", ipa: "/ˈsɜːr.veɪ/", pos: "noun", meaning: "khảo sát" },
	{ word: "pandemic", ipa: "/pænˈdem.ɪk/", pos: "noun", meaning: "đại dịch" },
	{ word: "commuting", ipa: "/kəˈmjuː.tɪŋ/", pos: "noun", meaning: "đi lại" },
	{ word: "productive", ipa: "/prəˈdʌk.tɪv/", pos: "adj", meaning: "năng suất" },
	{ word: "isolation", ipa: "/ˌaɪ.səˈleɪ.ʃən/", pos: "noun", meaning: "sự cô lập" },
	{ word: "hybrid", ipa: "/ˈhaɪ.brɪd/", pos: "adj", meaning: "kết hợp" },
	{ word: "flexible", ipa: "/ˈflek.sə.bəl/", pos: "adj", meaning: "linh hoạt" },
	{ word: "competitors", ipa: "/kəmˈpet.ɪ.tərz/", pos: "noun", meaning: "đối thủ" },
	{ word: "talent", ipa: "/ˈtæl.ənt/", pos: "noun", meaning: "nhân tài" },
	{ word: "urban", ipa: "/ˈɜːr.bən/", pos: "adj", meaning: "đô thị" },
	{ word: "gardening", ipa: "/ˈɡɑːr.dən.ɪŋ/", pos: "noun", meaning: "làm vườn" },
	{ word: "popularity", ipa: "/ˌpɑː.pjəˈlær.ə.ti/", pos: "noun", meaning: "sự phổ biến" },
	{ word: "balconies", ipa: "/ˈbæl.kə.niz/", pos: "noun", meaning: "ban công" },
	{ word: "herbs", ipa: "/hɜːrbz/", pos: "noun", meaning: "thảo mộc" },
	{ word: "vegetables", ipa: "/ˈvedʒ.tə.bəlz/", pos: "noun", meaning: "rau củ" },
	{ word: "artificial", ipa: "/ˌɑːr.tɪˈfɪʃ.əl/", pos: "adj", meaning: "nhân tạo" },
	{ word: "intelligence", ipa: "/ɪnˈtel.ɪ.dʒəns/", pos: "noun", meaning: "trí tuệ" },
	{ word: "personalized", ipa: "/ˈpɜːr.sən.əl.aɪzd/", pos: "adj", meaning: "cá nhân hóa" },
	{ word: "platform", ipa: "/ˈplæt.fɔːrm/", pos: "noun", meaning: "nền tảng" },
	{ word: "biodiversity", ipa: "/ˌbaɪ.oʊ.daɪˈvɜːr.sə.ti/", pos: "noun", meaning: "đa dạng sinh học" },
	{ word: "coral", ipa: "/ˈkɔːr.əl/", pos: "noun", meaning: "san hô" },
	{ word: "species", ipa: "/ˈspiː.ʃiːz/", pos: "noun", meaning: "loài" },
	{ word: "unprecedented", ipa: "/ʌnˈpres.ɪ.den.tɪd/", pos: "adj", meaning: "chưa từng có" },
	{ word: "threats", ipa: "/θrets/", pos: "noun", meaning: "mối đe dọa" },
	// From listening passages
	{ word: "bakery", ipa: "/ˈbeɪ.kər.i/", pos: "noun", meaning: "tiệm bánh" },
	{ word: "straight", ipa: "/streɪt/", pos: "adverb", meaning: "thẳng" },
	{ word: "traffic", ipa: "/ˈtræf.ɪk/", pos: "noun", meaning: "giao thông" },
	{ word: "interview", ipa: "/ˈɪn.tər.vjuː/", pos: "noun", meaning: "cuộc phỏng vấn" },
	{ word: "challenge", ipa: "/ˈtʃæl.ɪndʒ/", pos: "noun", meaning: "thử thách" },
	{ word: "international", ipa: "/ˌɪn.tərˈnæʃ.ən.əl/", pos: "adj", meaning: "quốc tế" },
	{ word: "creativity", ipa: "/ˌkriː.eɪˈtɪv.ə.ti/", pos: "noun", meaning: "sự sáng tạo" },
	{ word: "weakness", ipa: "/ˈwiːk.nəs/", pos: "noun", meaning: "điểm yếu" },
	{ word: "strength", ipa: "/streŋθ/", pos: "noun", meaning: "điểm mạnh" },
	{ word: "experience", ipa: "/ɪkˈspɪr.i.əns/", pos: "noun", meaning: "kinh nghiệm" },
	{ word: "accommodation", ipa: "/əˌkɑː.məˈdeɪ.ʃən/", pos: "noun", meaning: "chỗ ở" },
	{ word: "schedule", ipa: "/ˈskedʒ.uːl/", pos: "noun", meaning: "lịch trình" },
	{ word: "climate", ipa: "/ˈklaɪ.mət/", pos: "noun", meaning: "khí hậu" },
	{ word: "atmosphere", ipa: "/ˈæt.mə.sfɪr/", pos: "noun", meaning: "khí quyển" },
	{ word: "temperature", ipa: "/ˈtem.prə.tʃər/", pos: "noun", meaning: "nhiệt độ" },
	{ word: "glaciers", ipa: "/ˈɡleɪ.ʃərz/", pos: "noun", meaning: "sông băng" },
	{ word: "emissions", ipa: "/ɪˈmɪʃ.ənz/", pos: "noun", meaning: "khí thải" },
	{ word: "renewable", ipa: "/rɪˈnuː.ə.bəl/", pos: "adj", meaning: "tái tạo" },
	{ word: "consumption", ipa: "/kənˈsʌmp.ʃən/", pos: "noun", meaning: "tiêu thụ" },
	{ word: "generations", ipa: "/ˌdʒen.əˈreɪ.ʃənz/", pos: "noun", meaning: "thế hệ" },
	{ word: "especially", ipa: "/ɪˈspeʃ.əl.i/", pos: "adverb", meaning: "đặc biệt" },
	{ word: "however", ipa: "/haʊˈev.ər/", pos: "adverb", meaning: "tuy nhiên" },
	{ word: "although", ipa: "/ɔːlˈðoʊ/", pos: "conjunction", meaning: "mặc dù" },
	{ word: "significant", ipa: "/sɪɡˈnɪf.ɪ.kənt/", pos: "adj", meaning: "đáng kể" },
	{ word: "depression", ipa: "/dɪˈpreʃ.ən/", pos: "noun", meaning: "trầm cảm" },
	{ word: "dramatically", ipa: "/drəˈmæt.ɪ.kəl.i/", pos: "adverb", meaning: "đáng kể" },
]

// Index by lowercase word for fast lookup
const INDEX = new Map<string, WordEntry>()
for (const e of ENTRIES) {
	INDEX.set(e.word.toLowerCase(), e)
}

export function lookupWord(word: string): WordEntry | null {
	const clean = word.toLowerCase().replace(/[.,!?;:'"()]/g, "").trim()
	return INDEX.get(clean) ?? null
}
