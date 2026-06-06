import { useState } from "react"

interface FaqItem {
	question: string
	answer: string
}

const FAQS: FaqItem[] = [
	{
		question: "VSTEP có miễn phí không?",
		answer:
			"Đăng ký miễn phí, được tặng 100 xu. Đề thi cơ bản và luyện kỹ năng hằng ngày miễn phí. Một số đề thi cao cấp và AI chấm chi tiết tính bằng xu.",
	},
	{
		question: "Mình mới mất gốc, có học được không?",
		answer:
			"Được. Bạn tự chọn target level (A2, B1, B2, C1) và deadline phù hợp. Hệ thống tách rõ từng phần luyện theo level, không bắt buộc roadmap.",
	},
	{
		question: "AI chấm bài có chính xác không?",
		answer:
			"AI chấm theo rubric chính thức của Bộ Giáo dục. Phân tích điểm mạnh, gợi ý cải thiện, viết lại từng câu. Kết quả tham khảo, không thay thế giám khảo thật.",
	},
	{
		question: "Mình muốn đổi mục tiêu từ B1 lên B2 thì sao?",
		answer:
			"Mỗi profile gắn với 1 mục tiêu cố định. Bạn tạo profile mới với mục tiêu B2, dữ liệu profile cũ vẫn giữ nguyên để bạn đối chiếu sau này.",
	},
	{
		question: "Có app điện thoại không?",
		answer:
			"Có. VSTEP đã có APK Android để tải trực tiếp trên landing page. Bản web vẫn hoạt động đầy đủ trên máy tính.",
	},
]

export function LandingFAQ() {
	return (
		<section className="py-14 sm:py-20 lg:py-24">
			<div className="mx-auto max-w-[820px] px-4 sm:px-6 lg:px-8">
				<div className="mb-9 text-center sm:mb-12">
					<p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-primary">FAQ</p>
					<h2 className="font-sans text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
						Câu hỏi thường gặp
					</h2>
				</div>
				<div className="flex flex-col gap-3">
					{FAQS.map((f) => (
						<FaqRow key={f.question} item={f} />
					))}
				</div>
			</div>
		</section>
	)
}

function FaqRow({ item }: { item: FaqItem }) {
	const [open, setOpen] = useState(false)
	return (
		<div className="card overflow-hidden">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
			>
				<span className="text-base font-extrabold leading-snug text-foreground">{item.question}</span>
				<Chevron open={open} />
			</button>
			{open && (
				<div className="-mt-1 border-t border-border-light px-4 pb-5 pt-4 text-sm leading-relaxed text-muted sm:px-5">
					{item.answer}
				</div>
			)}
		</div>
	)
}

function Chevron({ open }: { open: boolean }) {
	return (
		<svg
			viewBox="0 0 20 20"
			fill="none"
			stroke="var(--color-muted)"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
			aria-hidden="true"
		>
			<path d="M5 8l5 5 5-5" />
		</svg>
	)
}
