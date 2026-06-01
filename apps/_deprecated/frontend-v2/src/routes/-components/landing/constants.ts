import {
	BookOpenText,
	BrainCircuit,
	CheckCircle2,
	ClipboardCheck,
	Flame,
	Headphones,
	type LucideIcon,
	MessageSquareText,
	Mic,
	PencilLine,
	Route,
	Sparkles,
	Target,
	TrendingUp,
	Zap,
} from "lucide-react"

/* ── Skills ─────────────────────────────────────────────────────── */

export interface Skill {
	label: string
	desc: string
	detail: string
	icon: LucideIcon
	color: string
	bg: string
}

export const SKILLS: readonly Skill[] = [
	{
		label: "Listening",
		desc: "Nghe hội thoại & bài giảng",
		detail: "3 parts, 35 câu hỏi mỗi đề — từ hội thoại ngắn đến bài giảng học thuật dài.",
		icon: Headphones,
		color: "text-skill-listening",
		bg: "bg-skill-listening/10",
	},
	{
		label: "Reading",
		desc: "Đọc hiểu văn bản",
		detail: "4 passages, 40 câu hỏi — luyện scanning, skimming và suy luận ngữ cảnh.",
		icon: BookOpenText,
		color: "text-skill-reading",
		bg: "bg-skill-reading/10",
	},
	{
		label: "Writing",
		desc: "Viết thư & luận",
		detail: "2 tasks — AI chấm theo 4 tiêu chí rubric chuẩn, phản hồi chi tiết từng câu.",
		icon: PencilLine,
		color: "text-skill-writing",
		bg: "bg-skill-writing/10",
	},
	{
		label: "Speaking",
		desc: "Nói theo chủ đề",
		detail: "3 parts — ghi âm, AI phân tích phát âm, ngữ pháp, từ vựng và mạch lạc.",
		icon: Mic,
		color: "text-skill-speaking",
		bg: "bg-skill-speaking/10",
	},
]

/* ── AI Features (bento) ────────────────────────────────────────── */

export interface BentoFeature {
	title: string
	desc: string
	icon: LucideIcon
	size: "large" | "small"
}

export const BENTO_FEATURES: readonly BentoFeature[] = [
	{
		title: "AI chấm Writing & Speaking",
		desc: "Phân tích bài viết và bài nói theo 4 tiêu chí rubric chuẩn Bộ GD&ĐT. Nhận phản hồi chi tiết từng câu, gợi ý sửa lỗi cụ thể — trong vài phút thay vì vài ngày.",
		icon: BrainCircuit,
		size: "large",
	},
	{
		title: "Phản hồi từng câu",
		desc: "Highlight lỗi ngữ pháp, từ vựng, mạch lạc ngay trên bài làm.",
		icon: MessageSquareText,
		size: "small",
	},
	{
		title: "Gợi ý bài mẫu",
		desc: "Xem bài mẫu band cao để học cách diễn đạt tự nhiên hơn.",
		icon: Sparkles,
		size: "small",
	},
	{
		title: "Theo dõi tiến bộ",
		desc: "Biểu đồ điểm theo thời gian, so sánh với mục tiêu đặt ra.",
		icon: TrendingUp,
		size: "small",
	},
	{
		title: "Lộ trình cá nhân",
		desc: "AI gợi ý bài tập phù hợp dựa trên điểm yếu của bạn.",
		icon: Route,
		size: "small",
	},
]

/* ── Steps ──────────────────────────────────────────────────────── */

export interface Step {
	title: string
	desc: string
	icon: LucideIcon
	image: string
}

export const STEPS: readonly Step[] = [
	{
		title: "Làm bài thi thử",
		desc: "Chọn đề thi VSTEP đầy đủ 4 kỹ năng hoặc luyện riêng từng phần. Bắt đầu chỉ trong 30 giây.",
		icon: CheckCircle2,
		image: "/images/buoc1.jpg",
	},
	{
		title: "AI chấm điểm tức thì",
		desc: "Hệ thống AI phân tích bài Writing và Speaking theo rubric chuẩn, trả kết quả trong vài phút.",
		icon: Target,
		image: "/images/buoc2.jpg",
	},
	{
		title: "Xem lộ trình cá nhân",
		desc: "Nhận phân tích điểm mạnh - yếu và bài tập được gợi ý riêng theo trình độ của bạn.",
		icon: Flame,
		image: "/images/buoc3.jpg",
	},
]

/* ── Stats ──────────────────────────────────────────────────────── */

export interface Stat {
	value: string
	label: string
	icon: LucideIcon
}

export const HERO_STATS: readonly Stat[] = [
	{ value: "50+", label: "đề thi thử", icon: ClipboardCheck },
	{ value: "2,000+", label: "câu hỏi", icon: Zap },
	{ value: "10,000+", label: "học viên", icon: TrendingUp },
]

/* ── Testimonials ───────────────────────────────────────────────── */

export interface Testimonial {
	name: string
	role: string
	quote: string
	badge: string
	avatar: string
	initials: string
}

export const TESTIMONIALS: readonly Testimonial[] = [
	{
		name: "Minh Anh",
		role: "Sinh viên ĐH Bách Khoa",
		quote:
			"Mình từ B1 lên B2 sau 2 tháng luyện tập. AI chấm Writing rất chi tiết, chỉ ra đúng lỗi cần sửa.",
		badge: "B1 → B2",
		avatar: "https://i.pravatar.cc/150?img=32",
		initials: "MA",
	},
	{
		name: "Thanh Hà",
		role: "Nhân viên văn phòng",
		quote:
			"Giao diện dễ dùng, luyện 15 phút mỗi ngày trên điện thoại. Tiết kiệm thời gian hơn đi học trung tâm.",
		badge: "B2 → C1",
		avatar: "https://i.pravatar.cc/150?img=47",
		initials: "TH",
	},
	{
		name: "Đức Huy",
		role: "Giảng viên tiếng Anh",
		quote:
			"Đề thi sát chuẩn VSTEP, phù hợp để giới thiệu cho sinh viên luyện tập thêm ngoài giờ học.",
		badge: "Đề xuất cho SV",
		avatar: "https://i.pravatar.cc/150?img=11",
		initials: "ĐH",
	},
]

/* ── Roadmap ────────────────────────────────────────────────────── */

export interface RoadmapBand {
	level: string
	label: string
	desc: string
	items: string[]
}

export const ROADMAP_BANDS: readonly RoadmapBand[] = [
	{
		level: "B1",
		label: "Trung cấp",
		desc: "Giao tiếp trong công việc và đời sống hàng ngày.",
		items: ["Nghe hiểu hội thoại", "Viết thư cơ bản", "Đọc hiểu văn bản ngắn"],
	},
	{
		level: "B2",
		label: "Trung cấp cao",
		desc: "Tự tin trong môi trường học thuật và chuyên môn.",
		items: ["Nghe bài giảng dài", "Viết luận có cấu trúc", "Nói trôi chảy"],
	},
	{
		level: "C1",
		label: "Nâng cao",
		desc: "Sử dụng tiếng Anh linh hoạt trong mọi tình huống phức tạp.",
		items: ["Nghe mọi ngữ cảnh", "Viết học thuật", "Thuyết trình chuyên sâu"],
	},
]
