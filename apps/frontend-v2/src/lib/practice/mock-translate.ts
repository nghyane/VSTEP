// Mock translate — hardcode từ phổ biến, fallback message.
// Thay bằng API thật sau.

const DICT: Record<string, string> = {
	"post office": "bưu điện",
	"traffic light": "đèn giao thông",
	"turn left": "rẽ trái",
	"turn right": "rẽ phải",
	"go straight": "đi thẳng",
	"next to": "bên cạnh",
	"bakery": "tiệm bánh",
	"cappuccino": "cà phê cappuccino",
	"croissant": "bánh sừng bò",
	"to go": "mang đi",
	"for here": "dùng tại đây",
	"change": "tiền thối",
	"interview": "phỏng vấn",
	"marketing": "tiếp thị",
	"social media": "mạng xã hội",
	"weakness": "điểm yếu",
	"strength": "điểm mạnh",
	"creativity": "sáng tạo",
	"challenge": "thử thách",
	"experience": "kinh nghiệm",
	"climate change": "biến đổi khí hậu",
	"fossil fuels": "nhiên liệu hóa thạch",
	"renewable energy": "năng lượng tái tạo",
	"greenhouse": "nhà kính",
	"temperature": "nhiệt độ",
	"immune system": "hệ miễn dịch",
	"caffeine": "caffeine",
	"depression": "trầm cảm",
	"diabetes": "tiểu đường",
	"schedule": "lịch trình",
	"accommodation": "chỗ ở",
	"homestay": "nhà nghỉ homestay",
	"waterfall": "thác nước",
	"flower": "hoa",
	"however": "tuy nhiên",
	"therefore": "do đó",
	"although": "mặc dù",
	"because": "bởi vì",
	"especially": "đặc biệt",
	"frequently": "thường xuyên",
	"approximately": "khoảng",
	"significant": "đáng kể",
	"consequence": "hậu quả",
	"responsible": "chịu trách nhiệm",
}

export function mockTranslate(text: string): string | null {
	const lower = text.toLowerCase().trim()
	if (!lower) return null

	// Exact match
	if (DICT[lower]) return DICT[lower]

	// Try matching as substring
	for (const [key, value] of Object.entries(DICT)) {
		if (lower === key) return value
	}

	// Single common word fallback
	if (lower.split(/\s+/).length <= 2) {
		return null // no translation found
	}

	return null
}
